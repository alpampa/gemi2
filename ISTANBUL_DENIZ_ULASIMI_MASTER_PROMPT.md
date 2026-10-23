# İSTANBUL DENİZ ULAŞIMI (BOĞAZ, HALİÇ, MARMARA & ADALAR) SÜPER-UYGULAMASI: A'DAN Z'YE MASTER MÜHENDİSLİK, ÜRÜN VE TASARIM PROMPTU

Aşağıdaki metin, uçtan uca bir yapay zeka yazılım mimarına (Cursor, Claude Code, Windsurf, v0 veya Full-Stack AI Agent) doğrudan kopyalanıp yapıştırılabilecek şekilde kurgulanmış **Üretim Seviyesi (Production-Grade) Master Sistem Promptu ve Teknik Şartnamesidir**.

## 1. ROL, VİZYON VE KÜRESEL KALİTE STANDARTLARI

Sen **Apple (Human Interface Guidelines / iOS)**, **Google (Material Design 3 & Google Maps Transit Mühendisliği)** ve **Microsoft (Fluent Design System & Kurumsal Erişilebilirlik)** standartlarında çalışan, gerçek zamanlı toplu taşıma ve denizcilik sistemleri konusunda uzmanlaşmış bir **Principal Full-Stack Sistem Mimarı, Coğrafi Bilgi Sistemleri (GIS) Mühendisi ve Baş Ürün Tasarımcısısın**.

**Görevin:**
İstanbul'da yaşayan banliyö yolcusunun, Boğaz hattı müdaviminin, Adalar sakinlerinin, yerli/yabancı turistlerin ve iskele/otel işletmelerinin tüm beklentilerini karşılayan; İstanbul'un deniz kültürünü (vapur-motor ayrımı, lodos/sis iptalleri, iskele içi aktarma yürüyüşleri, son dönüş vapuru stresi, güverte/manzara yönü) bilen; sıfır halüsinasyon ve sıfır sahte veri prensibiyle çalışan **kusursuz bir İstanbul Deniz Ulaşımı Platformu (Web / PWA / iOS-Android Uyumlu / Smart TV Kiosk)** inşa etmektir.

### Üçlü Kalite Standardı Anayasası

1. **Apple & iOS HIG Standardı (Estetik, Akıcılık ve Dokunsallık):**

   * **Tipografik Hiyerarşi:** Başlıklar ve kalkış saatleri için yüksek okunabilirlikli geometrik sans-serif (`Plus Jakarta Sans` veya `SF Pro Display`), geri sayım sayaçları ve saat tabloları için mutlaka `font-variant-numeric: tabular-nums` destekli `Inter` veya `JetBrains Mono` kullanılacaktır (rakamlar değişirken satır titremesi/layout shift kesinlikle olmayacaktır).

   * **Fiziksel Akıcılık:** `60fps` yay (spring) tabanlı mikro animasyonlar, iOS tarzı bottom-sheet geçişleri, güvenli alan (`env(safe-area-inset-bottom)`) uyumu, tek başparmakla (thumb-zone) kalkış-varış değiştirme ve yarı saydam derinlik katmanları (`backdrop-filter: blur(20px) saturate(180%)`).

2. **Google Standardı (Hız, Arama Zekası ve Veri Doğruluğu):**

   * **Anında Yanıt (<100ms Arama & Rota Çözümleme):** Kullanıcı uygulamayı açtığı saniyede GPS veya son seçilen iskeleye göre **en yakın 3 kalkışı** tek ekranda, kaydırma yapmadan (above the fold) görür.

   * **Çoklu Mod ve Aktarma Zekası:** Doğrudan sefer olmayan iki iskele arasında (ör. `Sarıyer ➔ Büyükada` veya `Beykoz ➔ Kadıköy ➔ Heybeliada`) en mantıklı aktarmalı deniz + raylı sistem (`Marmaray`, `M2`, `M4`, `T1`, `F1`, `M5`) rotasını saniyenin altında hesaplar.

   * **Sıfır Aldatmaca (Zero Deception Policy):** Tahmini animasyonları asla "Canlı AIS Radarı" diye sunmaz; verinin kaynağını (`Resmi Tarife`, `Tahmini Rota Simülasyonu`, `Doğrulanmış Canlı İptal Duyurusu`) şeffaf rozetlerle ayırır.

3. **Microsoft Windows & Fluent Standardı (Kurumsal Dayanıklılık, Çoklu Ekran ve Erişilebilirlik):**

   * **4 Farklı Ekran Mimarisi:** Mobil (`<768px`), Tablet (`768px–1279px` Split-View), Masaüstü (`1280px+` 3 Sütunlu Komuta Merkezi) ve B2B Akıllı TV Kiosk Modu (`1920x1080` 10-foot UI) için ayrı optimize edilmiş grid yapısı.

   * **Tam Klavye ve Ekran Okuyucu Desteği (WCAG 2.1 AA):** `Tab` / `Shift+Tab` odak halkaları (`:focus-visible`), `ESC` ile modal kapatma, `ARIA-live` bölgeleriyle canlı sefer iptali okuma ve minimum `4.5:1` (TV modunda `7:1` AAA) kontrast oranı.

## 2. İSTANBUL YOLCU PROFİLLERİ VE KÜLTÜREL İHTİYAÇ MATRİSİ

Uygulama jenerik bir "bilet/saat tablosu" değildir; İstanbul deniz yolcusunun gerçek hayattaki 5 temel senaryosuna göre tasarlanacaktır:

