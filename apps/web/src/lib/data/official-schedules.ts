import rawSchedules from "./official-scraped-schedules.json";
import { generateSupplementarySchedules } from "./supplementary-schedules";
import { getMaviMarmaraSchedules } from "./mavi-marmara-schedules";
import { getDenturSchedules } from "./dentur-schedules";
import { getPrensTurSchedules } from "./prens-tur-schedules";
import { getTuryolSchedules } from "./turyol-schedules";
import { BOSTANCI_SEHIRHATLARI_SCHEDULES } from "./bostanci-sehirhatlari-schedules";
import type { DenturServiceWindow } from "@/lib/agents/dentur-scraper";

export interface RawStop {
  name: string;
  time: string;
}

export type FerryOperatorName = 
  | 'Şehir Hatları' 
  | 'İDO' 
  | 'Turyol' 
  | 'Mavi Marmara' 
  | 'Dentur Avrasya' 
  | 'Prens Tur';

export interface RawOfficialTrip {
  id: string;
  origin: string;
  destination: string;
  operator: FerryOperatorName;
  category?: 'ADALAR' | 'BOGAZ';

  departureTime: string;
  arrivalTime?: string;
  /**
   * Varış saatinin kaynağı. Resmî tarifede yoksa `arrivalTime` BOŞ kalır;
   * tahmini süre yalnızca `derivedArrivalTime` alanında taşınır.
   */
  arrivalSource?: "official" | "derived" | "unknown";
  /** Seyir süresi tahmininden üretilen varış (asla resmî varış yerine geçmez) */
  derivedArrivalTime?: string;
  /** Platform adı yalnızca kaynakta varsa doldurulur; yoksa boş bırakılır. */
  platform: string;
  platformSource?: "official" | "unknown";
  price: string;
  priceSource?: "official-operator" | "official-fare-table" | "unknown";
  stops?: RawStop[];
  isWeekendOnly?: boolean;
  isWeekdayOnly?: boolean;
  runsWeekday?: boolean;
  runsSaturday?: boolean;
  runsSunday?: boolean;

  /** Sadece 'Sürekli Sefer' pencereleri için (uydurma saat üretilmez) */
  isContinuous?: boolean;
  /** Sürekli sefer penceresinin bitiş saati (HH:mm) */
  continuousUntil?: string;
  /**
   * Resmî kaynakta YAZILI sıklık metni (örn. "10 dakikada bir").
   * Tek tek saat listesi değildir; yolcuya aynen gösterilir.
   */
  serviceFrequencyLabel?: string;
  /**
   * Resmî kaynakta yazılı özel servis pencereleri (yoğun saat ring, gece
   * sıklığı). Saat listesi değildir; olduğu gibi gösterilir.
   */
  serviceWindows?: DenturServiceWindow[];
  /** Hat tanımlayıcı (örn. Beşiktaş-Kadıköy) */
  lineName?: string;
  sourceUrl?: string;
  /** Ücret farklı bir resmî sayfadan doğrulandıysa o sayfanın adresi. */
  fareSourceUrl?: string;
  verifiedAt?: string;
}

/**
 * LİMAN BAŞKANLIĞI VE UKOME İZİNLİ TÜM OPERATÖRLER DOĞRULANMIŞ VERİ SETİ:
 * - Şehir Hatları : official-scraped-schedules.json (resmi portal dökümü).
 * - İDO           : İstanbul Adalar seferleri için güncel tarife doğrulanamadı; sefer eklenmez.
 * - Mavi Marmara  : mavimarmara.net resmi tarife sayfalarından doğrulanmış GERÇEK veri.
 * - Dentur Avrasya: denturavrasya.com hat sayfalarından canlı parse edilmiş veri.
 * - Prens Tur     : prenstur.net resmi 2026-2027 kış tarifesi afişinden çıkarılmış doğrulanmış veri.
 * - Turyol        : turyol.com iç arama motorundan canlı çekilmiş doğrulanmış veri.
 */
const baseTrips = (rawSchedules as unknown as RawOfficialTrip[]).filter(
  (trip) => !["sh-2026-1205", "sh-2026-1234", "sh-2026-1259"].includes(trip.id),
);
const supplementaryTrips = generateSupplementarySchedules();
const maviMarmaraTrips = getMaviMarmaraSchedules();
const denturTrips = getDenturSchedules();
const prensTurTrips = getPrensTurSchedules();
const turyolTrips = getTuryolSchedules();

export const OFFICIAL_SCHEDULES_DATA: RawOfficialTrip[] = [
  ...baseTrips,
  ...BOSTANCI_SEHIRHATLARI_SCHEDULES,
  ...supplementaryTrips,
  ...maviMarmaraTrips,
  ...denturTrips,
  ...prensTurTrips,
  ...turyolTrips,
];
