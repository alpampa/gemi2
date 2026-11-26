import { describe, expect, it } from "vitest";
import { OFFICIAL_SCHEDULES_DATA } from "@/lib/data/official-schedules";
import { BOSTANCI_SEHIRHATLARI_SOURCE } from "@/lib/data/bostanci-sehirhatlari-schedules";

describe("Bostancı Şehir Hatları tarifesi", () => {
  const trips = OFFICIAL_SCHEDULES_DATA.filter(
    (trip) => trip.operator === "Şehir Hatları" && trip.origin === "Bostancı" && ["Moda", "Karaköy", "Kabataş"].includes(trip.destination),
  );

  it("resmî kaynakta yayımlanan Bostancı kalkışlarını doğru günlerde gösterir", () => {
    const moda = trips.filter((trip) => trip.destination === "Moda");
    expect(moda.map((trip) => trip.departureTime).sort()).toEqual(
      ["06:50", "09:45", "10:35", "13:35", "13:35", "16:05", "16:25", "19:10", "19:30"].sort(),
    );
    expect(moda.every((trip) => trip.sourceUrl === BOSTANCI_SEHIRHATLARI_SOURCE && trip.verifiedAt)).toBe(true);
    expect(moda.find((trip) => trip.departureTime === "06:50")?.runsWeekday).toBe(true);
    expect(moda.find((trip) => trip.departureTime === "06:50")?.runsSaturday).toBe(false);
    expect(moda.find((trip) => trip.departureTime === "10:35")?.runsSaturday).toBe(true);
  });

  it("kaynakta saat sırası çelişen 18:35 seferini yayımlamaz", () => {
    expect(trips.some((trip) => trip.departureTime === "18:35")).toBe(false);
  });
});