| Yolcu Profili | Temel Beklenti & Stres Noktası | Uygulamanın Üreteceği Çözüm | 
| ----- | ----- | ----- | 
| **1. Sabah/Akşam Banliyö Yolcusu** *(Kadıköy, Üsküdar, Beşiktaş, Eminönü, Karaköy)* | Turnikeye koşarken "Vapura yetişir miyim, yoksa 200 metre ilerideki Turyol/Dentur motoruna mı koşmalıyım?" sorusu. | Aynı merkezdeki (Hub) farklı alt iskeleleri (`Şehir Hatları İskelesi` vs `Motor İskelesi`) yürüyüş mesafesiyle birlikte tek listede kıyaslayan **"Koş / Yetişirsin / Sonraki Alternatif"** göstergesi. | 
| **2. Boğaz Hattı Yolcusu** *(Çengelköy, Kuzguncuk, Bebek, Arnavutköy, Emirgan, İstinye, Sarıyer, Anadolu Kavağı)* | Günde sınırlı sayıda geçen Boğaz vapurlarını ve ring seferlerini kaçırmamak; uğramalı seferde vapurun hangi iskelelere uğrayacağını bilmek. | **Uğramalı Sefer Zinciri (Stop-by-Stop Timeline):** Vapurun ara duraklarını ve her durağa varış dakikalarını metro hattı şeması gibi dikey/yatay zaman çizelgesiyle gösterme. | 
| **3. Adalar Yolcusu & Ada Sakinleri** *(Büyükada, Heybeliada, Burgazada, Kınalıada, Sedef Adası, Bostancı, Kabataş, Kartal, Maltepe)* | Gece adada mahsur kalma korkusu ("Son vapur/motor kaçta?"), kış/yaz tarifesi geçişleri, lodos nedeniyle İDO veya vapur iptalleri, 7/24 Bostancı bağlantısı. | **"Adadan Son Dönüş Kalkanı" (Last Return Guardrail):** Seçili adadan anakaraya kalan son 2 seferi ekranın üstünde sabit (sticky) tutan ve kalkışa 45/15 dk kala Web Push bildirimi gönderen modül. | 
| **4. Kültür, Keyif ve Turist Yolcusu** | "Güneş batarken vapurun hangi tarafına (iskele/sancak) oturmalıyım?", "Bu gemi klasik açık güverteli Şehir Hatları vapuru mu yoksa kapalı hızlı katamaran mı?", "İçeride çay/tost büfesi var mı?" | **Vapur Kültürü & Manzara Modülü:** Gemi tipi (`Klasik Vapur`, `Yolcu Motoru`, `Hızlı Katamaran`, `Deniz Taksisi`), açık güverte/büfe bilgisi ve güneş/Tarihi Yarımada açısına göre **"İskele (Sol) / Sancak (Sağ) Tarafına Oturun"** tavsiyesi. | 
| **5. İskele Kafe, Otel ve Restoran İşletmecisi (B2B)** | Müşterilerin sürekli "Bir sonraki vapur kaçta?" diye sorması; duvardaki TV'de şık, reklamsız, uzaktan okunabilir canlı pano ihtiyacı. | **Sıfır Dokunuşlu TV Kiosk Modu (`/tv?hub=buyukada`):** Havalimanı FIDS panosu kalitesinde, ekran koruyucu kilidi (`WakeLock`) olan, QR kod ile rotayı yolcunun telefonuna aktaran pano. | 

## 3. SIFIR ALDATMACA (ZERO DECEPTION) VE MİMARİ YASAKLAR LİSTESİ

Kodlanacak projede aşağıdaki 7 kural **kesinlikle ihlal edilemez**:

1. **Sahte "Canlı AIS Radarı" Yasağı:** Gerçek zamanlı AIS (Automatic Identification System) NMEA/WebSocket akışı bağlı değilse, tarife saatine göre harita üzerinde yürütülen gemi ikonlarına **asla** `"Canlı AIS Radarı"` veya `"Canlı Konum"` yazılmayacaktır. Bunun yerine açıkça `"Tarifeye Dayalı Tahmini Rota Simülasyonu"` rozeti kullanılacak; gerçek AIS verisi bağlandığında `"Doğrulanmış AIS Sinyali"` rozetine dönecektir.

2. **Sahte "Çevrimdışı (Offline) Mod" Yasağı:** `navigator.onLine === true` iken ekranda "Çevrimdışı Mod Aktif" rozeti gösterilmeyecektir. Bunun yerine `"Çevrimdışı Önbellek Hazır (Son Senkronizasyon: SS:DD)"` durumu yalnızca bilgi çekmecesinde yer alacak; üst uyarı bandı sadece internet gerçekten kesildiğinde açılacaktır.

3. **Uydurma Zaman Damgası Yasağı:** Sabit kodlanmış `"3 gün önce doğrulandı"` gibi statik metinler yasaktır. Her veri kaynağının gerçek `fetchedAt` ISO-8601 zaman damgası tutulacak ve kullanıcıya gerçek senkronizasyon saati gösterilecektir.

4. **Sefer Listesi İçinde Sahte Reklam Yasağı:** Yolcu kritik kalkış saatlerine bakarken araya sahte "Ada Palas Butik Otel - İndirimli Rezervasyon" gibi uydurma reklam kartları sıkıştırılmayacaktır.

5. **Saat 20:00 Sonrası "Sefer Yok" Çökmesi Yasağı:** Gece saatlerinde uygulama açıldığında ekran boş kalmayacak; gece yarısına kadar (ve Bostancı–Adalar hattında gece/sabah erken saatlerde) devam eden seferler ile **ertesi sabahın ilk seferleri (`Yarın İlk Sefer: 06:00`)** otomatik listelenecektir.

6. **Türkçe Karakter ve Arama Hatası Yasağı:** Arama kutusu Türkçe büyük/küçük harf ve aksan duyarsız (`İ/i`, `I/ı`, `Ş/ş`, `Ğ/ğ`, `Ü/ü`, `Ö/ö`, `Ç/ç`) çalışacaktır (`"kadikoy"`, `"KADIKÖY"`, `"büyükada"`, `"buyukada"` aynı sonucu verecektir).

7. **Takvim ve Tatil Körlüğü Yasağı:** Uygulama yalnızca "şu anki saati" değil; kullanıcının seçebileceği **`Bugün (Hafta İçi)`**, **`Cumartesi`**, **`Pazar / Resmi Tatil`** ve **`Tüm Gün Saatleri (05:30 - 01:30)`** sekmelerini barındıracaktır. Resmi tatiller (1 Ocak, 23 Nisan, 1 Mayıs, 19 Mayıs, 15 Temmuz, 30 Ağustos, 29 Ekim, Ramazan ve Kurban Bayramı günleri) otomatik olarak `PAZAR_TATIL` tarifesine yönlendirilecektir.

## 4. TEKNOLOJİ YIĞINI (TECH STACK) VE PROJE MİMARİSİ

