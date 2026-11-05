import { describe, it, expect } from "vitest";
import { getLiveOrOfficialSchedules } from "@/lib/agents/timetable-engine";
import {
  SCHEDULE_EXPIRY_DAYS,
  resolveTripFreshness,
} from "@/lib/utils/data-freshness";
import { BOSTANCI_SEHIRHATLARI_VERIFIED_AT } from "@/lib/data/bostanci-sehirhatlari-schedules";

describe("getLiveOrOfficialSchedules — tazelik kapısı", () => {
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
    const res = await getLiveOrOfficialSchedules();
    const nowMs = Date.parse(res.serverTimeIso);
    for (const trip of res.schedules) {
      if (!trip.verifiedAt) continue;
      const freshness = resolveTripFreshness(trip.verifiedAt, nowMs);
      expect(freshness.ageDays).not.toBeNull();
      expect(freshness.isExpired).toBe(false);
      expect((freshness.ageDays ?? 0) <= SCHEDULE_EXPIRY_DAYS).toBe(true);
    }
    // Hiçbir kayıt sessizce gizlenmez: gizlenenler sayı olarak raporlanır.
    expect(res.dataQuality).toBeDefined();
    expect(res.dataQuality!.expiredCount).toBe(0);
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
    const res = await getLiveOrOfficialSchedules();
    const bostanci = res.schedules.filter((t) => t.id.startsWith("sh-bostanci-"));
    expect(bostanci.length).toBeGreaterThan(0);
    for (const trip of bostanci) {
      expect(trip.verifiedAt).toBe(BOSTANCI_SEHIRHATLARI_VERIFIED_AT);
      expect(trip.freshnessLevel).toBe("FRESH");
    }
  });
});
