import { describe, expect, it } from "vitest";
import { normalizePierName, isKnownPier } from "@/lib/data/piers";

describe("normalizePierName — iskele adı tek kanonik ada çevrilir", () => {
  it("büyük/küçük harf ve diyakritik farkları tek ada indirger", () => {
    const variants = ["HEYBELİADA", "Heybeliada", "heybeliada", "HEYBELIADA"];
    const canon = new Set(variants.map(normalizePierName));
    expect([...canon]).toEqual(["Heybeliada"]);
  });

  it("Türkçe büyük İ/KABATAŞ doğru çevrilir", () => {
    expect(normalizePierName("KABATAŞ")).toBe("Kabataş");
    expect(normalizePierName("kabatas")).toBe("Kabataş");
  });

  it("Sirkeci resmî kaynak yazımını Eminönü kanonik adına çevirir", () => {
    expect(normalizePierName("SİRKECİ")).toBe("Eminönü");
    expect(normalizePierName("sirkeci")).toBe("Eminönü");
  });

  it("bilinmeyen adı DEĞİŞTİRMEZ (tahmin yok)", () => {
    expect(normalizePierName("Boğaz Turu")).toBe("Boğaz Turu");
    expect(normalizePierName("Bilinmeyen İskele")).toBe("Bilinmeyen İskele");
  });

  it("boş girdide boş döner", () => {
    expect(normalizePierName(undefined)).toBe("");
    expect(normalizePierName(null)).toBe("");
    expect(normalizePierName("   ")).toBe("");
  });

  it("isKnownPier yalnızca gerçek eşleşmede true döner", () => {
    expect(isKnownPier("BÜYÜKADA")).toBe(true);
    expect(isKnownPier("Kadıköy")).toBe(true);
    expect(isKnownPier("Uzay İskelesi")).toBe(false);
  });

  it("kanonik yazımlar için kimlik döner", () => {
    for (const name of ["Büyükada", "Kadıköy", "Üsküdar", "Bostancı"]) {
      expect(normalizePierName(name)).toBe(name);
    }
  });
});