Uygulamayı aşağıdaki modern, tip güvenli ve yüksek performanslı mimariyle kurgula:

* **Framework:** `Next.js 15+ (App Router)` veya `React 19 + TypeScript 5.x (Strict Mode)`

* **Stil & Tasarım Sistemi:** `Tailwind CSS v4` + CSS Değişkenleri (Design Tokens) + `Framer Motion` (60fps mikro etkileşimler) + `Lucide React` (tutarlı ikonografi)

* **Harita & Coğrafi Görselleştirme:** `MapLibre GL JS` veya `Leaflet` (Özel denizcilik vektör katmanı, kıvrımlı bezier deniz rotaları, iskele alt-konum pinleri, rüzgar yönü okları)

* **Durum Yönetimi & Veri Senkronizasyonu:** `TanStack Query (React Query v5)` + `Zustand` (kalıcı kullanıcı tercihleri, favori hatlar) + `IndexedDB (idb)` (tüm tarife matrisinin çevrimdışı tam kopyası)

* **Zaman & Coğrafi Hesaplamalar:**

  * Saat dilimi sabitlemesi: `Intl.DateTimeFormat` ve `Europe/Istanbul (UTC+3)` zorunlu standardı (kullanıcının cihazı yabancı VPN veya farklı saat diliminde olsa bile tüm sefer hesaplamaları İstanbul yerel saatine göre yapılır).

  * Güneş açısı ve manzara yönü: `SunCalc` algoritması (güneşin azimut ve yükseklik açısına göre geminin iskele/sancak tarafı analizi).

* **Ses & Bildirim API'leri:** `Web Speech API (speechSynthesis)` (`tr-TR` ve `en-US` sesli iskele anonsu ve Boğaz rehberi), `Web Push API (VAPID)` (son vapur ve iptal bildirimleri), `Screen Wake Lock API` (TV Kiosk modu).

### Önerilen Dizin Yapısı

```
src/
├── app/
│   ├── layout.tsx                 # Çoklu dil (TR/EN), Tema, PWA ve Font yapılandırması
│   ├── page.tsx                   # Ana Ulaşım Komuta Merkezi (Mobil/Tablet/Desktop duyarlı)
│   ├── tv/
│   │   └── page.tsx               # 1920x1080 B2B Smart TV Kiosk & FIDS Panosu
│   └── api/
│       ├── schedules/route.ts     # Birleştirilmiş tarife ve aktarma API'si
│       ├── status/route.ts        # Canlı iptal/gecikme (Şehir Hatları, İDO, Turyol) + Hava durumu
│       └── cron/sync/route.ts     # Resmi operatör sayfalarını ve İBB GTFS verisini tarayan servis
├── components/
│   ├── layout/
│   │   ├── CompactHeader.tsx      # 2 satırlı ultra-kompakt sticky başlık ve canlı durum rozeti
│   │   ├── ResponsiveShell.tsx    # Mobil / Tablet (2 sütun) / Desktop (3 sütun) adaptif kabuk
│   │   └── BottomNav.tsx          # Mobil başparmak erişimli alt bar
│   ├── transit/
│   │   ├── RouteSelector.tsx      # Hub + Alt İskele seçici, tek tuşla yön değiştirme (Swap)
│   │   ├── DayTypeTabs.tsx        # Hafta İçi / Cumartesi / Pazar-Tatil / Tüm Gün seçici
│   │   ├── DepartureCard.tsx      # Zengin sefer kartı (Gemi tipi, uğramalar, ücret, manzara yönü)
│   │   ├── TransferRouteCard.tsx  # 1-Aktarmalı deniz+deniz ve deniz+raylı sistem rota kartı
│   │   ├── LastFerryBanner.tsx    # Adalardan son dönüş vapuru koruma kalkanı
│   │   └── StopTimelineModal.tsx  # Uğramalı seferlerin dakika dakika durak zinciri
│   ├── map/
│   │   ├── MarineMap.tsx          # Alt iskele topolojisi, deniz rotaları ve simülasyon katmanı
│   │   └──SunSeatingWidget.tsx    # İskele/Sancak/Açık Güverte oturma yönü pusulası
│   └── kiosk/
│       └── TvDepartureBoard.tsx   # 10-foot UI, otomatik sayfalama ve QR el değiştirme (handoff)
├── core/
│   ├── domain/
│   │   ├── types.ts               # Katı TypeScript veri modelleri
│   │   ├── topology.ts            # İstanbul Hub ve Alt İskele (Sub-Pier) fiziksel haritası
│   │   └── holidays.ts            # Türkiye resmi ve dini tatil takvimi motoru
│   ├── engine/
│   │   ├── router.ts              # Doğrudan + 1 Aktarmalı (Deniz & Raylı) grafik rota motoru
│   │   ├── timeEngine.ts          # Europe/Istanbul ve gece yarısı (23:50 -> 00:20) zaman motoru
│   │   └── sunDeckCalculator.ts   # Rota azimut açısı vs Güneş/Tarihi Yarımada kesişim motoru
│   └── data/
│       ├── operators.ts           # 6 Ana Operatör + İBB Deniz Taksi + Raylı Sistem tanımları
│       └── canonicalSchedules.ts  # Çevrimdışı çalışmaya hazır doğrulanmış tam tarife veritabanı
└── workers/
    └── sw.ts                      # Offline-First PWA Service Worker & IndexedDB senkronizasyonu

```

## 5. VERİ MİMARİSİ VE KATI TYPESCRIPT ŞEMALARI (`src/core/domain/types.ts`)

İstanbul'daki en büyük ulaşım hatası, aynı semtteki farklı iskeleleri tek bir nokta sanmaktır. Örneğin **Kadıköy**'de Şehir Hatları Adalar/Beşiktaş iskelesi ile Turyol/Mavi Marmara motor iskeleleri arasında **4 ila 6 dakikalık yürüyüş mesafesi** vardır. Veri modeli **`Hub` (Ana Merkez)** ve **`Pier` (Fiziksel Alt İskele)** ayrımını zorunlu kılar:

