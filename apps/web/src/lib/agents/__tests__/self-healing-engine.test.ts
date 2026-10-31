import { describe, expect, it } from "vitest";
import { selfHealTripRecord } from "@/lib/agents/self-healing-engine";
import type { RawOfficialTrip } from "@/lib/data/official-schedules";

function makeTrip(overrides: Partial<RawOfficialTrip> = {}): RawOfficialTrip {
  return {
    id: "test-1",
    origin: "Bostancı",
    destination: "Büyükada",
    operator: "Şehir Hatları",
    departureTime: "10:00",
    platform: "",
    price: "",
    ...overrides,
  };
}

describe("selfHealTripRecord — kaynak dürüstlüğü", () => {
  it("resmî varış yoksa arrivalTime'ı ÜRETMEZ, yalnızca tahmini işaretler", () => {
    const healed = selfHealTripRecord(makeTrip({ arrivalTime: "-" }));

    expect(healed.arrivalTime).toBeUndefined();
    expect(healed.arrivalSource).toBe("derived");
    expect(healed.derivedArrivalTime).toMatch(/^\d{2}:\d{2}$/);
  });

  it("resmî varış varsa olduğu gibi korur", () => {
    const healed = selfHealTripRecord(makeTrip({ arrivalTime: "10:45" }));

    expect(healed.arrivalTime).toBe("10:45");
    expect(healed.arrivalSource).toBe("official");
    expect(healed.derivedArrivalTime).toBeUndefined();
  });

  it("platform kaynakta yoksa uydurma isim üretmez", () => {
    const healed = selfHealTripRecord(makeTrip({ origin: "Kınalıada", platform: "" }));

    expect(healed.platform).toBe("");
    expect(healed.platformSource).toBe("unknown");
  });

  it("platform kaynakta varsa resmî sayar", () => {
    const healed = selfHealTripRecord(makeTrip({ platform: "Bostancı İskelesi" }));

    expect(healed.platform).toBe("Bostancı İskelesi");
    expect(healed.platformSource).toBe("official");
  });

  it("boş fiyatı resmî tarife tablosundan doldurur ve kaynağını işaretler", () => {
    const healed = selfHealTripRecord(makeTrip({ price: "" }));

    expect(healed.price).not.toBe("");
    expect(healed.priceSource).toBe("official-fare-table");
  });

  it("operatör fiyatı varsa official-operator olarak işaretler", () => {
    const healed = selfHealTripRecord(makeTrip({ price: "85,00 ₺" }));

    expect(healed.price).toBe("85,00 ₺");
    expect(healed.priceSource).toBe("official-operator");
  });
});
