import { z } from "zod";

/**
 * Yolcuya gösterilen sefer kaydının TEK şeması (Zod).
 *
 * KURAL (AGENTS.md): `sourceUrl` ve `verifiedAt` olmadan bir kayıt "resmî"
 * sayılamaz. Şema kayıt-seviyesi alanları opsiyonel tutar; zorunluluk
 * `validate-data.mjs` içinde kaynak/snapshot seviyesinde uygulanır (henüz
 * kayıt-seviyesi damga bulunmayan veri setleri için uydurma tarih üretilmez).
 */

export const ARRIVAL_SOURCES = ["official", "derived", "unknown"] as const;
export const PLATFORM_SOURCES = ["official", "unknown"] as const;
export const PRICE_SOURCES = ["official-operator", "official-fare-table", "unknown"] as const;

export const rawStopSchema = z.object({
  name: z.string().min(1),
  time: z.string().regex(/^\d{2}:\d{2}$/, "durak saati HH:mm olmalı"),
});

export const rawOfficialTripSchema = z
  .object({
    id: z.string().min(1),
    origin: z.string().min(1),
    destination: z.string().min(1),
    operator: z.string().min(1),
    category: z.enum(["ADALAR", "BOGAZ"]).optional(),
    departureTime: z.string().regex(/^\d{2}:\d{2}$/, "kalkış saati HH:mm olmalı"),
    // "" = kaynakta varış yok (bilinmiyor). Dürüstlük kuralı gereği uydurulmaz;
    // tahmin varsa ayrı `derivedArrivalTime` alanında taşınır.
    arrivalTime: z.union([z.string().regex(/^\d{2}:\d{2}$/), z.literal("")]).optional(),
    derivedArrivalTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    arrivalSource: z.enum(ARRIVAL_SOURCES).optional(),
    platform: z.string(),
    platformSource: z.enum(PLATFORM_SOURCES).optional(),
    price: z.string(),
    priceSource: z.enum(PRICE_SOURCES).optional(),
    stops: z.array(rawStopSchema).optional(),
    isWeekendOnly: z.boolean().optional(),
    isWeekdayOnly: z.boolean().optional(),
    runsWeekday: z.boolean().optional(),
    runsSaturday: z.boolean().optional(),
    runsSunday: z.boolean().optional(),
    isContinuous: z.boolean().optional(),
    continuousUntil: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    lineName: z.string().optional(),
    sourceUrl: z.string().url().optional(),
    verifiedAt: z.string().optional(),
  })
  .refine((t) => t.origin.trim() !== t.destination.trim(), {
    message: "kalkış ve varış aynı olamaz",
    path: ["destination"],
  })
  .refine(
    (t) =>
      // Resmî varış varsa kaynağı "official" olmalı; yoksa official damgası taşıyamaz.
      !(t.arrivalSource === "official" && !t.arrivalTime),
    { message: "arrivalSource=official ise arrivalTime zorunlu", path: ["arrivalSource"] },
  );

export const tripRecordSchema = rawOfficialTripSchema;

export const announcementSchema = z.object({
  id: z.string().min(1),
  operator: z.string().min(1),
  title: z.string().min(1),
  sourceUrl: z.string().min(1),
  sourceVerified: z.boolean(),
  publishedAt: z.string().optional(),
});

export type TripRecord = z.infer<typeof tripRecordSchema>;
export type ValidatedAnnouncement = z.infer<typeof announcementSchema>;
