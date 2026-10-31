/**
 * Veri tazeliği (data freshness) hesabı.
 *
 * NEDEN: Uygulama, resmî kaynaklardan en son ne zaman doğrulandığını hiçbir
 * yerde söylemiyordu; kullanıcı 10 gün önce çekilmiş duyuruları "canlı" sanabilirdi.
 * Bu modül yaşı ölçer ve dürüstçe etiketler. Doğrulama tarihi bilinmiyorsa
 * tazelik İDDİA EDİLMEZ (level: UNKNOWN).
 *
 * EŞİKLER: Aşağıdaki değerler arayüz uyarı eşikleridir; resmî bir SLA değildir.
 * - TARİFE: günlük senkron üzerinden gün sınıfı eşikler (FRESH_MAX_AGE_DAYS).
 * - DUYURU/İPTAL: dakika sınıfında ayrı eşikler (resolveAnnouncementFreshness).
 * Zamanlama tablosu: docs/DATA-SYNC.md (vercel.json 5 21 * * * UTC = 00:05 TR;
 * Actions nightly 0 20 * * * UTC = 23:00 TR).
 */

export type FreshnessLevel = "FRESH" | "AGING" | "STALE" | "UNKNOWN";

export interface DataFreshness {
  /** Doğrulama tarihinden bu yana geçen tam gün; bilinmiyorsa null */
  ageDays: number | null;
  level: FreshnessLevel;
  /** "4 Ekim 2026" — bilinmiyorsa null */
  verifiedOnLabel: string | null;
  /** "bugün" / "dün" / "11 gün önce" / "bilinmiyor" */
  ageLabel: string;
  /** Uyarı gösterilmeli mi? (STALE veya UNKNOWN) */
  isStale: boolean;
}

/** Tarife verisi: 2 güne kadar taze (günlük senkron + 1 gün tolerans) */
export const FRESH_MAX_AGE_DAYS = 2;
/** 7 güne kadar "eskimekte"; üzeri "bayat" */
export const AGING_MAX_AGE_DAYS = 7;

// ---------- DUYURU TAZELİĞİ (dakika sınıfı; iptal duyuruları için) ----------

/**
 * Duyuru bu dakikaya kadar taze sayılır. Dakikalık izleme + saatlik tarama
 * hattına göre [AGENTS.md doğrulama kuralı] "geçerli" sınıfın üst sınırı.
 */
export const ANNOUNCEMENT_FRESH_MAX_MIN = 90;
/** Bu dakikayı aşan duyuru verisi BAYATTIR ve kırmızı uyarı gerektirir. */
export const ANNOUNCEMENT_STALE_MIN = 360;

export interface AnnouncementFreshness {
  /** Doğrulamadan bu yana geçen dakika; bilinmiyorsa null */
  ageMinutes: number | null;
  level: FreshnessLevel;
  /** "14:05" (istanbul) — bilinmiyorsa null */
  verifiedLabel: string | null;
  /** "12 dk önce" / "2 saat önce" / "7 saat önce" / "bilinmiyor" */
  ageLabel: string;
  /** STALE veya UNKNOWN — kırmızı uyarı gösterilmeli */
  isStale: boolean;
}

/**
 * Duyuru/iptal verisi için dakika sınıfı tazelik.
 * Tarife tazeliğinden (gün sınıfı) AYRIDIR: bir iptal duyurusu 2 gün
 * eskimişse felakettir, tarifeye göre "taze" gösterilmesi dürüst değildir.
 */
export function resolveAnnouncementFreshness(
  generatedAtIso?: string | null,
  nowMs: number = Date.now(),
): AnnouncementFreshness {
  const parsed = generatedAtIso ? Date.parse(generatedAtIso) : Number.NaN;

  if (!Number.isFinite(parsed)) {
    return {
      ageMinutes: null,
      level: "UNKNOWN",
      verifiedLabel: null,
      ageLabel: "doğrulama yok",
      isStale: true,
    };
  }

  const diffMinutes = Math.max(0, Math.floor((nowMs - parsed) / 60_000));
  const hours = Math.floor(diffMinutes / 60);

  const level: FreshnessLevel =
    diffMinutes <= ANNOUNCEMENT_FRESH_MAX_MIN
      ? "FRESH"
      : diffMinutes <= ANNOUNCEMENT_STALE_MIN
      ? "AGING"
      : "STALE";

  const ageLabel =
    hours >= 1 ? `${hours} saat önce` : `${diffMinutes} dk önce`;

  const TIME_FMT = new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return {
    ageMinutes: diffMinutes,
    level,
    verifiedLabel: TIME_FMT.format(parsed),
    ageLabel,
    isStale: level === "STALE",
  };
}

const MS_PER_DAY = 86_400_000;

const DATE_FORMATTER = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function resolveDataFreshness(
  generatedAtIso?: string | null,
  nowMs: number = Date.now(),
): DataFreshness {
  const parsed = generatedAtIso ? Date.parse(generatedAtIso) : Number.NaN;

  if (!Number.isFinite(parsed)) {
    return {
      ageDays: null,
      level: "UNKNOWN",
      verifiedOnLabel: null,
      ageLabel: "doğrulama tarihi yok",
      isStale: true,
    };
  }

  const ageMs = Math.max(0, nowMs - parsed);
  const ageDays = Math.floor(ageMs / MS_PER_DAY);

  const level: FreshnessLevel =
    ageDays <= FRESH_MAX_AGE_DAYS
      ? "FRESH"
      : ageDays <= AGING_MAX_AGE_DAYS
      ? "AGING"
      : "STALE";

  const ageLabel =
    ageDays === 0 ? "bugün" : ageDays === 1 ? "dün" : `${ageDays} gün önce`;

  return {
    ageDays,
    level,
    verifiedOnLabel: DATE_FORMATTER.format(parsed),
    ageLabel,
    isStale: level === "STALE",
  };
}