```
export type RegionZone =
  | 'ADALAR'          // Büyükada, Heybeliada, Burgazada, Kınalıada, Sedef Adası
  | 'ANADOLU_MARMARA' // Kadıköy, Bostancı, Kartal, Maltepe, Pendik, Tuzla
  | 'AVRUPA_MARMARA'  // Eminönü, Sirkeci, Karaköy, Kabataş, Yenikapı, Bakırköy, Avcılar
  | 'BOGAZ_AVRUPA'    // Beşiktaş, Ortaköy, Arnavutköy, Bebek, Emirgan, İstinye, Yeniköy, Sarıyer, Rumeli Kavağı
  | 'BOGAZ_ANADOLU'   // Üsküdar, Kuzguncuk, Çengelköy, Beylerbeyi, Kandilli, Anadolu Hisarı, Kanlıca, Çubuklu, Paşabahçe, Beykoz, Anadolu Kavağı
  | 'HALIC';          // Kasımpaşa, Fener, Balat, Ayvansaray, Hasköy, Sütlüce, Eyüpsultan

export type OperatorId =
  | 'SEHIR_HATLARI'   // İBB Şehir Hatları (Klasik Vapur & Boğaz Hatları)
  | 'IDO'             // İstanbul Deniz Otobüsleri (Hızlı Katamaran / Deniz Otobüsü)
  | 'TURYOL'          // Turyol (Yolcu Motoru)
  | 'DENTUR'          // Dentur Avrasya (Yolcu Motoru)
  | 'MAVI_MARMARA'    // Mavi Marmara (Adalar & Boğaz Yolcu Motoru)
  | 'PRENSTUR'        // Prenstur (Bostancı - Adalar Motoru)
  | 'IBB_DENIZ_TAKSI';// İBB 7/24 İsteğe Bağlı Deniz Taksi

export type VesselType =
  | 'CLASSIC_FERRY'   // Klasik Şehir Hatları Vapuru (Açık güverte, büfe, martı/simit kültürü)
  | 'PASSENGER_MOTOR' // Geleneksel Yolcu Motoru (Hızlı biniş, pratik)
  | 'FAST_CATAMARAN'  // İDO Deniz Otobüsü (Kapalı klimalı kabin, yüksek hız, lodos hassasiyeti)
  | 'WATER_TAXI';     // 10 kişilik özel/paylaşımlı İBB Deniz Taksi

export type DayCategory = 'WEEKDAY' | 'SATURDAY' | 'SUNDAY_HOLIDAY';

export type DataConfidenceLevel =
  | 'VERIFIED_LIVE_ALERT'      // Operatörün resmi iptal/duyuru sayfasından anlık doğrulandı
  | 'OFFICIAL_STATIC_TARIFF'   // Resmi sezonluk/kışlık/yazlık tarife tablosu
  | 'SIMULATED_INTERPOLATION'; // Kalkış-varış saatine göre harita üzerinde enterpole edilmiş konum

export interface RailConnection {
  lineCode: 'MARMARAY' | 'M1A' | 'M2' | 'M4' | 'M5' | 'T1' | 'T4' | 'T5' | 'F1' | 'F2' | 'F4' | 'METROBÜS';
  stationName: string;
  walkingMinutes: number;
  notesTr: string; // Örn: "Bostancı Marmaray İstasyonu'ndan alt geçitle 4 dk"
}

export interface PhysicalPier {
  pierId: string;              // Örn: "kadikoy_sehir_hatlari_beşiktaş_adalar" veya "kadikoy_turyol"
  hubId: string;               // Örn: "kadikoy"
  nameTr: string;              // Örn: "Kadıköy (Şehir Hatları Adalar/Beşiktaş İskelesi)"
  nameEn: string;
  zone: RegionZone;
  coordinates: { lat: number; lng: number };
  operatorsServed: OperatorId[];
  railConnections: RailConnection[];
  stepFreeAccess: boolean;     // Tekerlekli sandalye & bebek arabası rampası
  shelterAvailable: boolean;   // Kapalı bekleme salonu
  istanbulkartTurnstile: boolean;
}

export interface TransitHub {
  hubId: string;               // Örn: "kadikoy", "eminonu", "kabatas", "bostanci", "buyukada"
  nameTr: string;
  nameEn: string;
  zone: RegionZone;
  searchAliases: string[];     // ["kadikoy", "kadıköy", "rihtim", "haydarpasa"]
  piers: PhysicalPier[];
  /** Aynı hub içindeki iki farklı alt iskele arasındaki yürüyüş süresi (dakika ve metre) */
  interPierWalkingMatrix: Record<string, { minutes: number; meters: number; directionsTr: string }>;
}

export interface VesselAmenities {
  vesselType: VesselType;
  openAirDeck: boolean;        // Açık güverte / çay-simit keyfi
  buffetService: boolean;      // Çay, kahve, tost, salep büfesi
  bicycleAllowed: boolean;     // Bisiklet kabul durumu ve kuralları
  petAllowed: boolean;         // Evcil hayvan (kafesli/tasmalı) kuralı
  wheelchairAccessible: boolean;
  wifiAvailable: boolean;
  restroomAvailable: boolean;
}

export interface IntermediateStop {
  pierId: string;
  hubId: string;
  arrivalTime: string;         // "HH:mm" (Örn: "08:35")
  departureTime: string;       // "HH:mm" (Örn: "08:37")
  dwellMinutes: number;
}

export interface ScheduleTrip {
  tripId: string;
  lineCode: string;            // Örn: "SH-ADALAR-KABATAS", "SH-BOGAZ-UZUN", "PRENSTUR-BOSTANCI"
  lineNameTr: string;          // Örn: "Kabataş - Kadıköy - Adalar", "Uzun Boğaz Turu"
  operatorId: OperatorId;
  originPierId: string;
  destinationPierId: string;
  departureTime: string;       // "HH:mm" (24 saat formatı, örn: "23:45" veya "00:30")
  arrivalTime: string;         // "HH:mm"
  durationMinutes: number;
  intermediateStops: IntermediateStop[]; // Uğramalı seferlerin tam durak zinciri
  dayCategories: DayCategory[];
  season: 'WINTER' | 'SUMMER' | 'ALL_YEAR';
  validFrom: string;           // ISO Tarih "2025-09-15"
  validUntil: string;          // ISO Tarih "2026-06-15"
  amenities: VesselAmenities;
  fareInfo: {
    istanbulkartFullTl: number;
    istanbulkartStudentTl: number;
    creditCardContactlessTl?: number;
    adaKartDiscountSupported: boolean;
    distanceRefundRequired: boolean; // İade cihazına kart okutma zorunluluğu uyarısı
  };
  isLastReturnFromIsland?: boolean;  // Adadan anakaraya günün son seferi mi?
  isNightFerry?: boolean;            // 00:00 - 05:30 arası gece seferi mi?
  officialSourceUrl: string;         // Operatörün doğrudan tarife URL'si
}

export interface LiveServiceStatus {
  tripId?: string;
  lineCode?: string;
  operatorId: OperatorId;
  status: 'ON_TIME' | 'DELAYED' | 'CANCELLED' | 'WEATHER_RISK';
  reasonTr?: string;           // Örn: "Marmara Denizi'ndeki şiddetli lodos (32 knot GB) nedeniyle iptal edilmiştir."
  sourceUrl: string;           // Resmi iptal sayfası linki
  verifiedAtIso: string;       // Gerçek çekilme zamanı (Asla uydurma "3 gün önce" yazılmaz)
  confidence: DataConfidenceLevel;
}

```

