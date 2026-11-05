/**
 * Sefer veri modeli — tek kaynak (single source of truth).
 *
 * Bu tipler daha önce `app/page.tsx` ve `ScheduleCard.tsx` içinde tanımlıydı;
 * lib servislerinin sayfa/bileşen import etmesi dairesel bağımlılık riski
 * taşıdığı için merkezi tip modülüne taşındı.
 */

export type TripStatus =
  | "ON_TIME"
  | "DEPARTING_SOON"
  | "BOARDING"
  | "DELAYED"
  | "CANCELLED"
  | "IN_TRANSIT"
  | "ARRIVING"
  | "COMPLETED";

export interface ScheduleCardDto {
  id: string;
  origin: string;
  destination: string;
  operator: string;
  routeTitle: string;
  departureTime: string;
  departureTime12: string;
  status: TripStatus;
  targetTimeIso?: string;
  delayText?: string;
  vessel?: string;
  /** Kaynakta doğrulanmış platform; bilinmiyorsa boş string. */
  platform: string;
  platformSource?: "official" | "unknown";
  price: string;
  priceSource?: "official-operator" | "official-fare-table" | "unknown";
  progress: number;
  category?: 'ADALAR' | 'BOGAZ';
  stops?: { name: string; time: string }[];
  /** Yalnızca resmî tarifede yazan varış saati. */
  arrivalTime?: string;
  /** Seyir süresi tahmininden üretilen varış; arayüzde "~" ve "tahmini" ile gösterilir. */
  derivedArrivalTime?: string;
  arrivalSource?: "official" | "derived" | "unknown";

  /** Sürekli sefer penceresi ise start saati (HH:mm) */
  isContinuous?: boolean;
  /** Sürekli sefer pencere bitişi (HH:mm) */
  continuousUntil?: string;
  /** Hat adı */
  lineName?: string;

  /** Gün tipi uygunluk bayrakları (Hafta İçi / Cumartesi / Pazar-Tatil seçici için) */
  runsToday?: boolean;
  runsWeekday?: boolean;
  runsSaturday?: boolean;
  runsSunday?: boolean;

  /** Kaydın resmî kaynaktan son doğrulanma zamanı (ISO). Bilinmiyorsa yok. */
  verifiedAt?: string;
  /** Tazelik seviyesi; UNKNOWN = doğrulama tarihi yok (taze iddia edilmez). */
  freshnessLevel?: "FRESH" | "AGING" | "STALE" | "UNKNOWN";
}

/** Sefer listesinin veri kalitesi özeti (tazelik kapısı sonucu). */
export interface ScheduleDataQuality {
  /** Kapıya giren kayıt sayısı */
  totalCount: number;
  /** Yayımlanan kayıt sayısı */
  publishedCount: number;
  /** Doğrulama süresi dolduğu için gizlenen kayıt sayısı */
  expiredCount: number;
  /** Doğrulama tarihi bilinmeyen (gizlenmeyen) kayıt sayısı */
  undatedCount: number;
  /** Yayımlanan kayıtlar arasındaki en eski/en yeni doğrulama damgası */
  oldestVerifiedAt: string | null;
  newestVerifiedAt: string | null;
}

export interface SchedulesResponse {
  serverTimeIso: string;
  serverDateFormatted?: string;
  schedules: ScheduleCardDto[];
  dataQuality?: ScheduleDataQuality;
}
