import { RawOfficialTrip } from "@/lib/data/official-schedules";
import { getOfficialRouteFare } from "@/lib/data/official-fares";
import { getSeaTaxiRoute } from "@/lib/data/sea-taxi";
import { MarineWeatherStatus } from "@/lib/services/marine-weather";

export interface SelfHealingAction {
  id: string;
  timestamp: string;
  targetType: "TRIP_ARRIVAL_TIME" | "PLATFORM_MAPPING" | "FARE_SYNC" | "WEATHER_DISRUPTION" | "OPERATOR_CRAWLER";
  description: string;
  beforeValue?: string;
  afterValue?: string;
  severity: "INFO" | "AUTO_HEALED" | "CRITICAL_RESOLVED";
}

// In-memory circular buffer for self-healing audit timeline.
// Başlangıçta UYDURMA geçmiş kaydı yoktur; yalnızca bu süreçte gerçekten
// işaretlenen kayıtlar birikir.
const SELF_HEALING_LOGS: SelfHealingAction[] = [];

export function logSelfHealingAction(action: Omit<SelfHealingAction, "id" | "timestamp">) {
  const newLog: SelfHealingAction = {
    ...action,
    id: `heal-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString()
  };
  SELF_HEALING_LOGS.unshift(newLog);
  if (SELF_HEALING_LOGS.length > 50) {
    SELF_HEALING_LOGS.pop();
  }
}

export function getSelfHealingTimeline(): SelfHealingAction[] {
  return [...SELF_HEALING_LOGS];
}

/**
 * Otomatik Seyir Süresi ve Varış Saati Hesaplayıcı
 * Kalkış saati ve iskeleler arası deniz miline göre gerçekçi varış saati (HH:mm) üretir.
 */
export function computeRealisticArrivalTime(origin: string, destination: string, departureTime: string): string {
  const [h, m] = departureTime.split(":").map(Number);
  const route = getSeaTaxiRoute(origin, destination);
  
  // Ortalama vapur seyir süresi: Deniz taksiden ~1.8x daha yavaş (10-12 knot vapur seyir hızı)
  // Boğaz içi hatları: min 15 dk, max 35 dk
  // Adalar hatları: min 35 dk, max 85 dk
  const isIsland = origin.includes("Ada") || destination.includes("Ada");
  let durationMins = Math.round(route.estimatedMinutes * 1.8);
  if (isIsland) {
    durationMins = Math.max(35, Math.min(85, durationMins));
  } else {
    durationMins = Math.max(15, Math.min(35, durationMins));
  }

  const totalMins = (h * 60 + m + durationMins) % 1440;
  const arrH = Math.floor(totalMins / 60);
  const arrM = totalMins % 60;
  return `${String(arrH).padStart(2, "0")}:${String(arrM).padStart(2, "0")}`;
}

/**
 * Her Sefer Kaydını Otomatik İnceleyen ve Anında Onaran Algoritma
 */
export function selfHealTripRecord(rawTrip: RawOfficialTrip): RawOfficialTrip {
  const healed: RawOfficialTrip = { ...rawTrip };
  const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

  // 1. Varış saati resmî kaynakta yoksa varışı EZMEYİZ. Tahmini süre ayrı
  // alanda tutulur ve arrivalSource="derived" ile işaretlenir; arayüz bunu
  // "~HH:mm (tahmini)" olarak gösterir. Resmî varış varsa olduğu gibi korunur.
  if (healed.arrivalTime && timeRegex.test(healed.arrivalTime)) {
    healed.arrivalSource = "official";
  } else {
    const missingBefore = healed.arrivalTime || "YOK";
    healed.arrivalTime = undefined;
    healed.derivedArrivalTime = computeRealisticArrivalTime(
      healed.origin,
      healed.destination,
      healed.departureTime,
    );
    healed.arrivalSource = "derived";
    logSelfHealingAction({
      targetType: "TRIP_ARRIVAL_TIME",
      description: `Sefer #${healed.id} (${healed.origin} -> ${healed.destination}) için resmî varış saati yok; yalnızca tahmini varış işaretlendi (resmî kabul edilmez).`,
      beforeValue: missingBefore,
      afterValue: `~${healed.derivedArrivalTime} (tahmini)`,
      severity: "INFO"
    });
  }

  // 2. Platform: kaynakta yoksa UYDURMA İSİM ÜRETİLMEZ; boş bırakılır.
  if (!healed.platform || healed.platform.trim() === "") {
    healed.platform = "";
    healed.platformSource = "unknown";
  } else {
    healed.platformSource = "official";
  }

  // 3. Fiyat bilgisi boşsa resmî UKOME tarife tablosundan doldurulur ve
  // kaynağı "official-fare-table" olarak işaretlenir.
  if (!healed.price || healed.price.trim() === "") {
    const fare = getOfficialRouteFare(healed.origin, healed.destination);
    healed.price = fare.fullFare;
    healed.priceSource = "official-fare-table";
  } else {
    healed.priceSource = "official-operator";
  }

  // 4. Ara duraklarda kalkış veya varış iskelesiyle aynı isimde olan mükerrerlikleri otonom temizle
  if (healed.stops && healed.stops.length > 0) {
    const originalLen = healed.stops.length;
    healed.stops = healed.stops.filter(
      st => st.name.trim() !== healed.origin.trim() && st.name.trim() !== healed.destination.trim()
    );
    if (healed.stops.length !== originalLen) {
      logSelfHealingAction({
        targetType: "OPERATOR_CRAWLER",
        description: `Sefer #${healed.id} (${healed.origin} -> ${healed.destination}) ara duraklarındaki kalkış/varış mükerrerliği otonom temizlendi.`,
        severity: "AUTO_HEALED"
      });
    }
  }

  return healed;
}

/**
 * Resmi Operatör İptal ve Hava Muhalefeti Eşitleyicisi
 * Gerçek lodos/fırtına durumunda seferleri anında CANCELLED olarak işaretler,
 * hava normalse keyfi iptalleri kaldırıp ON_TIME'a döndürür.
 */
export function evaluateRealTimeDisruptions(
  trip: RawOfficialTrip,
  weather?: MarineWeatherStatus
): { isCancelled: boolean; delayReason?: string } {
  if (!weather) return { isCancelled: false };

  // Fırtına kuralı: Rüzgar >= 28 knot (Beaufort 7) veya FOG < 1000m
  const isSevereStorm = weather.windSpeedKnots >= 28 || weather.alertType === "STORM_WARNING";
  const isIslandRoute = trip.origin.includes("Ada") || trip.destination.includes("Ada");

  // Küçük yolcu motorları açık Marmara'da fırtınada sefere çıkamaz
  if (isSevereStorm && isIslandRoute && (trip.operator === "Mavi Marmara" || trip.operator === "Prens Tur")) {
    return {
      isCancelled: true,
      delayReason: `Meteorolojik Uyarı: ${weather.windName} (${weather.windSpeedKnots} Knot) nedeniyle geçici askıya alındı.`
    };
  }

  // Yoğun Boğaz Sisi (< 800 metre görüş)
  if (weather.visibilityKm < 0.8 && weather.alertType === "FOG_WARNING") {
    return {
      isCancelled: true,
      delayReason: `Görüş Mesafesi Uyarısı: ${weather.visibilityKm} km yoğun sis nedeniyle Boğaz geçişi askıya alındı.`
    };
  }

  return { isCancelled: false };
}