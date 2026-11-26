import { describe, it, expect } from "vitest";
import { getLiveOrOfficialSchedules } from "@/lib/agents/timetable-engine";
import {
  SCHEDULE_EXPIRY_DAYS,
  resolveTripFreshness,
} from "@/lib/utils/data-freshness";
import { BOSTANCI_SEHIRHATLARI_VERIFIED_AT } from "@/lib/data/bostanci-sehirhatlari-schedules";

describe("getLiveOrOfficialSchedules — tazelik kapısı", () => {
  /**
   * Veri setindeki EN YENİ doğrulama damgası (ms).
   *
   * NEDEN: gizleme eşiği 45 gün. Test duvar saatine göre koşarsa, paket
   * içindeki sabit damgalar bir gün eşiği aştığında test VERİ DEĞİŞMEDEN
   * kırılır (takvim bombası — 23 Kasım 2026'da 97 sefer "süresi dolmuş"
   * olduğu için kırıldı). Sözleşme "bugün hiçbir kayıt eskimiş olmasın"
   * değil; "eşiği aşan kayıt YAYIMLANMASIN, sayılsın ve raporlansın".
   * Bu yüzden değerlendirme anı veriden türetilir, duvar saatinden değil.
   */
  async function latestVerifiedAtMs(): Promise<number> {
    // 1970 referansında hiçbir damga "gelecekte" sayılmaz (yaş 0'a kırpılır),
    // dolayısıyla liste tam olur ve tüm damgalar okunabilir.
    const probe = await getLiveOrOfficialSchedules({ nowMs: 0 });
    const stamps = probe.schedules
      .map((t) => (t.verifiedAt ? Date.parse(t.verifiedAt) : Number.NaN))
      .filter((v) => Number.isFinite(v));
    expect(stamps.length, "doğrulama damgalı sefer bulunamadı").toBeGreaterThan(0);
    return Math.max(...stamps);
  }

  it("her yayımlanan sefer bir tazelik seviyesi taşır", async () => {
    const res = await getLiveOrOfficialSchedules();
    expect(res.schedules.length).toBeGreaterThan(0);
    for (const trip of res.schedules) {
      expect(trip.freshnessLevel).toBeDefined();
      if (trip.freshnessLevel === "UNKNOWN") {
        expect(trip.verifiedAt).toBeUndefined();
      } else {
        expect(trip.verifiedAt).toBeTruthy();
      }
    }
  });

  it("doğrulama süresi dolmuş sefer yayımlanmaz", async () => {
    const latest = await latestVerifiedAtMs();

    // 1) En yeni damganın anında: yayımdaki hiçbir kayıt eşiği aşmamış olmalı.
    const reference = await getLiveOrOfficialSchedules({ nowMs: latest });
    for (const trip of reference.schedules) {
      if (!trip.verifiedAt) continue;
      const freshness = resolveTripFreshness(trip.verifiedAt, latest);
      expect(freshness.ageDays).not.toBeNull();
      expect(freshness.isExpired).toBe(false);
      expect((freshness.ageDays ?? 0) <= SCHEDULE_EXPIRY_DAYS).toBe(true);
    }

    // 2) Eşiğin bir gün ötesinde: kapı GERÇEKTEN gizlemeli — aksi halde bu test
    //    hiçbir şey kanıtlamaz (eski hali duvar saatinde "0 gizlenen" bekliyordu).
    const beyondMs = latest + (SCHEDULE_EXPIRY_DAYS + 1) * 86_400_000;
    const beyond = await getLiveOrOfficialSchedules({ nowMs: beyondMs });
    const quality = beyond.dataQuality!;
    expect(quality.expiredCount).toBeGreaterThan(0);
    expect(quality.publishedCount).toBe(quality.totalCount - quality.expiredCount);

    // Gizlenen kayıtlar yayın listesinde bulunmamalı.
    for (const trip of beyond.schedules) {
      if (!trip.verifiedAt) continue;
      expect(resolveTripFreshness(trip.verifiedAt, beyondMs).isExpired).toBe(false);
    }

    // Tarihi BİLİNMEYEN kayıtlar kanıtsız silinmez (UNKNOWN olarak yayımlanır).
    const undated = beyond.schedules.filter((t) => t.freshnessLevel === "UNKNOWN");
    expect(undated.length).toBe(quality.undatedCount);
  });

  it("veri kalitesi özeti sayıları tutarlıdır", async () => {
    const res = await getLiveOrOfficialSchedules();
    const q = res.dataQuality!;
    expect(q.publishedCount).toBe(res.schedules.length);
    expect(q.totalCount).toBe(q.publishedCount + q.expiredCount);
    expect(q.undatedCount).toBeLessThanOrEqual(q.publishedCount);
    expect(q.undatedCount).toBe(
      res.schedules.filter((t) => t.freshnessLevel === "UNKNOWN").length,
    );
  });

  it("Bostancı tarifesi bugünkü doğrulama damgasını taşır", async () => {
    // "Tazelik" takvime göre değişen bir olgudur: gerçek saatle koşulursa bu
    // test doğrulamadan 2 gün sonra kendiliğinden kırılır (FRESH → AGING).
    // Değerlendirme anını doğrulama anına sabitleyerek ölçülen sözleşme
    // deterministik hale getirilir; eşik davranışı ayrı testlerde sınanır.
    const res = await getLiveOrOfficialSchedules({
      nowMs: Date.parse(BOSTANCI_SEHIRHATLARI_VERIFIED_AT),
    });
    const bostanci = res.schedules.filter((t) => t.id.startsWith("sh-bostanci-"));
    expect(bostanci.length).toBeGreaterThan(0);
    for (const trip of bostanci) {
      expect(trip.verifiedAt).toBe(BOSTANCI_SEHIRHATLARI_VERIFIED_AT);
      expect(trip.freshnessLevel).toBe("FRESH");
    }
  });
});
