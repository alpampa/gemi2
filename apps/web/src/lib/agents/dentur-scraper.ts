import { getErrorMessage } from "@/lib/utils/errors";
/**
 * DENTUR AVRASYA — RESMİ HAT SAYFALARINDAN TARİFE PARSE ENGİNİ
 *
 * Kaynak: denturavrasya.com/tr-TR/hatlarimiz/* (resmi hat sayfaları).
 *
 * ÖNEMLİ — SAYFA YAPISI DEĞİŞTİ (doğrulama: 2026-11-27):
 * Site Next.js'e taşındı ve eski `<table>` tabanlı tarifeler kaldırıldı.
 * Üç ayrı yeni biçim var ve her biri ayrı ayrı ele alınır:
 *
 *  1) Beşiktaş–Kadıköy : `day-block` kartları içinde tek tek saat "çipleri"
 *     (time-chip). Gün tipi blok başlığından gelir.
 *  2) Adalar           : hâlâ `<table>`; başlık `section-title` etiketinde
 *     (HAFTA İÇİ / HAFTA SONU GİDİŞ-DÖNÜŞ). Sayfa, kartı bir iframe `srcdoc`
 *     içinde KAÇIŞLI olarak da tekrarlıyor → kimlik üzerinden tekilleştirilir.
 *  3) Üsküdar hatları  : TEK TEK SAAT YAYIMLANMIYOR. Yalnızca "ilk–son sefer"
 *     aralığı ve "her N dakikada bir" sıklığı yazılı. Bu yüzden sahte dakika
 *     ÜRETİLMEZ; kayıt, penceresi boyunca geçerli TEK bir "sürekli/sıklıklı
 *     servis" olarak taşınır (isContinuous + serviceFrequencyLabel).
 *
 * DÜRÜSTLÜK KURALLARI:
 * - Sayfada yazılı olmayan hiçbir saat üretilmez. "Her 10 dakikada bir" bilgisi
 *   saat listesine ÇEVİRİLMEZ; metin olarak taşınır.
 * - Ücret yalnızca sayfada yazılıysa kaydedilir (TAM / İstanbulkart Tam Geçiş).
 * - Hizmet vermeyen gün tipi için kayıt üretilmez.
 */

export type DenturDayType =
  | "WEEKDAY" // Hafta İçi
  | "WEEKDAY_SAT" // Hafta İçi ve Cumartesi
  | "SATURDAY" // Cumartesi
  | "SUNDAY" // Pazar / Resmi Tatil
  | "WEEKEND"; // Hafta Sonu

export interface DenturStopTime {
  name: string;
  time: string;
}

/**
 * Resmî sayfada yazılı ÖZEL SERVİS PENCERESİ (yoğun saat ring seferi, gece
 * sıklığı gibi). Saat LİSTESİ değildir: yalnızca kaynakta yazan aralık ve
 * açıklama aynen taşınır, uydurma dakika üretilmez.
 */
export interface DenturServiceWindow {
  kind: "RUSH" | "NIGHT";
  /** Kaynakta yazılı etiket: "Akşam Yoğun Saat", "Gece Seferleri"... */
  label: string;
  startTime: string;
  endTime: string;
  /** Kaynakta yazılı açıklama (gün kapsamı dahil), aynen. */
  note: string;
}

export interface DenturLineRecord {
  line: string;
  origin: string;
  destination: string;
  directionLabel: string;
  dayType: DenturDayType;
  departureTime: string;
  arrivalTime?: string;
  stops?: DenturStopTime[];
  isContinuous?: boolean;
  continuousUntil?: string;
  /**
   * Resmî sayfada YAZILI sıklık metni (örn. "10 dakikada bir").
   * Tek tek saat listesi değildir; yolcuya aynen gösterilir.
   */
  serviceFrequencyLabel?: string;
  /**
   * Kaynakta yazılı özel servis pencereleri (yoğun saat ring, gece sıklığı).
   * Kayıt tek bir kalkışa indirgendiği için bu bilgiler ayrı taşınır.
   */
  serviceWindows?: DenturServiceWindow[];
  /** Resmî sayfada yazılı tam ücret (örn. "51,81 ₺"). Yoksa tanımsız. */
  price?: string;
}

