/**
 * transit-time — gece yarısını aşan seferlerin geri sayımı.
 *
 * NEDEN: `resolveVoyageTiming` içinde ayrı bir Intl formatter vardı ve
 * `hour12: false` ICU sürümüne göre gece yarısını 24 olarak okutuyordu.
 * Saat 24 görülünce "gece yarısını aştık" dalı (`currentH >= 20 && depH < 5`)
 * yanlışlıkla devreye giriyor, 00:20 seferi ~24 saat sonrasına atılıyordu.
 * Bu dosya o sözleşmeyi ICU sürümünden bağımsız kilitler.
 */
import { describe, it, expect } from "vitest";
import { resolveVoyageTiming } from "@/lib/utils/transit-time";

const AT = (iso: string) => new Date(iso).getTime();

describe("resolveVoyageTiming", () => {
  it("gece yarısından hemen sonra kalkacak seferi yaklaşan sayar", () => {
    // 00:05'te 00:20 seferi → 15 dk kaldı, kalkmış DEĞİL.
    const timing = resolveVoyageTiming("00:20", AT("2026-10-02T00:05:00+03:00"));
    expect(timing.isDeparted).toBe(false);
    expect(timing.minutesRemaining).toBe(15);
    expect(timing.urgency).toBe("IMMINENT");
  });

  it("gece yarısına 10 dk kala ertesi günün ilk seferini doğru sayar", () => {
    // 23:50'de 00:20 seferi → 30 dk sonra (yarın), kalkmış değil.
    const timing = resolveVoyageTiming("00:20", AT("2026-10-01T23:50:00+03:00"));
    expect(timing.isDeparted).toBe(false);
    expect(timing.minutesRemaining).toBe(30);
  });

  it("gece yarısından sonra dünün son seferini kalkmış sayar", () => {
    // 00:10'da 23:55 seferi → 15 dk önce kalktı.
    const timing = resolveVoyageTiming("23:55", AT("2026-10-02T00:10:00+03:00"));
    expect(timing.isDeparted).toBe(true);
    expect(timing.countdownFormatted).toBe("15 dk önce");
  });
});