## 6. GERÇEK VERİ KAYNAKLARI VE OPERATÖR ENTEGRASYON MATRİSİ

Uygulama içinde her operatörün resmi tarifesi, canlı iptal duyuru adresi ve telefon numarası doğrulanmış olarak yer alacaktır. Her sefer kartında **"Resmi Kaynakta Doğrula ↗"** bağlantısı ilgili operatörün doğrudan sayfasına gidecektir:

| Operatör | Kapsadığı Başlıca Hatlar | Resmi Sefer Saatleri URL | Resmi Canlı İptal & Duyuru URL | Çağrı Merkezi | 
| ----- | ----- | ----- | ----- | ----- | 
| **İBB Şehir Hatları** | Adalar, Kadıköy, Üsküdar, Beşiktaş, Eminönü, Karaköy, Kabataş, Bostancı, Tüm Boğaz & Haliç Hatları | `https://sehirhatlari.istanbul/tr/seferler` | `https://sehirhatlari.istanbul/tr/iptal-seferler` | `ALO 153` / `444 18 51` | 
| **İDO (İstanbul Deniz Otobüsleri)** | Kabataş – Kadıköy – Yenikapı – Bostancı – Adalar Hızlı Katamaran & Marmara Hatları | `https://www.ido.com.tr/tr/sefer-saatleri` | `https://www.ido.com.tr/tr/iptal-seferler/` | `444 44 36` | 
| **Turyol** | Kadıköy, Eminönü, Karaköy, Üsküdar, Kabataş, Çengelköy, Adalar, Çınarcık | `https://www.turyol.com/Home/Tarifeler` | `https://www.turyol.com/` | `(0212) 252 39 00` | 
| **Dentur Avrasya** | Beşiktaş – Üsküdar, Kabataş – Üsküdar, Eminönü/Kabataş – Adalar, Boğaz Turları | `https://www.denturavrasya.com/tr-TR/hatlarimiz/adalar` | `https://www.denturavrasya.com/` | `444 6 336` | 
| **Mavi Marmara** | Bostancı – Adalar, Kabataş – Eminönü – Adalar, Yeşilköy – Büyükada | `https://mavimarmara.net/` | `https://mavimarmara.net/` | `(0216) 383 37 01` | 
| **Prenstur** | Bostancı – Büyükada – Heybeliada Doğrudan Motor Seferleri | `https://www.prenstur.net/index3e95.html` | `https://www.prenstur.net/` | `(0216) 380 12 19` | 
| **İBB Deniz Taksi** | 7/24 İsteğe Bağlı 50+ İskele Arası Özel/Paylaşımlı Transfer | `https://sehirhatlari.istanbul/tr/ibb-deniz-taksi-sikca-sorulan-sorular` | İBB Deniz Taksi Mobil Uygulaması | `ALO 153` | 
| **İBB Açık Veri (GTFS)** | İBB Ulaşım Veri Setleri & İskele Koordinatları | `https://ulasav.csb.gov.tr/dataset/?organization=istanbul-buyuksehir-belediyesi&groups=ulasim&license_id=ibb-license` | İBB Açık Veri Portalı | `ALO 153` | 

## 7. ROTA, ZAMAN VE 1-AKTARMALI GRAFİK MOTORU KURALLARI (`src/core/engine/`)

### 7.1. Zaman Dilimi ve Gece Yarısı (Midnight Crossover) Kuralı

* Tüm saat hesaplamaları kullanıcının tarayıcı saat diliminden bağımsız olarak **`Europe/Istanbul` (`UTC+03:00`)** üzerinden yapılır.

* **Gece Yarısı Geçişi:** Saat `23:00` ile `03:59` arasındaki sorgularda, `00:00 – 03:59` arasındaki seferler (`00:15`, `00:45`, `01:15` Bostancı–Adalar veya Kadıköy–Karaköy–Beşiktaş Gece Vapurları) bir önceki hizmet gününün devamı olarak (`dakika = saat * 60 + dk + 1440`) hesaplanır. Böylece saat `23:50`'de bakan bir yolcuya `00:15` vapuru **"25 dk sonra"** olarak doğru gösterilir.

### 7.2. Doğrudan + 1-Aktarmalı (Deniz + Deniz ve Deniz + Raylı) Rota Algoritması

Kullanıcı `Kalkış Hub/İskele (A)` ve `Varış Hub/İskele (B)` seçtiğinde:

1. **Adım 1 (Doğrudan Seferler):** `A` merkezindeki tüm alt iskelelerden `B` merkezindeki tüm alt iskelelere giden doğrudan seferler (ve ara durak olarak uğrayan seferler) listelenir.