/** HTML varlıkları ve \uXXXX kaçışlarını çözer (sayfa iki form kullanıyor) */
export function decodeDenturHtml(raw: string): string {
  let out = raw
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
  if (out.includes("\\u003c")) {
    try {
      out = out.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
        String.fromCharCode(parseInt(hex, 16))
      );
    } catch {
      // pas
    }
  }
  return out;
}

const TIME_RE = /^([0-2]\d):[0-5]\d$/;
/** "06:45 – 00:00" ve "06:10-00:45" biçimlerini birlikte yakalar. */
const RANGE_RE = /([0-2]\d:[0-5]\d)\s*[–-]\s*([0-2]\d:[0-5]\d)/;

function cleanCell(cell: string): string {
  return cell.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function uniq<T>(arr: T[], key: (t: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of arr) {
    const k = key(item);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(item);
    }
  }
  return out;
}

/**
 * Sayfadaki gün etiketini kanonik gün tipine çevirir.
 * Sıra ÖNEMLİ: "Hafta İçi ve Cumartesi" hem hafta içi hem cumartesi içerir.
 */
export function denturDayTypeFromLabel(label: string): DenturDayType | null {
  const t = label.toLocaleUpperCase("tr-TR");
  if (t.includes("PAZAR")) return "SUNDAY";
  if (t.includes("HAFTA SONU")) return "WEEKEND";
  if (t.includes("CUMARTESİ") && t.includes("HAFTA İÇİ")) return "WEEKDAY_SAT";
  if (t.includes("CUMARTESİ")) return "SATURDAY";
  if (t.includes("HAFTA İÇİ")) return "WEEKDAY";
  return null;
}

/**
 * HAT: Beşiktaş ↔ Kadıköy
 *
 * Sayfa yapısı (2026-11-27): iki `day-block` kartı
 *   - `day-block--weekday` → "Hafta İçi ve Cumartesi"
 *   - `day-block--weekend` → "Pazar ve Resmi Tatiller"
 * Her kartta `time-chip` sınıflı div'lerde tek tek saatler yazılı.
 * Sayfa, seferlerin "iki yönden de" aynı saatlerde kalktığını belirtir;
 * bu yüzden her saat iki yön için de kaydedilir (kaynakta böyle yazıyor).
 */
