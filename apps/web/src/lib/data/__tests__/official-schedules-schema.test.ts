import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { OFFICIAL_SCHEDULES_DATA } from "@/lib/data/official-schedules";
import { tripRecordSchema } from "@/lib/data/schema";

/**
 * VERİ DOĞRULAMA KAPISI (birim katmanı):
 * Uygulamaya yüklenen tüm resmî sefer kayıtları Zod şemasından geçmelidir.
 * AGENTS.md kuralı: HH:mm dışı saat, kalkış=varış veya arrivalSource=official
 * iken arrivalTime eksik olan bir kayıt yolcuya gösterilemez.
 */

const denturJson = JSON.parse(
  readFileSync(path.resolve(__dirname, "../dentur-schedules.json"), "utf8"),
) as { generatedAt?: string };

describe("tripRecordSchema — resmî sefer kayıtları şema uyumu", () => {
  it("her snapshot dosyası generatedAt damgası taşır (kaynak doğrulanabilir)", () => {
    expect(denturJson.generatedAt, "dentur-schedules.json generatedAt").toBeTruthy();
  });

  it("OFFICIAL_SCHEDULES_DATA'nın her kaydı şemaya uyar", () => {
    const failures: string[] = [];
    OFFICIAL_SCHEDULES_DATA.forEach((trip, i) => {
      const result = tripRecordSchema.safeParse(trip);
      if (!result.success) {
        failures.push(
          `[${i}] ${trip.id} (${trip.origin}→${trip.destination}): ${result.error.issues
            .map((iss) => `${iss.path.join(".")}: ${iss.message}`)
            .join("; ")}`,
        );
      }
    });
    expect(failures).toEqual([]);
  });
});
