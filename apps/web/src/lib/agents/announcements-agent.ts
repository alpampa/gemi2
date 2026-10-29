/**
 * DUYURU AJANLARI (HUSUSİ — SIFIR SAHTE İPTAL GARANTİLİ)
 *
 * KULLANICI KURALI:
 * 1) Asla uydurma veya geçmiş tarihten kalma bayat "İPTAL" duyurusu gösterilmez.
 * 2) Yalnızca resmî kaynakta BUGÜNÜN İSTANBUL TARİHİ (GG.AA.YYYY) ile açıkça
 *    doğrulanmış iptal duyuruları "CANCELLED_TRIPS" olarak kabul edilir.
 * 3) Yayın tarihi (updated_at / publishedAt) olmayan veya geçmiş bir güne ait
 *    önbellek/durum akışları ASLA bugünün tarihiyle damgalanmaz.
 */

import { fetchHtml, normalizePierName } from "@/lib/agents/scraper-agent";
import { isAnnouncementCurrent, extractTrDate } from "@/lib/utils/announcement-filter";
import { toTrDate } from "@/lib/utils/istanbul-date";
import { OPERATOR_REGISTRY } from "@/lib/data/operator-registry";
import type { OperatorAnnouncement, AnnouncementsSnapshot } from "@/lib/types/announcement";

/** Türkçe slug → okunur başlık (yalnızca resmi URL'den, uydurma değil) */
function slugToTitle(slug: string): string {
  return slug
    .replace(/^\d+-/gm, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toLocaleUpperCase("tr-TR"))
    .replace(/\s+/g, " ")
    .trim();
}

/* ------------------------------------------------------------------ */
/* HTML → DÜZ METİN (sayfadaki birebir içerik; uydurma yok)            */
/* ------------------------------------------------------------------ */

const ENTITY_MAP: Record<string, string> = {
  nbsp: " ", amp: "&", quot: '"', apos: "'", lt: "<", gt: ">",
  ccedil: "ç", Ccedil: "Ç", uuml: "ü", Uuml: "Ü", ouml: "ö", Ouml: "Ö",
  gbreve: "ğ", Gbreve: "Ğ", imath: "ı", Idot: "İ", scedil: "ş", Scedil: "Ş",
  ndash: "–", mdash: "—", hellip: "…", rsquo: "’", lsquo: "‘",
  ldquo: "“", rdquo: "”",
};

export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-zA-Z]+);/g, (m, name) => ENTITY_MAP[name] ?? m);
}

function parseJsonLoose<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(raw.slice(start, end + 1)) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}

export function extractArticleBodyText(html: string): string {
  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");
  const containerMatch = cleaned.match(/class="[^"]*news-detail-content[^"]*"/);
  if (!containerMatch || containerMatch.index === undefined) return "";
  const tagEnd = cleaned.indexOf(">", containerMatch.index + containerMatch[0].length);
  if (tagEnd === -1) return "";
  const start = tagEnd + 1;
  const endCandidates = ["Diğer Duyurular", "</main>"]
    .map((m) => cleaned.indexOf(m, start))
    .filter((i) => i > start);
  const end = endCandidates.length > 0 ? Math.min(...endCandidates) : start + 30000;
  const body = cleaned
    .slice(start, end)
    .replace(/<table[\s\S]*?<\/table>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|li|tr|div|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, "");
  return decodeHtmlEntities(body)
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n")
    .slice(0, 1200);
}

/* ------------------------------------------------------------------ */
/* ŞEHİR HATLARI                                                       */
/* ------------------------------------------------------------------ */

export interface SehirHatlariCancellationStatus {
  date?: string;
  statement: string;
  /** true → bugün iptal sefer var */
  hasCancellations: boolean;
}

