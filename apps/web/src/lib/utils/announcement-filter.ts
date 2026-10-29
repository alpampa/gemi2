import type { OperatorAnnouncement } from "@/lib/types/announcement";
import {
  dateKeyToDayIndex,
  getIstanbulDateParts,
  parseIsoDateKey,
  parseTrDateKey,
  toDateKey,
} from "@/lib/utils/istanbul-date";

const TR_MONTHS: Record<string, number> = {
  ocak: 1,
  şubat: 2,
  subat: 2,
  mart: 3,
  nisan: 4,
  mayıs: 5,
  mayis: 5,
  haziran: 6,
  temmuz: 7,
  ağustos: 8,
  agustos: 8,
  eylül: 9,
  eylul: 9,
  ekim: 10,
  kasım: 11,
  kasim: 11,
  aralık: 12,
  aralik: 12,
};

/** Metin içinde açıkça yazılmış GG.AA.YYYY tarihini çıkarır (uydurma yok). */
export function extractTrDate(value?: string): string | undefined {
  if (!value) return undefined;
  const m = value.match(/\b(\d{2})\.(\d{2})\.(20\d{2})\b/);
  if (!m) return undefined;
  return `${m[1]}.${m[2]}.${m[3]}`;
}

/**
 * Duyurunun güncel olup olmadığını belirler.
 * HAYATİ KURAL: İptal duyuruları (CANCELLATION / CANCELLED_TRIPS) yalnızca
 * açık bir yayın tarihine (publishedAt) sahipse VE bu tarih BUGÜNÜN İstanbul
 * tarihine (curKey) eşitse geçerli sayılır. Tarihsiz veya geçmiş tarihli
 * hiçbir iptal duyurusu kabul edilmez.
 */
export function isAnnouncementCurrent(
  announcement: Pick<OperatorAnnouncement, "title" | "body" | "type" | "publishedAt">,
  nowMs: number = Date.now()
): boolean {
  const text = `${announcement.title || ""} ${announcement.body || ""}`.toLowerCase();
  const nowParts = getIstanbulDateParts(nowMs);
  const currentYear = nowParts.year;
  const currentMonth = nowParts.month;
  const curKey = toDateKey(nowParts);
  const curDayIndex = dateKeyToDayIndex(curKey);

  const isCancelType =
    announcement.type === "CANCELLATION" || announcement.type === "CANCELLED_TRIPS";

  // 1. İptal duyurularında yayın tarihi ZORUNLUDUR ve BUGÜN olmalıdır.
  if (isCancelType && !announcement.publishedAt) {
    return false;
  }

  if (announcement.publishedAt) {
    const pubKey = announcement.publishedAt.includes(".")
      ? parseTrDateKey(announcement.publishedAt)
      : parseIsoDateKey(announcement.publishedAt);

    if (!pubKey) {
      if (isCancelType) return false;
    } else {
      const diffDays = curDayIndex - dateKeyToDayIndex(pubKey);
      if (isCancelType) {
        if (pubKey !== curKey) return false;
      } else {
        if (diffDays > 14) return false;
      }
    }
  }

  // 2. Başlık veya gövdede geçen açık tarih tespiti
  const dateRegex =
    /(?:(\d{1,2})[-–\s]+)?(\d{1,2})\s*(ocak|şubat|subat|mart|nisan|mayıs|mayis|haziran|temmuz|ağustos|agustos|eylül|eylul|ekim|kasım|kasim|aralık|aralik)(?:\s*(\d{4}))?/i;
  const match = text.match(dateRegex);
  if (match) {
    const endDay = parseInt(match[2] || "0", 10);
    const month = TR_MONTHS[match[3]?.toLowerCase() || ""];
    const year = match[4] ? parseInt(match[4], 10) : currentYear;

    if (month && year && endDay) {
      const targetKey = year * 10000 + month * 100 + endDay;
      const diffDays = curDayIndex - dateKeyToDayIndex(targetKey);

      if (
        isCancelType ||
        announcement.type === "EXTRA_SERVICE"
      ) {
        if (targetKey !== curKey) return false;
      } else {
        if (diffDays > 3) return false;
      }
    }
  }

  if (text.includes("2023") || text.includes("2024") || text.includes("2025")) {
    return false;
  }

  if (
    text.includes("sevgililer gunu") ||
    text.includes("sevgililer günü") ||
    text.includes("yılbaşı") ||
    text.includes("yilbasi")
  ) {
    if (match) {
      const month = TR_MONTHS[match[3]?.toLowerCase() || ""];
      if (month && Math.abs(currentMonth - month) > 1) return false;
    } else {
      return false;
    }
  }

  if (
    text.includes("haziran") ||
    text.includes("temmuz") ||
    text.includes("ağustos") ||
    text.includes("agustos") ||
    text.includes("eylül") ||
    text.includes("eylul") ||
    text.includes("yaz tarifesine")
  ) {
    return false;
  }

  if (
    text.includes("projesi") ||
    text.includes("sunset tur") ||
    text.includes("türk gecesi") ||
    text.includes("turk gecesi") ||
    text.includes("mehtap turu") ||
    text.includes("ücretsiz geçiş hakkı") ||
    text.includes("kart kullanıcılarının") ||
    text.includes("otonom elektrikli")
  ) {
    return false;
  }

  return true;
}
