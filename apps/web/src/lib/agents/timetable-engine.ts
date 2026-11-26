import { OFFICIAL_SCHEDULES_DATA, RawOfficialTrip } from '../data/official-schedules';
import type { ScheduleCardDto, SchedulesResponse, TripStatus } from '@/lib/types/schedule';
import { getOfficialRouteFare } from '@/lib/data/official-fares';
import { selfHealTripRecord } from '@/lib/agents/self-healing-engine';
import { checkTurkishHoliday } from '@/lib/utils/holiday-calendar';
import { getIstanbulParts, istanbulIsoFor, compareHhmm, nightRolloverDayOffset } from '@/lib/utils/istanbul-time';
import { normalizePierName } from '@/lib/data/piers';
import { resolveTripFreshness } from '@/lib/utils/data-freshness';

/**
 * Returns current Istanbul time components (UTC+3)
 */
export function getIstanbulTime(nowMs: number = Date.now()) {
  const now = new Date(nowMs);

  // Tek kaynak: `getIstanbulParts`. Burada ayrı bir Intl formatter tutmak
  // `hour12: false` → `h24` hatasını kopyalıyordu; gece yarısı saat 24
  // okunduğunda gün türü (hafta içi/Cumartesi/Pazar) yanlış hesaplanabilirdi.
  const parts = getIstanbulParts(nowMs);
  const year = parts.year;
  const month = parts.month;
  const day = parts.day;
  const hour = parts.hour;
  const minute = parts.minute;

  // Day of week in Istanbul (0 = Sun, 1 = Mon, ..., 6 = Sat)
  const dayOfWeek = parts.dayOfWeek;
  const isSaturday = dayOfWeek === 6;
  const isSunday = dayOfWeek === 0;
  const isWeekend = isSaturday || isSunday;

  // Formatted date in Turkish
  const dateFormatter = new Intl.DateTimeFormat('tr-TR', {
    timeZone: 'Europe/Istanbul',
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  const holiday = checkTurkishHoliday(year, month, day);
  const isHoliday = holiday.isHoliday;

  return {
    year,
    month,
    day,
    hour,
    minute,
    isSaturday,
    isSunday,
    isWeekend,
    isHoliday,
    holidayName: holiday.name,
    serverTimeIso: now.toISOString(),
    serverDateFormatted: dateFormatter.format(now)
  };
}

function checkTripRunsOnDay(
  trip: RawOfficialTrip,
  ist: { isSunday: boolean; isHoliday: boolean; isSaturday: boolean }
): {
  runsToday: boolean;
  runsWeekday: boolean;
  runsSaturday: boolean;
  runsSunday: boolean;
} {
  const runsWeekday = trip.runsWeekday !== undefined ? trip.runsWeekday : !trip.isWeekendOnly;
  const runsSaturday = trip.runsSaturday !== undefined ? trip.runsSaturday : !trip.isWeekdayOnly;
  const runsSunday = trip.runsSunday !== undefined ? trip.runsSunday : !trip.isWeekdayOnly;

  let runsToday: boolean;
  if (ist.isSunday || ist.isHoliday) {
    runsToday = runsSunday;
  } else if (ist.isSaturday) {
    runsToday = runsSaturday;
  } else {
    runsToday = runsWeekday;
  }

  return { runsToday, runsWeekday, runsSaturday, runsSunday };
}

/**
 * Builds schedule DTOs for the current day and tags day-type availability
 * so users can also inspect Weekday / Saturday / Sunday-Holiday timetables.
 */
export async function getLiveOrOfficialSchedules(options?: {
  /**
   * Değerlendirme anı (ms). Varsayılan `Date.now()` üretim davranışıdır.
   * Saat enjekte edilebilir olduğunda tazelik kapısı takvimden bağımsız
   * doğrulanabilir (aksi halde "FRESH" iddiası 2 gün sonra kendiliğinden
   * "AGING" olur ve test zamanla kırılır).
   */
  nowMs?: number;
}): Promise<SchedulesResponse> {
  const nowMs = options?.nowMs ?? Date.now();
  const ist = getIstanbulTime(nowMs);
  const yearStr = ist.year;
  const monthStr = String(ist.month).padStart(2, '0');
  const dayStr = String(ist.day).padStart(2, '0');

  // 1. Sanitize: veri kaynağındaki bozuk kayıtları temizle
  //   - departureTime "HH:mm" formatında değilse kayıt atlanır
  //   - origin/destination placeholder metin taşıyorsa atlanır (örn: "Sadece Hafta İçi...")
  //   - varış < kalkış ve kalkış 17:00'den önceyse veri hatasıdır: resmî varış
  //     temizlenir; selfHealTripRecord yalnızca "tahmini" alanı işaretler.
  //     17:00 sonrası kalkışta bu gece yarısını aşan gerçek seferdir, korunur.
  const sanitizedTrips: RawOfficialTrip[] = OFFICIAL_SCHEDULES_DATA
    .filter(trip => /^\d{2}:\d{2}$/.test(trip.departureTime))
    .filter(trip =>
      !trip.origin.includes('...') && !trip.destination.includes('...')
      && !trip.origin.includes('Sadece') && !trip.destination.includes('Sadece')
      // SIFIR HATA: Kalkış ve varış noktası aynı olan (örn: Büyükada -> Büyükada) geçersiz seferler elenir
      && trip.origin.trim() !== trip.destination.trim()
    )
    .map(trip => {
      // Ara durak temizliği: stops içinde kalkış veya varış iskelesiyle aynı isimde olanlar temizlenir
      // İSKELE ADI NORMALİZASYONU (tek ingest noktası): kaynaklar büyük harfli
      // ad getirse bile (HEYBELİADA / KABATAŞ / SİRKECİ) filtrede tek kanonik
      // ada çevrilir. Bilinmeyen ad AYNEN korunur; tahminle eşleme yapılmaz.
      const canonOrigin = normalizePierName(trip.origin);
      const canonDestination = normalizePierName(trip.destination);
      const cleanedStops = trip.stops
        ?.map((st) => ({ ...st, name: normalizePierName(st.name) }))
        .filter(
          st => st.name.trim() !== canonOrigin.trim() && st.name.trim() !== canonDestination.trim()
        );
      const depHour = parseInt(trip.departureTime.slice(0, 2), 10);
      const hasBadArrival =
        !!trip.arrivalTime &&
        /^\d{2}:\d{2}$/.test(trip.arrivalTime) &&
        compareHhmm(trip.arrivalTime, trip.departureTime) < 0 &&
        depHour < 17;
      return {
        ...(hasBadArrival ? { ...trip, arrivalTime: undefined } : trip),
        origin: canonOrigin,
        destination: canonDestination,
        stops: cleanedStops && cleanedStops.length > 0 ? cleanedStops : undefined
      };
    });

  // 2. Harita: ham resmî seferleri gün tipi bayraklarıyla tam DTO'ya çevir.
  // TAZELİK KAPISI (AGENTS.md): doğrulama süresi SCHEDULE_EXPIRY_DAYS'i aşan
  // kayıt yayımlanmaz. Tarihi BİLİNMEYEN kayıt gizlenmez (kanıtsız silme
  // yapılmaz); "UNKNOWN" olarak işaretlenir ve kullanıcıya tarihi yok denir.
  const assessedTrips = sanitizedTrips.map((trip) => ({
    trip,
    freshness: resolveTripFreshness(trip.verifiedAt, nowMs),
  }));
  const publishedTrips = assessedTrips.filter((x) => !x.freshness.isExpired);
  const expiredCount = assessedTrips.length - publishedTrips.length;

  const schedules: ScheduleCardDto[] = publishedTrips.map(({ trip: rawTrip, freshness }) => {
    const dayFlags = checkTripRunsOnDay(rawTrip, ist);
    const trip = selfHealTripRecord(rawTrip);
    const [hh, mm] = trip.departureTime.split(':');

    // ÜCRET KURALI: Şehir Hatları seferleri resmi İBB/ŞH tarife tablosundan
    // (rota + gece penceresi duyarlı) fiyatlanır; diğer operatörlerde (Turyol,
    // Mavi Marmara, Dentur, Prens Tur) operatörün kendi doğrulanmış fiyatı esastır.
    const officialFare = getOfficialRouteFare(trip.origin, trip.destination, trip.departureTime);
    const operatorPrice = trip.price && trip.price.trim() !== "" ? trip.price : undefined;
    const resolvedPrice = trip.operator === "Şehir Hatları"
      ? officialFare.fullFare
      : (operatorPrice ?? officialFare.fullFare);
    const priceSource: "official-operator" | "official-fare-table" =
      trip.operator !== "Şehir Hatları" && operatorPrice
        ? "official-operator"
        : "official-fare-table";

    // Gece seferi (00:00-04:59 kalkış) akşam saatlerinde (20:00+) görüntülenirken
    // kalkış yarına taşınır: 23:50'de 00:15 seferi "GİTTİ" değil "yaklaşan" olur.
    // Kural tek kaynaktır: nightRolloverDayOffset (istanbul-time).
    const targetIso =
      istanbulIsoFor(trip.departureTime, nowMs, nightRolloverDayOffset(trip.departureTime, nowMs) === 1) ??
      `${yearStr}-${monthStr}-${dayStr}T${hh}:${mm}:00+03:00`;
    const targetTimeMs = new Date(targetIso).getTime();
    const diff = targetTimeMs - nowMs;

    let status: TripStatus = 'ON_TIME';
    let progress = 0;
    const delayText: string | undefined = undefined;

    if (diff < -15 * 60000) {
      status = 'COMPLETED';
      progress = 100;
    } else if (diff <= 0) {
      status = 'IN_TRANSIT';
      progress = 50;
    } else if (diff <= 10 * 60000) {
      status = 'BOARDING';
      progress = 15;
    } else if (diff <= 30 * 60000) {
      status = 'DEPARTING_SOON';
      progress = 5;
    } else {
      status = 'ON_TIME';
      progress = 0;
    }

    // 12-hour formatted time for display
    const hNum = parseInt(hh, 10);
    const mNum = parseInt(mm, 10);
    const isPm = hNum >= 12;
    const h12 = hNum % 12 === 0 ? 12 : hNum % 12;
    const dep12 = `${h12}:${String(mNum).padStart(2, '0')} ${isPm ? 'PM' : 'AM'}`;

    return {
      id: trip.id,
      origin: trip.origin,
      destination: trip.destination,
      operator: trip.operator,
      routeTitle: `${trip.origin} - ${trip.destination} Hattı`,
      departureTime: trip.departureTime,
      departureTime12: dep12,
      status,
      delayText,
      targetTimeIso: targetIso,
      platform: trip.platform ?? "",
      platformSource: trip.platformSource ?? (trip.platform ? "official" : "unknown"),
      price: resolvedPrice,
      priceSource,
      progress,
      category: trip.category || (trip.destination.includes('ada') || trip.origin.includes('ada') || trip.destination === 'Büyükada' || trip.origin === 'Büyükada' ? 'ADALAR' : 'BOGAZ'),
      stops: trip.stops && trip.stops.length > 0 ? trip.stops : undefined,
      arrivalTime: trip.arrivalTime,
      derivedArrivalTime: trip.derivedArrivalTime,
      arrivalSource: trip.arrivalSource ?? (trip.arrivalTime ? "official" : "unknown"),
      isContinuous: trip.isContinuous || undefined,
      continuousUntil: trip.continuousUntil,
      lineName: trip.lineName,
      runsToday: dayFlags.runsToday,
      runsWeekday: dayFlags.runsWeekday,
      runsSaturday: dayFlags.runsSaturday,
      runsSunday: dayFlags.runsSunday,
      verifiedAt: freshness.verifiedAt ?? undefined,
      freshnessLevel: freshness.level,
    };
  });

  // 3. Sort chronologically by resolved target time
  // (gece yarısı yarına taşınan seferler 23:xx'den sonra sıralanır)
  schedules.sort((a, b) =>
    (a.targetTimeIso ?? a.departureTime).localeCompare(b.targetTimeIso ?? b.departureTime)
  );

  const dated = publishedTrips
    .map((x) => x.freshness.verifiedAt)
    .filter((v): v is string => Boolean(v))
    .sort();
  const oldestVerifiedAt = dated[0] ?? null;
  const newestVerifiedAt = dated[dated.length - 1] ?? null;

  return {
    serverTimeIso: ist.serverTimeIso,
    serverDateFormatted: ist.serverDateFormatted,
    schedules,
    dataQuality: {
      totalCount: assessedTrips.length,
      publishedCount: schedules.length,
      expiredCount,
      undatedCount: publishedTrips.filter((x) => x.freshness.level === "UNKNOWN").length,
      oldestVerifiedAt,
      newestVerifiedAt,
    },
  };
}