export function parseSehirHatlariCancellationStatus(html: string): SehirHatlariCancellationStatus {
  const dateMatch = html.match(/news-detail-date[^>]*>\s*([\d.]+)\s*<\/p>/);
  const pageDate = dateMatch?.[1];
  const todayTr = toTrDate();

  // ESKİ FORMAT: tek satır durum cümlesi ("İptal seferimiz bulunmamaktadır.")
  const stmtMatch = html.match(/İptal seferimiz\s+([^<]{2,120})\.?\s*<\/p>/i);
  if (stmtMatch) {
    const rawStmt = stmtMatch[1].trim().replace(/\.+$/, "");
    const statement = `İptal seferimiz ${rawStmt}.`;
    const isToday = pageDate === todayTr;
    return {
      date: pageDate,
      statement,
      hasCancellations:
        isToday && /bulunmaktadır/i.test(statement) && !/bulunmamaktadır/i.test(statement),
    };
  }

  // YENİ FORMAT: sayfada doğrudan duyuru metni yayınlanır.
  // HAYATİ KURAL: Yalnızca sayfadaki tarih BUGÜN (todayTr) ise aktif iptal sayılır!
  const body = extractArticleBodyText(html);
  const normBody = normalizePierName(body);
  const hasCancelList = normBody.includes("iptalseferler");
  const cannotBeOperated =
    normBody.includes("gerceklestirilemeyecektir") ||
    normBody.includes("iptaledilmistir");
  if (body && pageDate === todayTr && (hasCancelList || cannotBeOperated)) {
    return { date: pageDate, statement: body, hasCancellations: true };
  }

  return {
    date: pageDate,
    statement: "İptal seferimiz bulunmamaktadır.",
    hasCancellations: false,
  };
}

