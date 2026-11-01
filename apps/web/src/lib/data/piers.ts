/**
 * İstanbul iskeleleri — tek koordinat kaynağı.
 *
 * Boğaz, Haliç, Marmara ve Adalar hatlarındaki tüm aktif iskelelerin
 * doğrulanmış coğrafi koordinatları.
 */

export interface PierLocation {
  name: string;
  lat: number;
  lng: number;
  region: "Anadolu" | "Avrupa" | "Adalar";
}

export const ISTANBUL_PIERS: Record<string, PierLocation> = {
  "Kabataş": { name: "Kabataş", lat: 41.0347, lng: 28.9903, region: "Avrupa" },
  "Kadıköy": { name: "Kadıköy", lat: 40.9908, lng: 29.0225, region: "Anadolu" },
  "Eminönü": { name: "Eminönü", lat: 41.0186, lng: 28.9739, region: "Avrupa" },
  "Beşiktaş": { name: "Beşiktaş", lat: 41.0422, lng: 29.0067, region: "Avrupa" },
  "Üsküdar": { name: "Üsküdar", lat: 41.0267, lng: 29.0156, region: "Anadolu" },
  "Karaköy": { name: "Karaköy", lat: 41.0222, lng: 28.9772, region: "Avrupa" },
  "Yenikapı": { name: "Yenikapı", lat: 41.0028, lng: 28.9567, region: "Avrupa" },
  "Bakırköy": { name: "Bakırköy", lat: 40.9722, lng: 28.8753, region: "Avrupa" },
  "Bostancı": { name: "Bostancı", lat: 40.9525, lng: 29.0944, region: "Anadolu" },
  "Kartal": { name: "Kartal", lat: 40.8872, lng: 29.1864, region: "Anadolu" },
  "Maltepe": { name: "Maltepe", lat: 40.9231, lng: 29.1306, region: "Anadolu" },
  "Moda": { name: "Moda", lat: 40.9794, lng: 29.0242, region: "Anadolu" },
  "Ortaköy": { name: "Ortaköy", lat: 41.0475, lng: 29.0269, region: "Avrupa" },
  "Arnavutköy": { name: "Arnavutköy", lat: 41.0672, lng: 29.0439, region: "Avrupa" },
  "Bebek": { name: "Bebek", lat: 41.0769, lng: 29.0442, region: "Avrupa" },
  "Emirgan": { name: "Emirgan", lat: 41.1069, lng: 29.0561, region: "Avrupa" },
  "İstinye": { name: "İstinye", lat: 41.1136, lng: 29.0614, region: "Avrupa" },
  "Büyükdere": { name: "Büyükdere", lat: 41.1608, lng: 29.0461, region: "Avrupa" },
  "Sarıyer": { name: "Sarıyer", lat: 41.1685, lng: 29.0545, region: "Avrupa" },
  "Kuzguncuk": { name: "Kuzguncuk", lat: 41.0361, lng: 29.0294, region: "Anadolu" },
  "Çengelköy": { name: "Çengelköy", lat: 41.0505, lng: 29.0522, region: "Anadolu" },
  "Kandilli": { name: "Kandilli", lat: 41.0744, lng: 29.0581, region: "Anadolu" },
  "Anadoluhisarı": { name: "Anadoluhisarı", lat: 41.0831, lng: 29.0669, region: "Anadolu" },
  "Kanlıca": { name: "Kanlıca", lat: 41.1003, lng: 29.0653, region: "Anadolu" },
  "Çubuklu": { name: "Çubuklu", lat: 41.1081, lng: 29.0803, region: "Anadolu" },
  "Paşabahçe": { name: "Paşabahçe", lat: 41.1178, lng: 29.0919, region: "Anadolu" },
  "Beykoz": { name: "Beykoz", lat: 41.1311, lng: 29.0911, region: "Anadolu" },
  "Kınalıada": { name: "Kınalıada", lat: 40.9103, lng: 29.0522, region: "Adalar" },
  "Burgazada": { name: "Burgazada", lat: 40.8817, lng: 29.0700, region: "Adalar" },
  "Heybeliada": { name: "Heybeliada", lat: 40.8767, lng: 29.0992, region: "Adalar" },
  "Büyükada": { name: "Büyükada", lat: 40.8744, lng: 29.1283, region: "Adalar" },
  "Sedef Adası": { name: "Sedef Adası", lat: 40.8500, lng: 29.1417, region: "Adalar" }
};

/**
 * Kanonik iskele adı çözümlemesi.
 *
 * Sorun: Dentur gibi kaynaklar büyük harfli adlar getiriyordu (`HEYBELİADA`,
 * `KABATAŞ`, `SİRKECİ`); filtrede `Heybeliada`/`HEYBELİADA` çift giriş oluşuyordu.
 *
 * Kural: Bir ad, kanonik listeyle (istemese de diyakritik/büyük-küçük harf
 * farkıyla) eşleşirse KANONİK ada çevrilir. Eşleşme yoksa ad DEĞİŞTİRİLMEZ;
 * tahminle eşleme yapılmaz (uydurma yasak). Çağıran taraf gerekirse
 * `isKnownPier` ile kontrol eder.
 */
