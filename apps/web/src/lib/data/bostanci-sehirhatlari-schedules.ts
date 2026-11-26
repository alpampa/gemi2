import type { RawOfficialTrip } from "./official-schedules";

export const BOSTANCI_SEHIRHATLARI_SOURCE =
  "https://sehirhatlari.istanbul/tr/seferler/ic-hatlar/istanbul-ici-hatlar/bostanci-moda-kadikoy-kabatas-hatti-2024";
/** Ücret, tarife sayfasından doğrulanır; sefer sayfasında ücret yayımlanmaz. */
export const BOSTANCI_SEHIRHATLARI_FARE_SOURCE =
  "https://sehirhatlari.istanbul/tr/ucret-tarifeleri";
/**
 * Son doğrulama: 2026-11-05. Sefer sayfasındaki 11 Bostancı kalkışının tamamı
 * (hafta içi 8 + hafta sonu 4 satır, biri kaynakta parantezli/ters olduğu için
 * hariç) birebir eşleştirildi. Ücret sayfasında
 * "BOSTANCI - MODA - KARAKÖY - KABATAŞ HATTI" Tam = 76,90 TL doğrulandı.
 */
export const BOSTANCI_SEHIRHATLARI_VERIFIED_AT = "2026-11-05T00:00:00+03:00";

const routeTitle = "Bostancı - Moda - Karaköy - Kabataş Hattı";

function trip(
  id: string,
  departureTime: string,
  arrivalTime: string,
  stops: { name: string; time: string }[],
  serviceDays: { runsWeekday: boolean; runsSaturday: boolean; runsSunday: boolean },
): RawOfficialTrip & { sourceUrl: string; verifiedAt: string } {
  return {
    id,
    origin: "Bostancı",
    destination: "Kabataş",
    operator: "Şehir Hatları",
    category: "BOGAZ",
    departureTime,
    arrivalTime,
    platform: "Bostancı İskelesi",
    // İskele adı resmî sefer sayfasındaki "Bostancı" durağından gelir.
    platformSource: "official",
    // Sefer saatleri resmî tarife tablosundan birebir alınmıştır.
    arrivalSource: "official",
    // Şehir Hatları tarifesinde bu hat için görünen tam yolcu ücreti (76,90 TL).
    // Hat mesafe bazlıdır; tarife sayfası çıkışta iade farkı verildiğini belirtir.
    price: "₺76,90",
    priceSource: "official-fare-table",
    ...serviceDays,
    isWeekdayOnly: serviceDays.runsWeekday && !serviceDays.runsSaturday && !serviceDays.runsSunday,
    isWeekendOnly: !serviceDays.runsWeekday && (serviceDays.runsSaturday || serviceDays.runsSunday),
    stops,
    lineName: routeTitle,
    sourceUrl: BOSTANCI_SEHIRHATLARI_SOURCE,
    fareSourceUrl: BOSTANCI_SEHIRHATLARI_FARE_SOURCE,
    verifiedAt: BOSTANCI_SEHIRHATLARI_VERIFIED_AT,
  };
}

const weekdays = { runsWeekday: true, runsSaturday: false, runsSunday: false };
const weekends = { runsWeekday: false, runsSaturday: true, runsSunday: true };

/** Resmî tarifedeki Bostancı kalkışları. 18:35 satırı kaynakta varış saatlerini ters
 * gösterdiğinden (Karaköy 19:35, Kabataş 19:20) yolcuya yayımlanmaz. */
const BOSTANCI_TO_KABATAS: RawOfficialTrip[] = [
  trip("sh-bostanci-moda-0650", "06:50", "08:00", [{ name: "Moda", time: "07:20" }, { name: "Karaköy", time: "07:50" }], weekdays),
  trip("sh-bostanci-moda-0755", "07:55", "08:55", [{ name: "Karaköy", time: "08:45" }], weekdays),
  trip("sh-bostanci-moda-0850", "08:50", "10:00", [{ name: "Karaköy", time: "09:40" }], weekdays),
  trip("sh-bostanci-moda-0945", "09:45", "10:55", [{ name: "Moda", time: "10:15" }, { name: "Karaköy", time: "10:45" }], weekdays),
  trip("sh-bostanci-moda-1335", "13:35", "14:35", [{ name: "Moda", time: "14:05" }], weekdays),
  trip("sh-bostanci-moda-1605", "16:05", "17:20", [{ name: "Moda", time: "16:35" }, { name: "Karaköy", time: "17:05" }], weekdays),
  trip("sh-bostanci-moda-1930", "19:30", "20:30", [{ name: "Moda", time: "20:00" }], weekdays),
  trip("sh-bostanci-moda-we-1035", "10:35", "11:35", [{ name: "Moda", time: "11:05" }], weekends),
  trip("sh-bostanci-moda-we-1335", "13:35", "14:35", [{ name: "Moda", time: "14:05" }], weekends),
  trip("sh-bostanci-moda-we-1625", "16:25", "17:25", [{ name: "Moda", time: "16:55" }], weekends),
  trip("sh-bostanci-moda-we-1910", "19:10", "20:10", [{ name: "Moda", time: "19:40" }], weekends),
];

// Aynı vapur Moda ve bazı seferlerde Karaköy'e de yolcu indiriyor. Bu durakları
// ayrıca varış seçeneği yapıyoruz ki Bostancı'dan bu iskelelere giden yolcu hattı bulabilsin.
export const BOSTANCI_SEHIRHATLARI_SCHEDULES: RawOfficialTrip[] = BOSTANCI_TO_KABATAS.flatMap((service) => {
  const moda = service.stops?.find((stop) => stop.name === "Moda");
  const karakoy = service.stops?.find((stop) => stop.name === "Karaköy");
  const legs: RawOfficialTrip[] = [service];
  if (moda) {
    legs.push({
      ...service, id: `${service.id}-moda`, destination: "Moda", arrivalTime: moda.time,
      price: "Mesafe bazlı", stops: [],
    });
  }
  if (karakoy) {
    legs.push({
      ...service, id: `${service.id}-karakoy`, destination: "Karaköy", arrivalTime: karakoy.time,
      price: "Mesafe bazlı", stops: service.stops?.filter((stop) => stop.name === "Moda") ?? [],
    });
  }
  return legs;
});
