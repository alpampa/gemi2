import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  parseUskudarKabatasSchedules,
  parseUskudarServiceWindows,
} from "@/lib/agents/dentur-scraper";

function fixture(name: string): string {
  return readFileSync(
    fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url)),
    "utf-8"
  );
}

describe("Üsküdar–Kabataş özel servis pencereleri", () => {
  it("yoğun saat ve gece pencerelerini kaynakta yazılı biçimde çıkarır", () => {
    const recs = parseUskudarKabatasSchedules(
      fixture("dentur-uskudar-kabatas.html")
    );

    const uskudar = recs.find(
      (r) => r.origin === "Üsküdar" && r.dayType === "WEEKDAY"
    );
    const kabatas = recs.find(
      (r) => r.origin === "Kabataş" && r.dayType === "WEEKDAY"
    );

    // Akşam yoğun saat Üsküdar kalkışlarında yazılı.
    const rush = uskudar?.serviceWindows?.find((w) => w.kind === "RUSH");
    expect(rush?.startTime).toBe("16:00");
    expect(rush?.endTime).toBe("18:30");
    expect(rush?.label).toContain("Akşam Yoğun Saat");
    expect(rush?.note).toBe("aralıksız sürekli ring seferi yapılmaktadır.");

    // Yoğun saat kaynakta HAFTA İÇİ için yazılı; pazar kaydına iliştirilmez
    // (olmayan bir hizmet iddia edilmemeli).
    const sunday = recs.find(
      (r) => r.origin === "Üsküdar" && r.dayType === "SUNDAY"
    );
    expect(sunday?.serviceWindows?.some((w) => w.kind === "RUSH")).toBe(false);
    // Gece sıklığı gün ayrımı yapılmadan verilir → pazar dahil her gün.
    expect(sunday?.serviceWindows?.some((w) => w.kind === "NIGHT")).toBe(true);

    // Sabah yoğun saat Kabataş kalkışlarında yazılı.
    const morning = kabatas?.serviceWindows?.find((w) => w.kind === "RUSH");
    expect(morning?.startTime).toBe("08:10");
    expect(morning?.endTime).toBe("09:10");
    expect(morning?.label).toContain("Sabah Yoğun Saat");

    // Gece sıklığı — pencere başına ayrı kayıt.
    const nightUskudar = uskudar?.serviceWindows?.find((w) => w.kind === "NIGHT");
    expect(nightUskudar?.startTime).toBe("21:00");
    expect(nightUskudar?.endTime).toBe("00:00");
    expect(nightUskudar?.note).toBe("Her 20 dakikada bir");

    const nightKabatas = kabatas?.serviceWindows?.find((w) => w.kind === "NIGHT");
    expect(nightKabatas?.startTime).toBe("21:10");
    expect(nightKabatas?.endTime).toBe("00:15");

    // Pencere içine saat uydurulmadı: kayıt sayısı değişmedi.
    expect(recs.length).toBe(6);
  });

  it("pencere bloğu yoksa boş dizi döndürür (uydurma yok)", () => {
    expect(parseUskudarServiceWindows("<div>yok</div>")).toEqual([]);
  });
});
