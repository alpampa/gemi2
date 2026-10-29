import { describe, expect, it } from "vitest";
import { OFFICIAL_SCHEDULES_DATA } from "@/lib/data/official-schedules";

describe("İDO Adalar tarifesi doğrulaması", () => {
  it("güncel resmî tarife doğrulanmadığı için İDO adına Adalar seferi üretmez", () => {
    const trips = OFFICIAL_SCHEDULES_DATA.filter(
      (trip) => trip.operator === "İDO" && trip.category === "ADALAR"
    );

    expect(trips).toEqual([]);
  });
});
