import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  parseBesiktasKadikoySchedules,
  parseAdalarSchedules,
  parseUskudarKabatasSchedules,
  parseUskudarBesiktasSchedules,
} from "@/lib/agents/dentur-scraper";

/**
 * Bu fixture'lar denturavrasya.com hat sayfalarının 2026-11-27 tarihli
 * GERÇEK içeriğidir (yalnızca <style>/<script> gövdeleri çıkarıldı; kart
 * HTML'i birebir korunur). Site Next.js'e taşındığı için eski tablo tabanlı
 * fixture'lar geçersiz kaldı; sayılar kaynaktan yeniden doğrulandı.
 */
function fixture(name: string): string {
  return readFileSync(
    fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url)),
    "utf-8"
  );
}

describe("Dentur gerçek tarife parser'ı (resmî site fixture'ları)", () => {
  it("Beşiktaş↔Kadıköy: iki yön, Hİ+Cmt 28, Pazar 26 sefer", () => {
    const recs = parseBesiktasKadikoySchedules(
      fixture("dentur-besiktaskadikoy.html")
    );
    const weekdaySat = recs.filter((r) => r.dayType === "WEEKDAY_SAT");
    const sunday = recs.filter((r) => r.dayType === "SUNDAY");

    expect(weekdaySat.length).toBe(56); // 2 yön × 28
    expect(sunday.length).toBe(52); // 2 yön × 26

    const besToKad = weekdaySat.filter((r) => r.origin === "Beşiktaş");
    const kadToBes = weekdaySat.filter((r) => r.origin === "Kadıköy");
    expect(besToKad.length).toBe(28);
    expect(kadToBes.length).toBe(28);

    // Sayfada yazılı ilk/son seferler
    const weekdayTimes = besToKad.map((r) => r.departureTime).sort();
    expect(weekdayTimes[0]).toBe("07:30");
    expect(weekdayTimes[weekdayTimes.length - 1]).toBe("21:00");

    const sundayTimes = sunday
      .filter((r) => r.origin === "Beşiktaş")
      .map((r) => r.departureTime)
      .sort();
    expect(sundayTimes[0]).toBe("08:30");

    // Saatler sayfada birebir yazılı; uydurma dakika yok.
    expect(recs.every((r) => /^([0-2]\d):[0-5]\d$/.test(r.departureTime))).toBe(
      true
    );
    // Bu hatta "sürekli sefer" ifadesi yok.
    expect(recs.some((r) => r.isContinuous)).toBe(false);
  });

  it("Adalar: hafta içi ve hafta sonu gidiş/dönüş, iframe kopyası tekilleşir", () => {
    const recs = parseAdalarSchedules(fixture("dentur-adalar.html"));

    const gidisWeekday = recs.filter(
      (r) => r.dayType === "WEEKDAY" && r.origin === "Beşiktaş"
    );
    const donusWeekday = recs.filter(
      (r) => r.dayType === "WEEKDAY" && r.origin === "Büyükada"
    );
    const gidisWeekend = recs.filter(
      (r) => r.dayType === "WEEKEND" && r.origin === "Beşiktaş"
    );
    const donusWeekend = recs.filter(
      (r) => r.dayType === "WEEKEND" && r.origin === "Büyükada"
    );

    // Sayfa her gün tipinde 2 gidiş + 2 dönüş yayımlıyor.
    expect(gidisWeekday.length).toBe(2);
    expect(donusWeekday.length).toBe(2);
    expect(gidisWeekend.length).toBe(2);
    expect(donusWeekend.length).toBe(2);

    // Kart HTML'i sayfada iki kez (görünür + iframe srcdoc) geçiyor;
    // kimlik tekilleştirmesi çalışmazsa sayı iki katına çıkardı.
    expect(recs.length).toBe(8);

    const first = gidisWeekday.sort((a, b) =>
      a.departureTime.localeCompare(b.departureTime)
    )[0];
    expect(first.departureTime).toBe("09:30");
    expect(first.arrivalTime).toBe("11:15");
    expect(first.stops?.map((s) => `${s.name}@${s.time}`)).toEqual([
      "KABATAŞ@09:45",
      "SİRKECİ@10:00",
      "HEYBELİADA@11:00",
    ]);
  });

  it("Üsküdar↔Kabataş: tek tek saat yok → yazılı aralık + sıklık", () => {
    const recs = parseUskudarKabatasSchedules(
      fixture("dentur-uskudar-kabatas.html")
    );

    // 2 iskele × 3 gün tipi
    expect(recs.length).toBe(6);
    expect(recs.every((r) => r.isContinuous)).toBe(true);

    const uskudarWeekday = recs.find(
      (r) => r.origin === "Üsküdar" && r.dayType === "WEEKDAY"
    );
    expect(uskudarWeekday?.departureTime).toBe("06:45");
    expect(uskudarWeekday?.continuousUntil).toBe("00:00");
    expect(uskudarWeekday?.serviceFrequencyLabel).toBe("10 Dakikada Bir");
    expect(uskudarWeekday?.price).toBe("51,81₺");

    const uskudarSat = recs.find(
      (r) => r.origin === "Üsküdar" && r.dayType === "SATURDAY"
    );
    expect(uskudarSat?.departureTime).toBe("08:00");
    expect(uskudarSat?.serviceFrequencyLabel).toBe("10 - 15 Dakikada Bir");

    const uskudarSun = recs.find(
      (r) => r.origin === "Üsküdar" && r.dayType === "SUNDAY"
    );
    expect(uskudarSun?.departureTime).toBe("09:00");
    expect(uskudarSun?.serviceFrequencyLabel).toBe("15 - 20 Dakikada Bir");

    const kabatasWeekday = recs.find(
      (r) => r.origin === "Kabataş" && r.dayType === "WEEKDAY"
    );
    expect(kabatasWeekday?.departureTime).toBe("06:55");
    expect(kabatasWeekday?.continuousUntil).toBe("00:15");
  });

  it("Üsküdar↔Beşiktaş: sürekli sefer pencereleri ve İstanbulkart ücreti", () => {
    const recs = parseUskudarBesiktasSchedules(
      fixture("dentur-uskudar-besiktas.html")
    );

    expect(recs.length).toBe(4);
    expect(recs.every((r) => r.isContinuous)).toBe(true);

    const uskudarWeekdaySat = recs.find(
      (r) => r.origin === "Üsküdar" && r.dayType === "WEEKDAY_SAT"
    );
    expect(uskudarWeekdaySat?.departureTime).toBe("06:10");
    expect(uskudarWeekdaySat?.continuousUntil).toBe("00:45");

    const uskudarSunday = recs.find(
      (r) => r.origin === "Üsküdar" && r.dayType === "SUNDAY"
    );
    expect(uskudarSunday?.departureTime).toBe("06:20");

    const besiktasWeekdaySat = recs.find(
      (r) => r.origin === "Beşiktaş" && r.dayType === "WEEKDAY_SAT"
    );
    expect(besiktasWeekdaySat?.departureTime).toBe("06:20");
    expect(besiktasWeekdaySat?.continuousUntil).toBe("01:00");

    // Ücret resmî sayfada yazılı: İstanbulkart Tam Geçiş.
    expect(besiktasWeekdaySat?.price).toBe("50,15 ₺");
  });

  it("sayfa yapısı tanınmazsa boş dizi döndürür (sessiz uydurma yok)", () => {
    expect(parseBesiktasKadikoySchedules("<html><body>yok</body></html>")).toEqual(
      []
    );
    expect(parseAdalarSchedules("<html><body>yok</body></html>")).toEqual([]);
    expect(
      parseUskudarKabatasSchedules("<html><body>yok</body></html>")
    ).toEqual([]);
    expect(
      parseUskudarBesiktasSchedules("<html><body>yok</body></html>")
    ).toEqual([]);
  });
});
