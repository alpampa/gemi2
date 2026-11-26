import { describe, it } from "vitest";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { scrapeAllDenturSchedules } from "@/lib/agents/dentur-scraper";

/**
 * GERÇEK VERİ ÜRETİCİ:
 * `GENERATE_DENTUR=1 npx vitest run src/lib/agents/__tests__/generate-dentur-data.test.ts`
 * çalıştırınca denturavrasya.com canlı sayfalarını çeker, parse eder ve
 * src/lib/data/dentur-schedules.json dosyasını YENİDEN yazar.
 *
 * Varsayılan (env yokken) bu test HİÇBİR ŞEY yapmaz → CI/push sırasında
 * ağ çağrısı yapılmaz. Üretilen JSON repoya işlenmiş gerçek veridir.
 */
describe("dentur üretici", () => {
  /**
   * NEDEN açık süre: canlı ağ üreticisi (bkz. generate-announcements.test.ts).
   * Varsayılan 5 sn, birden çok resmî sayfayı çeken bir üretici için gerçekçi
   * değil; süre dolduğunda gecelik senkron düşer ve tarife yenilenmez.
   */
  it(
    "canlı veriyi çekip JSON üretir (env ile)",
    async () => {
      if (process.env.GENERATE_DENTUR !== "1") return;

      const { records, failures } = await scrapeAllDenturSchedules();

      /**
       * SIRA ÖNEMLİ: doğrulama YAZMADAN ÖNCE yapılır. Önceki sürüm dosyayı
       * yazıp sonra hata fırlatıyordu; yani başarısız bir çalışma, doğrulanmış
       * tarifeyi bozuk hâliyle EZİYOR ve ancak ondan sonra kırmızı oluyordu.
       * 26 Kasım 2026'da tam bu oldu (569 kayıt -> 4 kayıt) ve bozuk veri
       * commit'lendi. Artık eksik üretimde dosya hiç değişmez.
       */
      if (failures.length > 0) {
        throw new Error(
          `Dentur üretimi kısmen başarısız (${records.length} kayıt); tarife dosyası DEĞİŞTİRİLMEDİ: ${JSON.stringify(failures)}`
        );
      }

      const payload = {
        operator: "Dentur Avrasya",
        sourceBase: "https://www.denturavrasya.com/tr-TR/hatlarimiz/*",
        generatedAt: new Date().toISOString(),
        scrapedAtUserAgent:
          "Vapur-Sync-Agent/3.0 (resmi denturavrasya.com sayfalarından birebir)",
        note: "Sayfalarda birebir yazılı saatler kaydedildi; 'Sürekli Sefer' pencereleri isContinuous ile işaretlidir, sahte dakika üretilmedi.",
        failures,
        lines: records,
      } as const;

      const outPath = fileURLToPath(
        new URL("../../data/dentur-schedules.json", import.meta.url)
      );
      writeFileSync(outPath, JSON.stringify(payload, null, 2) + "\n", "utf-8");
    },
    180_000
  );
});