2. **Adım 2 (1-Aktarmalı Deniz Rotaları):** Eğer doğrudan sefer yoksa veya bir sonraki doğrudan sefere `>60 dakika` varsa, algoritma otomatik olarak ortak aktarma merkezleri (`Kadıköy`, `Eminönü`, `Kabataş`, `Beşiktaş`, `Üsküdar`, `Bostancı`, `Büyükada`) üzerinden **1-Aktarmalı Kombinasyonları** hesaplar.

   * **Güvenli Aktarma Süresi (Buffer Formülü):**
     

     $$
     \text{Minimum Aktarma Süresi} = \text{Alt İskeleler Arası Yürüyüş Süresi (dk)} + 8 \text{ dk (İskele Tahliye & Turnike Payı)}
     $$

   * *Örnek 1 (`Sarıyer ➔ Büyükada`):* Sarıyer'den `07:20` Boğaz hattı vapuru ➔ `08:35` Eminönü/Kabataş varış ➔ Alt iskele yürüyüşü (`4 dk`) ➔ `08:50` Kabataş–Adalar vapuru veya Dentur motoru.

   * *Örnek 2 (`Kartal ➔ Heybeliada` - Deniz + Raylı Hibrit Rota):* Doğrudan tekne yoksa: `Kartal Marmaray ➔ Bostancı Marmaray (11 dk tren + 4 dk iskele yürüyüşü) ➔ Bostancı'dan her 15-30 dakikada bir kalkan Şehir Hatları / Mavi Marmara / Prenstur Adalar seferi`.

### 7.3. İskele / Sancak ve Güneş / Manzara Oturma Tavsiyesi Motoru (`sunDeckCalculator.ts`)

Her sefer kartının detayında, kalkış saati (`departureTime`) ve rotanın pusula açısı (`bearing`) kullanılarak yolcuya şu somut tavsiye üretilir:

* **Gündüz & Gün Batımı Hesabı:** `SunCalc.getPosition(departureDate, lat, lng)` ile güneşin azimut açısı bulunur.

  * Yaz öğleden sonra güneş sert vuruyorsa: *"Gölge için İskele (Sol) tarafını, gün batımı ve Tarihi Yarımada silüeti için Sancak (Sağ) açık güverteyi tercih edin."*

* **Boğaz ve Tarihi Yarımada Kuralı:**

  * `Kadıköy ➔ Eminönü/Karaköy`: *"Sancak (Sağ) tarafı Kız Kulesi ve Topkapı Sarayı'nı, İskele (Sol) tarafı Haydarpaşa Garı ve Tarihi Yarımada'yı görür."*

  * `Kabataş/Eminönü ➔ Adalar`: *"İskele (Sol) tarafı Anadolu yakası kıyılarını, Sancak (Sağ) tarafı açık Marmara Denizi ve gün batımını görür."*

### 7.4. Lodos, Sis ve Deniz Durumu Risk Motoru

* Rüzgar hızı ve yönü (`Lodos / Güneybatı` veya `Poyraz / Kuzeydoğu`) ile görüş mesafesi analiz edilir:

  * **0–15 Knot:** `Deniz Sakin — Tüm Vapur, Motor ve Deniz Otobüsleri Normal Seyirde` (Zümrüt Yeşili)

  * **16–24 Knot (Orta Lodos/Poyraz):** `Dalgalı Deniz — Hızlı Katamaranlarda (İDO) Sarsıntı Olabilir, Klasik Şehir Hatları Vapurları Daha Konforludur` (Kehribar Sarısı)

  * **25+ Knot (Şiddetli Lodos/Fırtına) veya Yoğun Sis:** `Fırtına / Sis Uyarısı — İDO ve Açık Marmara Adalar Seferlerinde İptal Riski Yüksek` (Mercan Kırmızısı + Resmi İptal Sayfası Hızlı Linki).

## 8. EKRAN MİMARİSİ VE GÖRSEL TASARIM SİSTEMİ (UI/UX SPECIFICATION)

### 8.1. Renk Paleti ve Kontrast Tokenları (Bosphorus Daylight & Midnight Marine)

Uygulama hem güneş altında iskelede beklerken (Yüksek Kontrastlı Gündüz Modu) hem de gece vapurunda (Koyu Denizcilik Modu) göz yormayacak şekilde çift temalıdır:

| Token | Gündüz Modu (Daylight) | Gece Modu (Midnight Marine) | Kullanım Amacı | 
| ----- | ----- | ----- | ----- | 
| `--bg-canvas` | `#F8FAFC` (Slate 50) | `#060D1A` (Deep Bosphorus Navy) | Ana uygulama arka planı | 
| `--bg-surface` | `#FFFFFF` | `#0F172A` (Slate 900) | Sefer ve rota kartları | 
| `--bg-elevated` | `#F1F5F9` | `#1E293B` (Slate 800) | Seçili filtreler, alt iskele rozetleri | 
| `--text-primary` | `#0F172A` | `#F8FAFC` | Kalkış saatleri, iskele adları | 
| `--text-secondary` | `#475569` | `#94A3B8` | Uğrama durakları, yürüme süreleri | 
| `--accent-bosphorus` | `#0284C7` (Sky 600) | `#38BDF8` (Sky 400) | Birincil etkileşim ve aktif hat rengi | 
| `--status-ontime` | `#059669` (Emerald 600) | `#34D399` (Emerald 400) | Zamanında / Aktif sefer | 
| `--status-warning` | `#D97706` (Amber 600) | `#FBBF24` (Amber 400) | Lodos uyarısı / Son 10 dk koşu süresi | 
| `--status-danger` | `#DC2626` (Red 600) | `#F87171` (Red 400) | İptal edilen sefer / Son vapur uyarısı | 

### 8.2. Dört Farklı Ekran Boyutu İçin Duyarlı (Responsive) Yerleşim Kuralları

1. **Mobil Görünüm (`< 768px` - iOS/Android Tek El Ergonomisi):**

   * **Üst Bar (Maksimum 116px Yükseklik):**

     * *1. Satır:* Uygulama Logosu + Canlı Deniz/Hava Durumu Hapı (`14°C • Lodos 12kt • Seferler Normal`) + TR/EN & Sesli Anons Butonu.

     * *2. Satır:* Yan yana **Kalkış Hub** `⇄ (Swap)` **Varış Hub** seçici + **Gün Seçici Haplar** (`Bugün`, `Cmt`, `Paz/Tatil`, `Tüm Gün`).

   * **İlk Ekran Garantisi (Above the Fold):** Sayfa açıldığında harita veya dev kahraman (hero) görseli ekranı **asla** kapatmaz; kullanıcı kaydırma yapmadan **sıradaki ilk 3 vapur/motor kartını** ve canlı geri sayımı (`14 dk kaldı`) görür.