export function parseBesiktasKadikoySchedules(html: string): DenturLineRecord[] {
  const d = decodeDenturHtml(html);
  const records: DenturLineRecord[] = [];

  // Böl: [öncesi, kind, gövde, kind, gövde...]
  const parts = d.split(/class="day-block day-block--(weekday|weekend)"/);
  for (let i = 1; i < parts.length; i += 2) {
    const kind = parts[i];
    const body = parts[i + 1] ?? "";
    // Gövdeyi bir sonraki kartın başlığına kadar sınırla (kaçışlı kopyalar
    // aynı belgede tekrarlandığı için tekilleştirme zaten yapılır).
    const times = [
      ...body.matchAll(/time-chip">\s*([0-2]\d:[0-5]\d)\s*</g),
    ].map((m) => m[1]);
    if (times.length === 0) continue;

    const dayType: DenturDayType = kind === "weekend" ? "SUNDAY" : "WEEKDAY_SAT";
    for (const origin of ["Beşiktaş", "Kadıköy"]) {
      const destination = origin === "Beşiktaş" ? "Kadıköy" : "Beşiktaş";
      for (const dep of times) {
        records.push({
          line: "Beşiktaş-Kadıköy",
          origin,
          destination,
          directionLabel: `${origin} → ${destination}`,
          dayType,
          departureTime: dep,
        });
      }
    }
  }

  return uniq(
    records,
    (r) => `${r.line}|${r.origin}|${r.destination}|${r.dayType}|${r.departureTime}`
  );
}

/**
 * HAT: Adalar (Beşiktaş/Kabataş/Sirkeci ↔ Heybeliada/Büyükada)
 *
 * Sayfa yapısı (2026-11-27): dört `schedule-table`
 *   HAFTA İÇİ GİDİŞ / HAFTA İÇİ DÖNÜŞ / HAFTA SONU GİDİŞ / HAFTA SONU DÖNÜŞ
 * Başlık, tablodan ÖNCE gelen `section-title` etiketinde yazılı. Sütun
 * başlıkları iskele adları, her satır bir seferin iskele bazlı saatleri.
 *
 * Sayfa bu kartı bir iframe `srcdoc` içinde KAÇIŞLI olarak tekrarlıyor;
 * aynı tablolar iki kez görünür → kimlik üzerinden tekilleştirilir.
 */
export function parseAdalarSchedules(html: string): DenturLineRecord[] {
  const d = decodeDenturHtml(html);
  const records: DenturLineRecord[] = [];

  const tableStarts = [...d.matchAll(/<table[^>]*>/g)].map((m) => m.index ?? 0);
  for (const start of tableStarts) {
    const endIdx = d.indexOf("</table>", start);
    if (endIdx < 0) continue;
    const block = d.slice(start, endIdx);

    // Tablodan önceki EN YAKIN bölüm başlığı (kaçışlı kopyada da eşleşir).
    const before = d.slice(Math.max(0, start - 2000), start);
    let sectionLabel = "";
    for (const m of before.matchAll(/section-title[^>]*>\s*([^<]{3,60})</g)) {
      sectionLabel = m[1].trim();
    }
    const dayType = denturDayTypeFromLabel(sectionLabel);
    if (!dayType) continue;
    const isGidis = sectionLabel.toLocaleUpperCase("tr-TR").includes("GİDİŞ");

    const rows = (block.match(/<tr[^>]*>([\s\S]*?)<\/tr>/g) || []).map((row) =>
      (row.match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g) || []).map((c) =>
        cleanCell(c)
      )
    );
    if (rows.length < 2) continue;

    const colNames = rows[0].map((h) =>
      h
        .toLocaleUpperCase("tr-TR")
        .replace(/[^A-ZÇĞİÖŞÜ ]/g, "")
        .trim()
    );
    const fromBesiktas = colNames[0].includes("BEŞİKTAŞ");
    const origin = fromBesiktas ? "Beşiktaş" : "Büyükada";
    const destination = fromBesiktas ? "Büyükada" : "Beşiktaş";

    for (let r = 1; r < rows.length; r++) {
      const cells = rows[r];
      const times: DenturStopTime[] = [];
      for (let c = 0; c < colNames.length && c < cells.length; c++) {
        const time = cells[c].trim();
        if (TIME_RE.test(time)) times.push({ name: colNames[c], time });
      }
      if (times.length === 0) continue;

      records.push({
        line: "Adalar",
        origin,
        destination,
        directionLabel: isGidis ? "Gidiş" : "Dönüş",
        dayType,
        departureTime: times[0].time,
        arrivalTime: times[times.length - 1].time,
        stops: times.slice(1, -1),
      });
    }
  }

  return uniq(
    records,
    (r) =>
      `${r.line}|${r.origin}|${r.destination}|${r.dayType}|${r.departureTime}|${
        r.stops?.map((s) => s.time).join(",") ?? ""
      }`
  );
}