const STRIP_MAP: Record<string, string> = {
  ı: "i", İ: "i", ş: "s", Ş: "s", ğ: "g", Ğ: "g", ç: "c", Ç: "c",
  ö: "o", Ö: "o", ü: "u", Ü: "u", â: "a", Â: "a", î: "i", Î: "i", û: "u", Û: "u",
};

function pierKey(raw: string): string {
  return raw
    .trim()
    .toLocaleLowerCase("tr")
    .replace(/['’\s.]/g, "")
    .split("")
    .map((ch) => STRIP_MAP[ch] ?? ch)
    .join("");
}

const PIER_ALIAS_INDEX: Map<string, string> = (() => {
  const index = new Map<string, string>();
  for (const canonical of Object.keys(ISTANBUL_PIERS)) {
    index.set(pierKey(canonical), canonical);
  }
  // Bilinen kaynak yazımları (resmî/alternatif): yalnızca doğrulanmış eşlemeler.
  const extraAliases: Record<string, string> = {
    sirkeci: "Eminönü",
    "eminonu": "Eminönü",
    "besiktas": "Beşiktaş",
    "uskudar": "Üsküdar",
    "kadikoy": "Kadıköy",
    "karakoy": "Karaköy",
    "buyukada": "Büyükada",
    "heybeliada": "Heybeliada",
    "heybeli": "Heybeliada",
    "burgazada": "Burgazada",
    "burgaz": "Burgazada",
    "kinaliada": "Kınalıada",
    "kinali": "Kınalıada",
    "bostanci": "Bostancı",
    "kabatas": "Kabataş",
    "yenikapi": "Yenikapı",
    "bakirkoy": "Bakırköy",
    "sariyer": "Sarıyer",
    "ortakoy": "Ortaköy",
    "bebek": "Bebek",
    "emirgan": "Emirgan",
    "istinye": "İstinye",
    "buyukdere": "Büyükdere",
    "kuzguncuk": "Kuzguncuk",
    "cengelkoy": "Çengelköy",
    "kandilli": "Kandilli",
    "anadoluhisari": "Anadoluhisarı",
    "kanlica": "Kanlıca",
    "cubuklu": "Çubuklu",
    "pasabahce": "Paşabahçe",
    "beykoz": "Beykoz",
    "moda": "Moda",
    "maltepe": "Maltepe",
    "kartal": "Kartal",
    "sedefadasi": "Sedef Adası",
  };
  for (const [alias, canonical] of Object.entries(extraAliases)) {
    if (!index.has(alias)) index.set(alias, canonical);
  }
  return index;
})();

/** Ham iskele adını kanonik ada çevirir; bilinmiyorsa adı AYNEN döndürür. */
export function normalizePierName(raw: string | undefined | null): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  const direct = ISTANBUL_PIERS[trimmed];
  if (direct) return direct.name;
  const found = PIER_ALIAS_INDEX.get(pierKey(trimmed));
  return found ?? trimmed;
}

/** Ad, kanonik iskele listesinde biliniyor mu? (tahmin değil, yalnızca eşleşme) */
export function isKnownPier(raw: string | undefined | null): boolean {
  if (!raw) return false;
  const trimmed = raw.trim();
  return Boolean(ISTANBUL_PIERS[trimmed]) || PIER_ALIAS_INDEX.has(pierKey(trimmed));
}

export interface PierCoordinates {
  lat: number;
  lng: number;
  label: string;
}

/** Etiketli koordinat görünümü — ISTANBUL_PIERS'tan türetilir. */
export const PIER_GEO_COORDINATES: Record<string, PierCoordinates> = Object.fromEntries(
  Object.entries(ISTANBUL_PIERS).map(([name, p]) => [
    name,
    { lat: p.lat, lng: p.lng, label: `${name} İskelesi` }
  ])
);

/** İki nokta arası mesafe (km) — Haversine formülü. */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Verilen iskelenin Adalar bölgesinde (Büyükada, Heybeliada, Burgazada, Kınalıada, Sedef) olup olmadığını belirler.
 */
export function isIslandPier(pierName: string): boolean {
  if (!pierName) return false;
  const p = ISTANBUL_PIERS[pierName.trim()];
  if (p && p.region === "Adalar") return true;
  const norm = pierName.toLowerCase().replace(/['\s]/g, "");
  return (
    norm.includes("ada") ||
    norm.includes("buyukada") ||
    norm.includes("heybeli") ||
    norm.includes("burgaz") ||
    norm.includes("kinali") ||
    norm.includes("sedef")
  );
}

/**
 * Seferin en az bir ucunun (kalkış veya varış) Adalar olup olmadığını denetler.
 * Her iki uç da anakara ise (örn: Kadıköy → Kabataş), bu bir Ada seferi DEĞİLDİR (anakaradan anakarayadır).
 */
export function isIslandRoute(origin: string, destination: string): boolean {
  return isIslandPier(origin) || isIslandPier(destination);
}