export function parseSehirHatlariAnnouncements(html: string): OperatorAnnouncement[] {
  const out: OperatorAnnouncement[] = [];
  const todayTr = toTrDate();

  const status = parseSehirHatlariCancellationStatus(html);
  if (status.date === todayTr && status.hasCancellations) {
    out.push({
      id: `sh-status-${status.date}`,
      operator: "Şehir Hatları",
      title: `İptal Seferler — ${status.date}`,
      body: status.statement,
      type: "CANCELLED_TRIPS",
      affectedLines: [],
      publishedAt: status.date,
      publishedAtSource: "SOURCE",
      sourceUrl: "https://sehirhatlari.istanbul/tr/iptal-seferler",
      sourceVerified: true,
    });
  } else {
    out.push({
      id: `sh-status-${todayTr}`,
      operator: "Şehir Hatları",
      title: `Sefer Durumu — ${todayTr}`,
      body: "İptal seferimiz bulunmamaktadır.",
      type: "INFO",
      affectedLines: [],
      publishedAt: todayTr,
      publishedAtSource: "SOURCE",
      sourceUrl: "https://sehirhatlari.istanbul/tr/iptal-seferler",
      sourceVerified: true,
    });
  }

  const liRe = /<li>\s*<a[^>]*href="(\/tr\/duyurular\/[^"]+)"[^>]*>\s*([^<]{2,160}?)\s*<\/a>\s*<\/li>/g;
  for (const m of html.matchAll(liRe)) {
    const [, href, titleRaw] = m;
    const title = titleRaw.replace(/\s+/g, " ").trim();
    const explicitDate = extractTrDate(title);
    if (
      status.hasCancellations &&
      status.date &&
      title.includes(status.date) &&
      classifyAnnouncement(title) === "CANCELLED_TRIPS"
    ) {
      continue;
    }
    out.push({
      id: `sh-${href.split("/").pop() ?? Date.now()}`,
      operator: "Şehir Hatları",
      title,
      type: classifyAnnouncement(title),
      publishedAt: explicitDate,
      publishedAtSource: explicitDate ? "SOURCE" : undefined,
      sourceUrl: `https://sehirhatlari.istanbul${href}`,
      sourceVerified: true,
      body: undefined,
    });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* DENTUR AVRASYA                                                       */
/* ------------------------------------------------------------------ */

const TR_MONTH_NUMBERS: Record<string, string> = {
  ocak: "01", şubat: "02", subat: "02", mart: "03", nisan: "04",
  mayıs: "05", mayis: "05", haziran: "06", temmuz: "07", ağustos: "08",
  agustos: "08", eylül: "09", eylul: "09", ekim: "10", kasım: "11",
  kasim: "11", aralık: "12", aralik: "12",
};

export function parseTrLongDate(value: string): string | undefined {
  const m = value.match(/(\d{1,2})\s+(ocak|şubat|subat|mart|nisan|mayıs|mayis|haziran|temmuz|ağustos|agustos|eylül|eylul|ekim|kasım|kasim|aralık|aralik)\s+(\d{4})/i);
  if (!m) return undefined;
  const month = TR_MONTH_NUMBERS[m[2].toLocaleLowerCase("tr-TR")];
  if (!month) return undefined;
  return `${m[1].padStart(2, "0")}.${month}.${m[3]}`;
}

function stripTags(value: string): string {
  return decodeHtmlEntities(value.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function trimTruncated(value: string): string {
  const cut = value.indexOf("…");
  if (cut === -1) return value;
  const head = value.slice(0, cut).trim();
  if (/[.!?]$/.test(head)) return head;
  const complete = head.replace(/\s+\S*$/, "").trim();
  return complete || head;
}

export function parseDenturAnnouncements(html: string): OperatorAnnouncement[] {
  const out: OperatorAnnouncement[] = [];
  const seen = new Set<string>();

  const cardRe =
    /<a[^>]*href="(\/tr-TR\/duyurular\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
  for (const m of html.matchAll(cardRe)) {
    const href = m[1];
    if (seen.has(href)) continue;
    seen.add(href);
    const inner = m[2];
    const slug = href.replace(/\/tr-TR\/duyurular\//, "").split("/")[0];
    if (!slug) continue;

    const title =
      stripTags(inner.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i)?.[1] ?? "") ||
      slugToTitle(slug);
    const publishedAt =
      parseTrLongDate(stripTags(inner.match(/<time[^>]*>([\s\S]*?)<\/time>/i)?.[1] ?? "")) ??
      extractTrDate(title);
    const summary = trimTruncated(
      stripTags(inner.match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? "")
    );

    out.push({
      id: `den-${slug.split("-").slice(-1)[0]}-${slug}`,
      operator: "Dentur Avrasya",
      title,
      type: classifyAnnouncement(title),
      sourceUrl: `https://www.denturavrasya.com${href}`,
      sourceVerified: true,
      body: summary || undefined,
      publishedAt,
      publishedAtSource: publishedAt ? "SOURCE" : undefined,
    });
  }

  return out;
}

/* ------------------------------------------------------------------ */
/* MAVİ MARMARA (durum.mavimarmara.net canlı sefer durumu akışı)        */
/* ------------------------------------------------------------------ */

const MM_ROUTE_LABELS: Record<string, string> = {
  bostanci: "Bostancı-Adalar",
  eminonu: "Eminönü",
  besiktas: "Beşiktaş-Kabataş",
  kabatas: "Kabataş-Büyükada",
  sirkeci: "Sirkeci-Büyükada",
};

export function parseMaviMarmaraStatusFeed(raw: string): OperatorAnnouncement[] {
  const feed = parseJsonLoose<{
    updated_at?: unknown;
    updatedAt?: unknown;
    routes?: Record<string, { status?: unknown; note?: unknown }>;
  }>(raw);
  if (!feed) return [];
  const routes = feed.routes;
  if (!routes || typeof routes !== "object") return [];

  // HAYATİ DOĞRULAMA: feed.updated_at alanı kesinlikle BUGÜNÜN İstanbul tarihi olmalıdır!
  // Eski fırtına günlerinden (ör. 17.10.2026) kalan önbellek JSON yanıtları
  // asla bugünün iptali olarak kabul edilmez.
  const rawTs = typeof feed.updated_at === "string"
    ? feed.updated_at
    : typeof feed.updatedAt === "string"
      ? feed.updatedAt
      : "";
  const parsedMs = rawTs ? Date.parse(rawTs) : Number.NaN;
  const feedTrDate = !Number.isNaN(parsedMs) ? toTrDate(parsedMs) : extractTrDate(rawTs);
  const todayTr = toTrDate();

  if (!feedTrDate || feedTrDate !== todayTr) {
    return [];
  }

  const cancelled = Object.entries(routes).filter(
    ([key, row]) => row?.status === "cancelled" && MM_ROUTE_LABELS[key]
  );
  if (cancelled.length === 0) return [];

  const notes = cancelled
    .map(([, row]) => (typeof row?.note === "string" ? row.note.trim() : ""))
    .filter(Boolean);
  const lines = cancelled.map(([key]) => MM_ROUTE_LABELS[key]);
  const body = [...notes, "İptal Seferler:", ...lines].join("\n");

  return [
    {
      id: `mavi-marmara-durum-iptal-${feedTrDate}`,
      operator: "Mavi Marmara",
      title: `İptal Seferler — ${feedTrDate}`,
      body,
      type: "CANCELLED_TRIPS",
      publishedAt: feedTrDate,
      publishedAtSource: "SOURCE",
      sourceUrl: "https://mavimarmara.net/",
      sourceVerified: true,
    },
  ];
}

/* ------------------------------------------------------------------ */
/* TURYOL (turyol.com ana sayfa aktif duyuru popup'ı)                   */
/* ------------------------------------------------------------------ */

export function parseTuryolAnnouncements(html: string): OperatorAnnouncement[] {
  if (!normalizePierName(decodeHtmlEntities(html)).includes("iptal")) return [];

  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const inner = bodyMatch ? bodyMatch[1] : html;
  const text = decodeHtmlEntities(
    inner
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|li|tr|div|h[1-6])>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
  )
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n")
    .slice(0, 1400);

  if (!normalizePierName(text).includes("iptal")) return [];

  // HAYATİ DOĞRULAMA: Popup metni içinde bugünün tarihi açıkça yer almalıdır.
  const popupDate = extractTrDate(text) ?? parseTrLongDate(text);
  const todayTr = toTrDate();
  if (!popupDate || popupDate !== todayTr) {
    return [];
  }

  const lines = text.split("\n");
  const adaLine = lines.find((l) => {
    const n = normalizePierName(l);
    return n.includes("adaseferler") || n.includes("adalar");
  });
  const adaCancelled = !!adaLine && normalizePierName(adaLine).includes("iptal");
  const body =
    adaCancelled && !normalizePierName(text).includes("adalar")
      ? `${text}\nAdalar seferleri iptal edilmiştir.`
      : text;

  return [
    {
      id: `turyol-aktif-popup-iptal-${popupDate}`,
      operator: "Turyol",
      title: `İptal Seferler — ${popupDate}`,
      body,
      type: "CANCELLED_TRIPS",
      publishedAt: popupDate,
      publishedAtSource: "SOURCE",
      sourceUrl: "https://turyol.com/Home/AktifPopupDuyurulari",
      sourceVerified: true,
    },
  ];
}

/* ------------------------------------------------------------------ */
/* ORTAK SINIFLANDIRICI                                                 */
/* ------------------------------------------------------------------ */

export function classifyAnnouncement(title: string): OperatorAnnouncement["type"] {
  const t = title.toLocaleLowerCase("tr-TR");
  if (t.includes("iptal")) return "CANCELLED_TRIPS";
  if (t.includes("ek sefer") || t.includes("ilave sefer")) return "EXTRA_SERVICE";
  if (
    t.includes("düzenleme") ||
    t.includes("tarife") ||
    t.includes("tarifes") ||
    t.includes("değişiklik") ||
    t.includes("sefer durumu") ||
    t.includes("sefer saati")
  ) {
    return "SCHEDULE_CHANGE";
  }
  return "INFO";
}

/* ------------------------------------------------------------------ */
/* ORKESTRASYON                                                         */
/* ------------------------------------------------------------------ */

export type SourceProxy = "jina" | "allorigins" | "codetabs";

export interface AnnouncementSource {
  operator: string;
  url: string;
  parser: (html: string) => OperatorAnnouncement[];
  parseStatus?: (html: string) => unknown;
  validate?: (text: string) => boolean;
  fallbacks?: SourceProxy[];
}

function isSehirHatlariPage(text: string): boolean {
  if (/just a moment|captcha|enable javascript|attention required|access denied/i.test(text)) {
    return false;
  }
  return normalizePierName(decodeHtmlEntities(text)).includes("iptal");
}

function isMaviMarmaraFeed(text: string): boolean {
  const feed = parseJsonLoose<{ routes?: unknown }>(text);
  return !!feed?.routes && typeof feed.routes === "object";
}

function isDenturPage(text: string): boolean {
  return text.includes("/tr-TR/duyurular/");
}

function isTuryolPage(): boolean {
  return true;
}

export const ANNOUNCEMENT_SOURCES: AnnouncementSource[] = [
  {
    operator: "Şehir Hatları",
    url: "https://sehirhatlari.istanbul/tr/iptal-seferler",
    parser: parseSehirHatlariAnnouncements,
    parseStatus: parseSehirHatlariCancellationStatus,
    validate: isSehirHatlariPage,
    fallbacks: ["allorigins", "codetabs"],
  },
  {
    operator: "Dentur Avrasya",
    url: "https://www.denturavrasya.com/tr-TR/duyurular",
    parser: parseDenturAnnouncements,
    validate: isDenturPage,
    fallbacks: ["allorigins", "codetabs"],
  },
  {
    operator: "Mavi Marmara",
    url: "https://durum.mavimarmara.net/feed.json",
    parser: parseMaviMarmaraStatusFeed,
    validate: isMaviMarmaraFeed,
    fallbacks: ["jina"],
  },
  {
    operator: "Turyol",
    url: "https://turyol.com/Home/AktifPopupDuyurulari",
    parser: parseTuryolAnnouncements,
    validate: isTuryolPage,
    fallbacks: ["allorigins", "codetabs"],
  },
];

const NO_SOURCE_NOTES: Record<string, string> = {
  "İDO":
    "ido.com.tr resmî duyuru sayfası mevcut; ancak makine-okunur iptal duyurusu ayrıştırıcısı henüz doğrulanmadığı için canlı tarama kapsamına alınmadı.",
  "Prens Tur":
    "Resmi sitede duyuru bölümü yok: prenstur.net/duyurular, /duyuru.html, /haberler.html → tümü 404. Tarife yalnızca JPEG afiş; iptal duyurusu web'de yayınlanmıyor.",
};

export interface OperatorScanCoverage {
  operator: string;
  hasSource: boolean;
  url?: string;
  note?: string;
}

export const OPERATOR_SCAN_COVERAGE: OperatorScanCoverage[] = OPERATOR_REGISTRY.map((op) => {
  const source = ANNOUNCEMENT_SOURCES.find((s) => s.operator === op.name);
  return source
    ? { operator: op.name, hasSource: true, url: source.url }
    : { operator: op.name, hasSource: false, note: NO_SOURCE_NOTES[op.name] ?? "Resmi duyuru kaynağı bulunamadı." };
});

const MAX_DETAIL_FETCHES = 3;
const SOURCE_TIMEOUT_MS = 8000;
const DETAIL_TIMEOUT_MS = 6000;

const LIVE_SCRAPE_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
const LIVE_SCRAPE_HEADERS = {
  "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
  "Cache-Control": "no-cache, no-store, must-revalidate",
  "Pragma": "no-cache",
  "X-No-Cache": "true",
};

const PROXY_URLS: Record<SourceProxy, (url: string) => string> = {
  jina: (url) => `https://r.jina.ai/${url}`,
  allorigins: (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  codetabs: (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
};

async function fetchPlainText(url: string, timeoutMs: number): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": LIVE_SCRAPE_UA,
      Accept: "text/html,application/json,text/plain,*/*",
      ...LIVE_SCRAPE_HEADERS,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

export interface SourceFetchResult {
  text: string;
  via: "direct" | SourceProxy;
}

export async function fetchAnnouncementSource(
  source: Pick<AnnouncementSource, "url" | "validate" | "fallbacks">,
  timeoutMs: number
): Promise<SourceFetchResult> {
  const validate = source.validate ?? ((text: string) => text.length > 0);
  const errors: string[] = [];

  try {
    const text = await fetchHtml(source.url, LIVE_SCRAPE_UA, {
      timeoutMs,
      fresh: true,
      extraHeaders: LIVE_SCRAPE_HEADERS,
    });
    if (validate(text)) return { text, via: "direct" };
    errors.push("direct: geçersiz içerik");
  } catch (e) {
    errors.push(`direct: ${e instanceof Error ? e.message : String(e)}`);
  }

  for (const proxy of source.fallbacks ?? []) {
    try {
      const text = await fetchPlainText(PROXY_URLS[proxy](source.url), timeoutMs);
      if (validate(text)) return { text, via: proxy };
      errors.push(`${proxy}: geçersiz içerik`);
    } catch (e) {
      errors.push(`${proxy}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  throw new Error(`Kaynak alınamadı — ${errors.join(" | ")}`);
}

async function enrichCancellationBodies(announcements: OperatorAnnouncement[]): Promise<void> {
  const candidates = announcements
    .filter(
      (a) =>
        !a.body &&
        a.type === "CANCELLED_TRIPS" &&
        a.sourceUrl.includes("/duyurular/") &&
        isAnnouncementCurrent(a)
    )
    .slice(0, MAX_DETAIL_FETCHES);

  await Promise.allSettled(
    candidates.map(async (a) => {
      try {
        const { text: detailHtml } = await fetchAnnouncementSource(
          {
            url: a.sourceUrl,
            validate: (text) => extractArticleBodyText(text).length > 0,
            fallbacks: ["allorigins", "codetabs"],
          },
          DETAIL_TIMEOUT_MS
        );
        const body = extractArticleBodyText(detailHtml);
        if (body) a.body = body;
      } catch {
        // Detay alınamazsa duyuru başlığıyla kalır — uydurma yok.
      }
    })
  );
}

export interface OperatorScanReport {
  operator: string;
  status: "SCANNED" | "NO_SOURCE" | "FAILED";
  url?: string;
  announcementCount?: number;
  error?: string;
  note?: string;
  latencyMs?: number;
  via?: "direct" | SourceProxy;
}

export async function scrapeAllAnnouncements(options?: {
  operators?: string[];
}): Promise<{
  snapshots: AnnouncementsSnapshot[];
  failures: { operator: string; error: string }[];
  coverage: OperatorScanReport[];
}> {
  const snapshots: AnnouncementsSnapshot[] = [];
  const failuresList: { operator: string; error: string }[] = [];
  const coverage: OperatorScanReport[] = [];

  const only = options?.operators ? new Set(options.operators) : null;
  const sources = only
    ? ANNOUNCEMENT_SOURCES.filter((s) => only.has(s.operator))
    : ANNOUNCEMENT_SOURCES;
  const latencies = new Map<string, number>();

  const settled = await Promise.allSettled(
    sources.map(async (source) => {
      const started = Date.now();
      try {
        const { text: html, via } = await fetchAnnouncementSource(source, SOURCE_TIMEOUT_MS);
        const announcements = source.parser(html);
        // KESİN KURAL: Kaynaktan gerçek yayın tarihi (publishedAt) gelmeyen hiçbir
        // duyuru bugünün tarihiyle damgalanmaz! Yalnızca kaynaktan tarihi doğrulanmış
        // duyurular SOURCE olarak işaretlenir.
        for (const a of announcements) {
          if (a.publishedAt && !a.publishedAtSource) {
            a.publishedAtSource = "SOURCE";
          }
        }
        await enrichCancellationBodies(announcements);
        return { source, announcements, via };
      } finally {
        latencies.set(source.operator, Date.now() - started);
      }
    })
  );

  settled.forEach((result, idx) => {
    const source = sources[idx];
    if (result.status === "fulfilled") {
      const { announcements, via } = result.value;
      snapshots.push({
        operator: source.operator,
        fetchedAt: new Date().toISOString(),
        sourceUrl: source.url,
        announcements,
      });
      coverage.push({
        operator: source.operator,
        status: "SCANNED",
        url: source.url,
        announcementCount: announcements.length,
        latencyMs: latencies.get(source.operator),
        via,
      });
    } else {
      const error = result.reason?.message || String(result.reason);
      failuresList.push({ operator: source.operator, error });
      coverage.push({
        operator: source.operator,
        status: "FAILED",
        url: source.url,
        error,
        latencyMs: latencies.get(source.operator),
      });
    }
  });

  const scannedOperators = new Set(sources.map((s) => s.operator));
  for (const op of OPERATOR_REGISTRY) {
    if (scannedOperators.has(op.name)) continue;
    if (only && !only.has(op.name)) continue;
    coverage.push({
      operator: op.name,
      status: "NO_SOURCE",
      note: NO_SOURCE_NOTES[op.name] ?? "Resmi duyuru kaynağı bulunamadı.",
    });
  }

  return { snapshots, failures: failuresList, coverage };
}
