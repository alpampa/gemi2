import { createHash } from "node:crypto";
import * as cheerio from "cheerio";
import { isKvConfigured, kvGetJson, kvSetJson } from "@/lib/agents/kv-store";
import { BOSTANCI_SEHIRHATLARI_SOURCE } from "@/lib/data/bostanci-sehirhatlari-schedules";

const IDO_SOURCE = "https://www.ido.com.tr/tr/sefer-saatleri";
const STATE_KEY = "vapur:source-watch:bostanci";
type SavedState = {
  cityScheduleHash: string;
  scheduleText: string;
  checkedAt: string;
  needsReview?: boolean;
  changedAt?: string;
  previousScheduleText?: string;
};

async function readSource(url: string): Promise<{ status: number; html: string }> {
  const response = await fetch(url, {
    cache: "no-store", signal: AbortSignal.timeout(12_000),
    headers: { "User-Agent": "VapurSeferAsistani/1.0 (official schedule verification)" },
  });
  return { status: response.status, html: response.ok ? await response.text() : "" };
}

/** Her gece resmî tarifeyi okur. Fark bulursa otomatik saat değiştirmez; incelemeye bırakır. */
export async function checkBostanciOfficialSources() {
  const checkedAt = new Date().toISOString();
  const previous = await kvGetJson<SavedState>(STATE_KEY);
  let city: {
    status: string;
    changed: boolean;
    scheduleHash?: string;
    changeSummary?: { previous: string | undefined; current: string };
  };

  try {
    const response = await readSource(BOSTANCI_SEHIRHATLARI_SOURCE);
    if (response.status < 200 || response.status >= 300) {
      city = { status: `Kaynağa erişilemedi (HTTP ${response.status})`, changed: false };
    } else {
      const $ = cheerio.load(response.html);
      const timetable = $("table").toArray()
        .map((table) => $(table).text().replace(/\s+/g, " ").trim())
        .filter((tableText) => tableText.includes("06:50") || tableText.includes("10:35"))
        .join(" | ");
      if (!timetable.includes("06:50") || !timetable.includes("10:35")) {
        city = { status: "Tarife tablosu tanınmadı; inceleme gerekli", changed: false };
      } else {
        const scheduleHash = createHash("sha256").update(timetable).digest("hex");
        const changed = Boolean(previous?.cityScheduleHash && previous.cityScheduleHash !== scheduleHash);
        const needsReview = changed || Boolean(previous?.needsReview);
        const persistentWatch = isKvConfigured();
        const changeSummary = changed
          ? { previous: previous?.scheduleText, current: timetable }
          : needsReview && previous?.previousScheduleText
            ? { previous: previous.previousScheduleText, current: previous.scheduleText }
            : undefined;
        city = {
          status: changed ? "Tarifede değişiklik bulundu; insan kontrolü gerekli"
            : needsReview ? "Tarife değişikliği insan incelemesi bekliyor"
              : persistentWatch ? "Resmî tarife kontrol edildi" : "Tarife okundu; kalıcı değişiklik takibi için depo ayarlanmamış",
          changed: needsReview,
          scheduleHash,
          ...(changeSummary ? { changeSummary } : {}),
        };
        await kvSetJson(STATE_KEY, {
          cityScheduleHash: scheduleHash,
          scheduleText: timetable,
          checkedAt,
          needsReview,
          changedAt: changed ? checkedAt : previous?.changedAt,
          previousScheduleText: changed ? previous?.scheduleText : previous?.previousScheduleText,
        });
      }
    }
  } catch (error) {
    city = { status: `Kontrol başarısız: ${error instanceof Error ? error.message : "bilinmeyen hata"}`, changed: false };
  }

  let ido: { status: string };
  try {
    const response = await readSource(IDO_SOURCE);
    ido = { status: response.status >= 200 && response.status < 300
      ? "Sayfa açıldı; sefer saatleri ayrıca doğrulanmalı"
      : `Resmî saat sayfası erişime kapalı (HTTP ${response.status}); saatler doğrulanamadı` };
  } catch (error) {
    ido = { status: `Resmî saat sayfası kontrol edilemedi; saatler doğrulanamadı (${error instanceof Error ? error.message : "hata"})` };
  }

  const result = { checkedAt, cityHatlari: city, ido };
  if (city.changed || !city.status.startsWith("Resmî tarife kontrol edildi")) {
    console.warn("[schedule-source-watch] İnsan incelemesi gerekli", result);
  }
  return result;
}