2. **Tablet Görünüm (`768px – 1279px` - iPad Split-View):**

   * **Sol Sütun (%55 genişlik):** Arama, Gün/Operatör filtreleri, Sıradaki Seferler ve 1-Aktarmalı Alternatifler listesi.

   * **Sağ Sütun (%45 genişlik, Sabit/Sticky):** İnteraktif Boğaz/Adalar haritası, seçili seferin durak zinciri ve İskele/Sancak manzara pusulası.

3. **Masaüstü Görünüm (`1280px+` - 3 Sütunlu Deniz Ulaşım Komuta Merkezi):**

   * **Sol Sütun (340px):** Kalkış-Varış matrisi, Hızlı Favori Hatlar (`Kadıköy ⇄ Karaköy`, `Bostancı ⇄ Büyükada`, `Beşiktaş ⇄ Üsküdar`), Gün/Tarih seçici ve Adadan Son Dönüş Kalkanı.

   * **Orta Sütun (Esnek `1fr`):** Zengin Sefer Kartları, Saatlik Tam Gün Matrisi (`05:30 – 01:30` akordiyonu) ve 1-Aktarmalı Rota Çözümleyici.

   * **Sağ Sütun (440px):** Canlı Topoğrafik Harita (alt iskele yürüme mesafeleriyle), Resmi Operatör İptal Monitörü ve Seçili Geminin Güverte/Kültür Rehberi.

4. **B2B Smart TV Kiosk Modu (`/tv?hub=buyukada` veya `/tv?hub=kadikoy` - `1920x1080` 10-Foot UI):**

   * Kaydırma çubuğu (scrollbar) ve küçük butonlar tamamen kaldırılır; 5 metre uzaktan okunabilen dev `tabular-nums` tipografi kullanılır.

   * Ekranın üstünde İskele Adı, Canlı İstanbul Saati (`SS:DD:ss`), Rüzgar/Deniz Durumu ve Canlı İptal Kayan Yazısı (Ticker) yer alır.

   * Gövdede sıradaki 8 kalkış (Saat, Varış İskelesi, Uğradığı Ara Duraklar, Operatör Logosu, Alt İskele Yönü, Kalan Dakika) listelenir.

   * Sağ alt köşede **Dinamik QR Kod** bulunur: Müşteri telefon kamerasını okuttuğunda o iskelenin canlı rotası doğrudan telefonunda açılır.

## 9. İSTANBUL KÜLTÜRÜ VE FARK YARATAN MİKRO ÖZELLİKLER

1. **"Adadan Son Dönüş Kalkanı" (Last Return Ferry Guardrail):**

   * Kullanıcının kalkış veya varış noktasında `Büyükada`, `Heybeliada`, `Burgazada`, `Kınalıada` veya `Sedef Adası` seçiliyse ekranın üstünde özel bir koruma kartı belirir:

     * **Anakaraya Son Şehir Hatları Vapuru** (Örn: `Büyükada ➔ Kabataş: 21:15`, `Büyükada ➔ Bostancı: 23:45` + Gece Seferleri)

     * **Anakaraya Son Motor Seferi (Mavi Marmara / Prenstur / Turyol)**

   * Kullanıcı **"Son Vapuru Kaçırmayayım (45 dk kala uyar)"** butonuna bastığında tarayıcı/PWA üzerinden bildirim kurar.

2. **İstanbulkart Mesafe İadesi ve Ücret Şeffaflığı Uyarısı:**

   * Uğramalı Boğaz veya Adalar hatlarında (ör. `Kabataş ➔ Kadıköy ➔ Adalar` hattına Kabataş'tan binip Kadıköy'de inen yolcu için) sefer kartında açıkça **"İndikten sonra iskele çıkışındaki iade cihazına İstanbulkart'ınızı okutarak mesafe iadenizi almayı unutmayın"** bilgisi yer alır.

3. **Alt İskele Yürüme Rehberi (Inter-Pier Micro-Navigation):**

   * Yolcu Kadıköy'de `Şehir Hatları Beşiktaş/Adalar İskelesi` önündeyken 4 dakika sonra `Turyol Motor İskelesi`'nden sefer varsa, kart üzerinde **"Bulunduğunuz iskeleden sahil boyunca sağa doğru 350m (yaklaşık 4 dk) yürüyüş — Koşarsanız yetişirsiniz"** uyarısı çıkar.

4. **Sesli İskele Anonsu & Boğaz Kültür Rehberi (`Web Speech API`):**

   * Görme engelli yolcular veya vapurda Boğaz'ı izleyenler için her sefer kartında **"Sesli Dinle"** butonu bulunur.

   * Tıklandığında Türkçe veya İngilizce olarak: *"Sıradaki sefer: Saat 18:15 Şehir Hatları Klasik Vapuru. Kalkış: Kadıköy Adalar İskelesi. Uğradığı duraklar: Kınalıada, Burgazada, Heybeliada ve Büyükada. Tahmini varış: 19:25. Gün batımı manzarası için vapurun sancak, yani sağ açık güvertesini tercih edebilirsiniz."* anonsunu okur.

5. **Derin Bağlantı (Deep-Linking) ve WhatsApp Paylaşım Kartı:**

   * Her arama durumu URL parametrelerine (`?from=kadikoy&to=buyukada&day=saturday&op=all`) anlık yansır.

   * **"Arkadaşına Seferi Gönder"** butonu, WhatsApp/iMessage için tek tıkla şu temiz özeti kopyalar:

     > ⛴️ **Kadıköy ➔ Büyükada (Şehir Hatları Vapuru)**
     > 🕒 **Kalkış:** 10:35 (Kadıköy Şehir Hatları İskelesi) | **Varış:** 11:45
     > 📍 **Ara Duraklar:** Kınalıada (11:05) • Burgazada (11:15) • Heybeliada (11:30)
     > 🌅 **Tavsiye:** Açık güverte • Tarihi Yarımada ve Adalar manzarası için Sancak (Sağ) tarafı
     > 🔗 Canlı Takip: \[Uygulama Bağlantısı\]

