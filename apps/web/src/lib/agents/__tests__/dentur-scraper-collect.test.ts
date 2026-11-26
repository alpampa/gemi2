import { describe, it, expect } from "vitest";
import {
  scrapeAllDenturSchedules,
  type DenturLineKey,
  type DenturLineRecord,
} from "@/lib/agents/dentur-scraper";

/**
 * Regresyon: hat sayfası alınıp parser BOŞ dizi döndürdüğünde bu "başarı"
 * sayılıyordu. 26 Kasım 2026 gecelik senkronunda tarife 569 kayıttan 4 kayda
 * düştü ve `failures` BOŞ kaldı; `failures.length > 0` koruması tetiklenmedi
 * ve eksik tarife commit'lendi (bkz. commit 3bb5fec -> 0e43a67 geri alma).
 *
 * Parser testleri ayrı dosyadadır (dentur-scraper.test.ts, resmî fixture'lar);
 * bu dosya yalnızca "toplama" katmanının hata muhasebesini ölçer.
 */
function record(line: string): DenturLineRecord {
  return {
    line,
    origin: "Beşiktaş",
    destination: "Büyükada",
    directionLabel: "Gidiş",
    dayType: "WEEKDAY",
    departureTime: "09:30",
    arrivalTime: "11:15",
  };
}

describe("scrapeAllDenturSchedules — sessiz eksik üretim koruması", () => {
  it("0 kayıt döndüren hattı hata olarak raporlar", async () => {
    const { records, failures } = await scrapeAllDenturSchedules({
      scrapeLine: async (_url, line: DenturLineKey) =>
        line === "adalar" ? [record("Adalar")] : [],
    });

    expect(records).toHaveLength(1);
    expect(failures.map((f) => f.line).sort()).toEqual([
      "besiktaskadikoy",
      "uskudarbesiktas",
      "uskudarkabatas",
    ]);
    for (const failure of failures) {
      expect(failure.error).toMatch(/0 sefer/);
    }
  });

  it("tüm hatlar 0 kayıt dönerse records boş, her hat hata listesinde", async () => {
    const { records, failures } = await scrapeAllDenturSchedules({
      scrapeLine: async () => [],
    });

    expect(records).toEqual([]);
    expect(failures).toHaveLength(4);
  });

  it("fırlatan hattı diğerlerinden bağımsız raporlar", async () => {
    const { records, failures } = await scrapeAllDenturSchedules({
      scrapeLine: async (_url, line: DenturLineKey) => {
        if (line === "adalar") throw new Error("Dentur adalar HTTP 404");
        return [record(line)];
      },
    });

    expect(records).toHaveLength(3);
    expect(failures).toEqual([
      { line: "adalar", error: "Dentur adalar HTTP 404" },
    ]);
  });

  it("sağlıklı çalışmada hata üretmez", async () => {
    const { records, failures } = await scrapeAllDenturSchedules({
      scrapeLine: async (_url, line: DenturLineKey) => [record(line)],
    });

    expect(failures).toEqual([]);
    expect(records).toHaveLength(4);
  });
});