/** Resmî sayfada "TAM:" kutusundan tam ücreti çıkarır. */
function parseTamPrice(d: string): string | undefined {
  const m = d.match(/price-box">\s*TAM:\s*<span[^>]*>\s*([^<]+?)\s*</);
  return m ? m[1].trim() : undefined;
}

/** Resmî sayfada "İstanbulkart Tam Geçiş" satırından ücreti çıkarır. */
function parseIstanbulkartTam(d: string): string | undefined {
  const m = d.match(
    /price"><span>\s*İstanbulkart Tam Geçiş\s*<\/span>\s*<span>\s*([^<]+?)\s*</
  );
  return m ? m[1].trim() : undefined;
}

/**
 * HAT: Üsküdar ↔ Kabataş
 *
 * Sayfa yapısı (2026-11-27): iki `uskudar-card__day-block` (Üsküdar Kalkış /
 * Kabataş Kalkış). Her blokta `time-row` satırları:
 *   "Hafta İçi:" → "06:45 – 00:00"   (ilk ve son sefer)
 * Sayfanın üstünde `freq-item` blokları sıklığı verir:
 *   Hafta İçi → "10 Dakikada Bir" vb.
 *
 * TEK TEK SAAT YOK → tek kayıt: departureTime = ilk sefer,
 * continuousUntil = son sefer, serviceFrequencyLabel = yazılı sıklık.
 */
/**
 * Üsküdar–Kabataş kartındaki özel servis pencerelerini çıkarır.
 *
 * Kaynak biçimi (2026-11-27):
 *   <div class="uskudar-card__rush-badge">
 *     ⚡ Akşam Yoğun Saat: Hafta içi <strong>16:00 – 18:30</strong> arası
 *     aralıksız sürekli ring seferi yapılmaktadır.
 *   </div>
 *   <div class="uskudar-card__time-label">🌙 Gece Seferleri <span>(21:00 sonrası)</span></div>
 *   <div class="uskudar-card__time-row">
 *     <span>21:00 – 00:00 Arası:</span>
 *     <span class="uskudar-card__tag">Her 20 dakikada bir</span>
 *   </div>
 *
 * Yalnızca yazılı olan taşınır; pencere içine saat UYDURULMAZ.
 */
export function parseUskudarServiceWindows(block: string): DenturServiceWindow[] {
  const windows: DenturServiceWindow[] = [];

  for (const m of block.matchAll(
    /rush-badge">([\s\S]*?)<\/div>/g
  )) {
    const inner = m[1];
    const strong = (inner.match(/<strong>\s*([^<]+?)\s*<\/strong>/) || [])[1] ?? "";
    const range = strong.match(RANGE_RE);
    if (!range) continue;

    const plain = cleanCell(inner).replace(/^[^A-Za-zÇĞİÖŞÜçğıöşü]+/, "");
    const label = (plain.match(/([^:]{3,40}Yoğun Saat)/) || [])[1]?.trim() ??
      "Yoğun Saat";
    // Kaynak cümlesi: "<etiket>: <gün kapsamı> <aralık> <açıklama>"
    // Aralık ayrı alanda taşındığı için cümleden çıkarılır; kalan açıklama
    // aynen korunur. Gün kapsamı ise kaydın dayType'ı ile eşleştirilir.
    const afterLabel = plain.slice(plain.indexOf(label) + label.length);
    const [, afterRange] = afterLabel.split(strong);
    windows.push({
      kind: "RUSH",
      label,
      startTime: range[1],
      endTime: range[2],
      note: (afterRange ?? "")
        .replace(/\s+/g, " ")
        .trim()
        // Kaynak cümlesi "<aralık> arası <açıklama>" biçiminde; aralık ayrı
        // alanda taşındığı için baştaki "arası" bağlacı düşürülür.
        .replace(/^aras[ıi]\s+/i, "")
        .trim(),
    });
  }

  for (const m of block.matchAll(
    /time-row">\s*<span>\s*([^<]*?[–-][^<]*?)\s*<\/span>\s*<span[^>]*class="[^"]*tag[^"]*"[^>]*>\s*([^<]+?)\s*</g
  )) {
    const rowRange = m[1].match(RANGE_RE);
    if (!rowRange) continue;
    windows.push({
      kind: "NIGHT",
      label: "Gece Seferleri",
      startTime: rowRange[1],
      endTime: rowRange[2],
      note: m[2].replace(/\s+/g, " ").trim(),
    });
  }

  return windows;
}

export function parseUskudarKabatasSchedules(html: string): DenturLineRecord[] {
  const d = decodeDenturHtml(html);
  const records: DenturLineRecord[] = [];
  const price = parseTamPrice(d);

  // Gün tipi → sıklık metni (sayfada yazılı olduğu gibi).
  const frequencyByDay = new Map<DenturDayType, string>();
  for (const m of d.matchAll(
    /freq-item">\s*<span>\s*([^<]+?)\s*<\/span>\s*<strong[^>]*>\s*([^<]+?)\s*</g
  )) {
    const dayType = denturDayTypeFromLabel(m[1]);
    if (dayType) frequencyByDay.set(dayType, m[2].trim());
  }

  const starts = [...d.matchAll(/uskudar-card__day-block/g)].map((m) => m.index ?? 0);
  for (let i = 0; i < starts.length; i++) {
    const start = starts[i];
    const end = i + 1 < starts.length ? starts[i + 1] : d.indexOf("uskudar-card__prices", start);
    const block = d.slice(start, end > start ? end : undefined);

    const title = (block.match(/card__title[^>]*>\s*([^<]+)/) || [])[1]?.trim() ?? "";
    const isUskudar = title.toLocaleUpperCase("tr-TR").includes("ÜSKÜDAR");
    const isKabatas = title.toLocaleUpperCase("tr-TR").includes("KABATAŞ");
    if (!isUskudar && !isKabatas) continue;

    const allWindows = parseUskudarServiceWindows(block);
    for (const m of block.matchAll(
      /time-row">\s*<span>\s*([^<]*?):?\s*<\/span>\s*<strong>\s*([^<]+?)\s*<\/strong>/g
    )) {
      const dayType = denturDayTypeFromLabel(m[1]);
      const range = m[2].match(RANGE_RE);
      if (!dayType || !range) continue;

      // "Yoğun Saat" penceresi kaynakta HAFTA İÇİ için yazılı; cumartesi/pazar
      // kaydına iliştirilirse olmayan bir hizmet iddia edilmiş olur. Gece
      // sıklığı ise gün ayrımı yapılmadan verilir → her gün için geçerli.
      const runsOnWeekday = dayType === "WEEKDAY" || dayType === "WEEKDAY_SAT";
      const windows = allWindows.filter(
        (w) => w.kind === "NIGHT" || runsOnWeekday
      );

      records.push({
        line: "Üsküdar-Kabataş",
        origin: isUskudar ? "Üsküdar" : "Kabataş",
        destination: isUskudar ? "Kabataş" : "Üsküdar",
        directionLabel: isUskudar ? "Üsküdar → Kabataş" : "Kabataş → Üsküdar",
        dayType,
        departureTime: range[1],
        isContinuous: true,
        continuousUntil: range[2],
        serviceFrequencyLabel: frequencyByDay.get(dayType),
        serviceWindows: windows.length > 0 ? windows : undefined,
        price,
      });
    }
  }

  return uniq(
    records,
    (r) =>
      `${r.line}|${r.origin}|${r.destination}|${r.dayType}|${r.departureTime}|${
        r.continuousUntil ?? ""
      }`
  );
}

/**
 * HAT: Üsküdar ↔ Beşiktaş
 *
 * Sayfa yapısı (2026-11-27): iki `yalova-card__panel`
 * (Üsküdar İskelesi / Beşiktaş İskelesi Hareket Saatleri). Her satır:
 *   "Hafta içi ve Cumartesi" → "06:10-00:45" + "arası sürekli sefer"
 * Tek tek saat yok → tek "sürekli sefer" kaydı.
 */
export function parseUskudarBesiktasSchedules(html: string): DenturLineRecord[] {
  const d = decodeDenturHtml(html);
  const records: DenturLineRecord[] = [];
  const price = parseIstanbulkartTam(d);

  const panels = d.split(/card__panel-title">/);
  for (let i = 1; i < panels.length; i++) {
    const panel = panels[i];
    const pierTitle = (panel.match(/^\s*([^<]+)/) || [])[1] ?? "";
    const isUskudar = pierTitle.toLocaleUpperCase("tr-TR").includes("ÜSKÜDAR");
    const isBesiktas = pierTitle.toLocaleUpperCase("tr-TR").includes("BEŞİKTAŞ");
    if (!isUskudar && !isBesiktas) continue;

    for (const m of panel.matchAll(
      /<span>\s*([^<]+?)\s*<\/span>\s*<div[^>]*>\s*<strong>\s*([^<]+?)\s*<\/strong>/g
    )) {
      const dayType = denturDayTypeFromLabel(m[1]);
      const range = m[2].match(RANGE_RE);
      if (!dayType || !range) continue;

      records.push({
        line: "Üsküdar-Beşiktaş",
        origin: isUskudar ? "Üsküdar" : "Beşiktaş",
        destination: isUskudar ? "Beşiktaş" : "Üsküdar",
        directionLabel: isUskudar ? "Üsküdar → Beşiktaş" : "Beşiktaş → Üsküdar",
        dayType,
        departureTime: range[1],
        isContinuous: true,
        continuousUntil: range[2],
        price,
      });
    }
  }

  return uniq(
    records,
    (r) =>
      `${r.line}|${r.origin}|${r.destination}|${r.dayType}|${r.departureTime}|${
        r.continuousUntil ?? ""
      }`
  );
}

/** Tek sayfayı çekip ilgili hattın kayıtlarını üretir */
export async function scrapeDenturLine(
  url: string,
  lineKey: DenturLineKey
): Promise<DenturLineRecord[]> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`Dentur ${lineKey} HTTP ${res.status}`);
  const html = await res.text();

  switch (lineKey) {
    case "besiktaskadikoy":
      return parseBesiktasKadikoySchedules(html);
    case "adalar":
      return parseAdalarSchedules(html);
    case "uskudarkabatas":
      return parseUskudarKabatasSchedules(html);
    case "uskudarbesiktas":
      return parseUskudarBesiktasSchedules(html);
  }
}