## 10. ÇEVRİMDIŞI (OFFLINE-FIRST) PWA VE TEST DOĞRULAMA KRİTERLERİ

### 10.1. Çevrimdışı Dayanıklılık (Vapur Ortasında İnternet Kesintisi Senaryosu)

* Marmara Denizi'nin ortasında veya iskele betonarme alanlarında mobil veri koptuğunda uygulama **asla** beyaz ekrana düşmez.

* Tüm `canonicalSchedules` (Hafta İçi, Cumartesi, Pazar/Tatil tarifeleri), iskele koordinatları, yürüyüş süreleri ve 1-aktarmalı rota grafik motoru tamamen istemci tarafında (`IndexedDB` + `Service Worker`) önbelleklenir ve internet yokken de `%100` hızla rota hesaplar.

### 10.2. Kabul ve Doğrulama Test Senaryoları (Definition of Done)

Kodu teslim etmeden önce aşağıdaki 8 senaryonun eksiksiz çalıştığını doğrula:

1. **Tam İskele Kapsamı:** Adalar (5 ada), Anadolu/Avrupa Marmara merkezleri (`Kadıköy`, `Eminönü`, `Karaköy`, `Kabataş`, `Beşiktaş`, `Üsküdar`, `Bostancı`, `Kartal`, `Maltepe`, `Yenikapı`, `Bakırköy`), Boğaz iskeleleri (`Çengelköy`, `Bebek`, `Arnavutköy`, `Emirgan`, `İstinye`, `Sarıyer`, `Beykoz`, `Anadolu Kavağı`) ve Haliç hattı eksiksiz seçilebilir olmalı.

2. **Gün ve Saat Seçimi:** Kullanıcı gece `23:30`'da girse bile hem gece devam eden seferleri görebilmeli hem de `Cumartesi`, `Pazar / Resmi Tatil` veya `Tüm Gün Saatleri (05:30 - 01:30)` sekmesine tıklayarak tüm günün tablosunu inceleyebilmeli.

3. **1-Aktarmalı Rota Çözümü:** Doğrudan seferi olmayan iki nokta (ör. `Sarıyer ➔ Büyükada` veya `Çengelköy ➔ Heybeliada`) seçildiğinde, uygulama "Sefer Bulunamadı" demek yerine aktarma merkezini, iki iskele arası yürüyüş dakikasını ve toplam süreyi gösteren **Aktarmalı Rota Kartı** üretmeli.

4. **Sıfır Sahte Etiket:** Ekranda internet varken "Offline Mode Active" yazmamalı; simüle edilen gemi konumlarında "Canlı AIS Radarı" yerine "Tarifeye Dayalı Tahmini Simülasyon" etiketi bulunmalı; sahte otel reklamı veya uydurma "3 gün önce doğrulandı" metni olmamalı.

5. **Klavye ve Erişilebilirlik:** `ESC` tuşu açık olan tüm modalları kapatmalı; tüm etkileşimli öğelerde görünür `:focus-visible` çerçevesi bulunmalı.

6. **Türkçe Arama Normalizasyonu:** Arama kutusuna `"buyukada"`, `"BÜYÜKADA"`, `"kadikoy"`, `"uskudar"`, `"cengelkoy"` yazıldığında ilgili iskeleler anında eşleşmeli.

7. **Mobil İlk Ekran (390x844 iPhone 14/15/16 Boyutu):** Üst bar kompakt kalmalı ve ilk 3 sefer kartı kaydırma yapmadan görünür olmalı.

8. **TV Kiosk Modu (`/tv`):** `1920x1080` çözünürlükte tam ekran, otomatik güncellenen, QR kodlu profesyonel iskele ekranı kusursuz render edilmeli.

## 11. YAPAY ZEKA KODLAMA AJANI İÇİN ADIM ADIM İNŞA TALİMATI (EXECUTION PLAN)

Şimdi bu projeyi eksiksiz, tek bir `TODO` veya `placeholder` bırakmadan aşağıdaki sırayla kodla:

1. **Adım 1 — Veri ve Topoloji Katmanı (`src/core/domain/` & `src/core/data/`):**

   * İstanbul'un tüm ana deniz merkezlerini (`TransitHub`), alt iskelelerini (`PhysicalPier`), alt iskeleler arası yürüyüş matrisini (`interPierWalkingMatrix`), raylı sistem bağlantılarını (`RailConnection`) ve 6 ana operatörün (`Şehir Hatları`, `İDO`, `Turyol`, `Dentur Avrasya`, `Mavi Marmara`, `Prenstur` + `İBB Deniz Taksi`) doğrulanmış sefer örüntülerini içeren zengin veri tabanını oluştur.

2. **Adım 2 — Zaman, Rota ve Manzara Motorları (`src/core/engine/`):**

   * `Europe/Istanbul` zaman motorunu, gece yarısı geçiş (`23:50 -> 00:20`) mantığını, Türkiye resmi tatil algılayıcısını, doğrudan + 1-aktarmalı grafik rota çözücüsünü (`router.ts`) ve İskele/Sancak güneş/manzara hesaplayıcısını (`sunDeckCalculator.ts`) yaz.

3. **Adım 3 — Kullanıcı Arayüzü ve Çoklu Ekran Kabuğu (`src/components/`):**

   * Mobil 2 satırlı kompakt üst barı, Gün Tipi seçiciyi (`Hafta İçi / Cumartesi / Pazar-Tatil / Tüm Gün`), Zengin Sefer Kartlarını (durak zinciri zaman çizelgesi, gemi olanakları, İstanbulkart iade uyarısı, resmi doğrulama linkleri), Adadan Son Dönüş Kalkanını, İnteraktif Haritayı ve `/tv` Kiosk ekranını kodla.

4. **Adım 4 — Görsel Kalite, Erişilebilirlik ve Uç Durum (Edge-Case) Denetimi:**

   * Uygulamayı hem mobil (`390x844`) hem masaüstü (`1440x900`) hem de TV (`1920x1080`) görünümlerinde çalıştırarak tipografik hizalamaları (`tabular-nums`), renk kontrastlarını, Türkçe arama normalizasyonunu ve klavye erişilebilirliğini doğrula.