import { describe, it } from "vitest";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { scrapeAllAnnouncements } from "@/lib/agents/announcements-agent";

/**
 * DUYURU SNAPSHOT ÜRETİCİ:
 * `GENERATE_ANNOUNCEMENTS=1 npx vitest run src/lib/agents/__tests__/generate-announcements.test.ts`
 * resmi duyuru sayfalarını canlı çeker ve
 * src/lib/agents/data-snapshots/announcements.json dosyasını YENİDEN yazar.
 * env yokken test hiçbir şey yapmaz (CI'da ağ çağrısı yok).
 */
describe("duyuru üretici", () => {
  /**
   * NEDEN açık süre: bu bir birim testi değil, canlı ağ üreticisidir.
   * Kaynak başına 8 sn zaman aşımı var ve birden çok resmî site paralel
   * çekiliyor; toplam süre kaçınılmaz olarak vitest'in 5 sn'lik varsayılanını
   * aşıyor. Bu satır olmadan gecelik senkron iş akışı her gece
   * "Test timed out in 5000ms" ile düşüyor ve tarife verisi hiç yenilenmiyordu
   * (20–26 Kasım 2026 arası 8 koşu üst üste kırmızı).
   */
  it(
    "canlı duyuruları çekip snapshot üretir (env ile)",
    async () => {
      if (process.env.GENERATE_ANNOUNCEMENTS !== "1") return;

      const { snapshots, failures, coverage } = await scrapeAllAnnouncements();
      const payload = {
        generatedAt: new Date().toISOString(),
        failures,
        coverage,
        sources: snapshots,
      };

      const outPath = fileURLToPath(
        new URL("../data-snapshots/announcements.json", import.meta.url)
      );
      writeFileSync(outPath, JSON.stringify(payload, null, 2) + "\n", "utf-8");
    },
    180_000
  );
});