export const DENTUR_LINE_ENDPOINTS = {
  besiktaskadikoy: "https://www.denturavrasya.com/tr-TR/hatlarimiz/besiktaskadikoy",
  adalar: "https://www.denturavrasya.com/tr-TR/hatlarimiz/adalar",
  uskudarkabatas: "https://www.denturavrasya.com/tr-TR/hatlarimiz/uskudar-kabatas",
  uskudarbesiktas: "https://www.denturavrasya.com/tr-TR/hatlarimiz/uskudar-besiktas",
} as const;

export type DenturLineKey = keyof typeof DENTUR_LINE_ENDPOINTS;

/**
 * Tüm hatları canlı çeker.
 *
 * KURAL: bir hat 0 sefer döndürdüyse bu "başarı" DEĞİL hatadır. Sayfa yapısı
 * değiştiğinde parser sessizce boş dizi döndürüyordu; `failures` boş kaldığı
 * için koruma tetiklenmiyor ve tarife yayına ~%99 eksik giriyordu (26 Kasım
 * 2026: 569 kayıt -> 4 kayıt, failures=[]). Aktif bir hattın sıfır seferi
 * gerçekçi olmadığı için bu durum hata olarak raporlanır.
 */
export async function scrapeAllDenturSchedules(options?: {
  /** Test enjeksiyonu: varsayılan `scrapeDenturLine`. */
  scrapeLine?: (
    url: string,
    line: DenturLineKey
  ) => Promise<DenturLineRecord[]>;
}): Promise<{
  records: DenturLineRecord[];
  failures: { line: string; error: string }[];
}> {
  const failures: { line: string; error: string }[] = [];
  const records: DenturLineRecord[] = [];
  const scrapeLine = options?.scrapeLine ?? scrapeDenturLine;

  for (const [line, url] of Object.entries(DENTUR_LINE_ENDPOINTS) as Array<
    [DenturLineKey, string]
  >) {
    try {
      const recs = await scrapeLine(url, line);
      if (recs.length === 0) {
        failures.push({
          line,
          error:
            "Kaynak alındı ama 0 sefer ayrıştırıldı (sayfa yapısı değişmiş olabilir)",
        });
        continue;
      }
      records.push(...recs);
    } catch (err: unknown) {
      failures.push({ line, error: getErrorMessage(err, String(err)) });
    }
  }

  return { records, failures };
}
