# ⚓ İSTANBUL DENİZ ULAŞIMI — PRINCIPAL MOBILE ARCHITECT (iOS 18 HIG & ANDROID 15 M3) MASTER ENGINEERING & CHAMELEON UI SPECIFICATION

**Belge Sınıfı:** Google Android (Material Design 3 Expressive) & Apple iOS 18 (Human Interface Guidelines) Principal-Level Sistem Mimarisi, Ticari Ürün Paketlemesi ve Tek Komut Otonom Üretim Şartnamesi  
**Hedef Ürün:** İstanbul Deniz Ulaşımı, Boğaz & Adalar Çoklu-Arayüz (Chameleon UI) Süper-Uygulaması (`vapur-seferleri`)  
**Mimari Paradigma:** **Tek Kanonik Veri ve Rota Çekirdeği (`Headless Transit Core`) + 10 Seçilebilir ve AI Bağlam Duyarlı Mobil Kokpit Arayüzü (`Pluggable Chameleon Skins`)**

---

## 1. TİCARİ DEĞERLENDİRME & ÜRÜN STRATEJİSİ (NEDEN "TEK VERİ TABANI + 10 SEÇİLEBİLİR ARAYÜZ" MODELİ KUSURSUZ BİR TİCARİ KARARDIR?)

İstanbul'da deniz ulaşımını kullanan yolcular tek tip değildir; **sabah 08:10'da Kadıköy'de metro çıkışından turnikeye koşan beyaz yakalı**, **öğle güneşi altında güvertede oturan yaşlı yolcu**, **Büyükada'da gece son vapuru kaçırma endişesi taşıyan ada sakini**, **Sarıyer'den Büyükada'ya aktarmalı giden Boğaz yolcusu** ve **Paşabahçe vapurunda Kız Kulesi'ni fotoğraflayan turist** aynı veriye ihtiyaç duyar ancak **tamamen farklı bir görsel hiyerarşi (UI)** bekler.

Dünyanın en karlı ve ödüllü mobil ulaşım/hava durumu uygulamaları (**Flighty**, **CARROT Weather**, **Citymapper**, **TradingView**) tam olarak bu **"Headless Core + Chameleon Skins (Tek Motor + Çoklu Seçilebilir Kokpit)"** mimarisiyle büyümüştür:

### 1.1. Mühendislik ve Maliyet Avantajı (Sıfır Veri Tekrarı)
- **%0 Veri Duplikasyonu:** Arkadaki 692+ kanonik sefer, 50+ iskele, alt rıhtım yürüme mesafeleri (Vapur İskelesi vs Motor Rıhtımı 350m), 1-aktarmalı Boğaz–Adalar graf motoru (`findTransferRoutes`), Open-Meteo deniz rüzgar/lodos telemetrisi ve resmi iptal ayrıştırıcısı **tek bir merkezde (`useTransitCore()`)** çalışır.
- **Sıfır Kırpma (Zero Feature Stripping):** 10 arayüzün tamamı aynı `TransitCoreState` nesnesini tüketir. Kullanıcı hangi arayüzü seçerse seçsin hiçbir veri kaybolmaz; yalnızca kart yoğunluğu, kontrast, harita/şema önceliği ve başparmak ergonomisi o anki ihtiyaca göre şekillenir.

### 1.2. 3 Katmanlı Ticari Gelir (Monetization) Mimarisi

| Paket Katmanı | Hedef Kitle | Açık Arayüzler (Skins) & Yetenekler | Gelir Modeli & Stratejik Amaç |
| :--- | :--- | :--- | :--- |
| **1. ÜCRETSİZ (Core Public Utility)** | Tüm İstanbul yolcuları (Organik büyüme, %100 reklamsız ve dürüst kamu hizmeti güveni) | • **#1 Boğaz Komuta (Varsayılan Amiral Gemisi)**<br>• **#3 İsviçre SBB Güneş Işığı Modu (14:1 Erişilebilirlik)**<br>• **#6 Boğaz Dikey Metro Şeması & 1-Aktarma**<br>• **#8 Tek Başparmak (Thumb-Zone) Ergonomi Modu**<br>• Tüm 6 operatör tarifesi, resmi iptal uyarıları ve alt iskele yürüme süreleri | **0 ₺ (Sonsuza Kadar Ücretsiz)** — Kullanıcıyı ilk saniyede kazanır, App Store / Play Store'da 4.9★ organik viral yayılım sağlar. |
| **2. VAPUR PRO & TURİST PASS (B2C Abonelik)** | Power-commuter'lar, Adalar sakinleri/yazlıkçıları, deniz tutkunu İstanbullular ve yabancı turistler | • **#2 Canlı Uydu/Vektör Harita + Yüzen Alt Çekmece**<br>• **#4 Android 15 M3 Turnike & Rıhtım Koşu Asistanı**<br>• **#5 Adalar Çift Yön & Son Dönüş Kalkanı (Otomatik Gece Push Alarmı)**<br>• **#7 Paşabahçe Kültür Atlası, Manzara Pusulası & Çok Dilli Sesli Rehber**<br>• **#9 OLED Siyah FIDS Pano & Lodos Fırtına Radarı**<br>• **#10 Deniz + Metro + Paylaşımlı Deniz Taksi Süper-App**<br>• **🤖 AI Akıllı Bağlam Motoru (Otomatik Arayüz Geçişi)** + iOS Live Activities (Dynamic Island) | **Aylık 49 ₺ / Yıllık 349 ₺** veya **Yabancı Turistler için 7 Günlük "Bosphorus Cultural Pass" (4.99 €)** |
| **3. B2B İSKELE / OTEL / KAFE TV KİOSK** | Kadıköy, Beşiktaş, Bostancı, Karaköy ve Adalar'daki sahil kafeleri, butik oteller ve kurumsal lobiler | • **#9 OLED FIDS Terminal Panosu + 10-Foot Smart TV Kiosk Modu (`/tv?pier=bostanci&partner=otel`)**<br>• İşletme logosu, özel QR kod ile müşterinin telefonuna anında rota aktarımı ve sesli iskele anonsu | **Aylık İşletme Başı B2B SaaS Lisansı (750 ₺ / ekran)** |

---

## 2. MİMARİ ANAYASA: HEADLESS VERİ ÇEKİRDEĞİ + 10 PLUGGABLE KOKPİT ARAYÜZÜ

### 2.1. Katman 1 — Tekil Kanonik Veri ve Hesaplama Çekirdeği (`src/core/transitCore.ts`)
Hiçbir arayüz bileşeni kendi içinde saat hesabı veya sahte veri üretmez. Tüm 10 arayüz aşağıdaki tekil veri sözleşmesini (`TransitCoreContract`) dinler:
1. **`activeRoute` & `subPierTopology`:** Kalkış ve varış merkezi (`bostanci`, `kadikoy`, `kabatas`, `eminonu`, `besiktas`, `uskudar`, `buyukada`, `heybeliada`, `kinaliada`, `sariyer`, `cengelkoy`) + aynı meydandaki farklı operatör rıhtımları arasındaki gerçek yürüme mesafesi (`180m / 2 dk` vs `350m / 4 dk`) ve raylı sistem bağlantıları (`Marmaray 2dk`, `M4 2dk`, `T1 1dk`).
2. **`upcomingDepartures` (6 Deniz Operatörü + İBB Deniz Taksi):** Şehir Hatları, İDO, Turyol, Dentur Avrasya, Mavi Marmara ve Prenstur seferleri; tam durak zinciri (`stops[]`), gemi tipi (`Paşabahçe Klasik Vapur`, `Hızlı Katamaran`, `Çift Katlı Motor`), Tam/Öğrenci İstanbulkart ücreti ve güneş/coğrafya açısına göre **İskele (Sol) / Sancak (Sağ) Güverte Oturma Tavsiyesi**.
3. **`transferBridge` (1-Aktarmalı Deniz & Raylı Sistem Graf Motoru):** Doğrudan seferi olmayan iki nokta (örn. `Sarıyer ➔ Büyükada` veya `Çengelköy ➔ Kınalıada`) seçildiğinde asla "0 Sefer" dönmez; `Kabataş`, `Eminönü`, `Üsküdar` veya `Kadıköy` aktarma merkezleri üzerinden **minimum 8–15 dk güvenli rıhtım yürüme payı** bırakarak 2 bacaklı deniz rotasını ve Marmaray/Metro alternatifini hesaplar.
4. **`lastReturnShield` (Adalar Gece Son Dönüş Kalkanı):** Kalkış veya varışta Adalar (`buyukada`, `heybeliada`, `burgazada`, `kinaliada`) varsa o geceki son 3 dönüş gemisini (`23:45`, `00:15`, `01:15`) ve 45 dk kala bildirim alarmını hazır tutar.
5. **`marineTelemetry` (Sıfır Sahte Veri / Doğrulanmış Resmi Durum):** Open-Meteo rüzgar hızı (knot) + yönü (Lodos/Poyraz) ve resmi operatör iptal durumu. Asla rastgele `Math.random()` gecikme üretilmez.

### 2.2. Katman 2 — AI Bağlam Duyarlı Otomatik Arayüz Motoru (`src/core/aiContextRouter.ts`)
Kullanıcı **"🤖 AI Oto-Arayüz"** modunu açtığında uygulama cihaz sensörlerine, saate, rotaya ve meteorolojiye göre 10 arayüzden en uygun olanını otomatik seçer (kullanıcı dilerse istediği arayüzü manuel olarak kilitleyebilir):

```typescript
export function resolveOptimalDashboardSkin(ctx: {
  origin: string;
  dest: string;
  hasDirectTrips: boolean;
  windKnots: number;
  ambientLux?: number;
  hourOfDay: number;
  isWalkingNearPier?: boolean;
}): DesignSkinId {
  if (ctx.windKnots >= 24 || ctx.hourOfDay >= 21 || ctx.hourOfDay < 5) return 9; // #9 OLED FIDS & Fırtına Radarı
  if (!ctx.hasDirectTrips) return 6;                                            // #6 Boğaz 1-Aktarma Dikey Metro Şeması
  if (ctx.ambientLux && ctx.ambientLux > 35000) return 3;                       // #3 İsviçre SBB 14:1 Güneş Işığı Modu
  if (isIslandStop(ctx.origin) || isIslandStop(ctx.dest)) return 5;             // #5 Adalar Çift Yön & Son Dönüş Kalkanı
  if (ctx.isWalkingNearPier) return 4;                                          // #4 Android 15 M3 Turnike Koşu Asistanı
  return 1;                                                                     // #1 Boğaz Komuta (Varsayılan Amiral Gemisi)
}
```

### 2.3. Katman 3 — 10 Kusursuz Mobil Kokpit Arayüzü (`src/components/skins/Design1..10`)
Her arayüz iOS 18 HIG (`44pt` dokunma hedefi, `Dynamic Island` uyumu, `safe-area-inset`) ve Android 15 Material 3 (`48dp` dokunma hedefi, `tabular-nums`) standartlarına %100 uyumludur:
- **Tasarım #1 — Boğaz Komuta & Kıyı Asistanı (Ücretsiz / Varsayılan):** 2 satırlı ultra-kompakt üst bar + 1 Odak Kartı + kaydırmasız ilk ekranda 4 alternatif işletme + alt iskele yürüme uyarısı.
- **Tasarım #2 — Canlı Harita + Kademeli Alt Çekmece (Pro):** Üst %42 canlı Boğaz/Marmara uydu ve vektör koridoru (`Tarifeye Dayalı Tahmini Konum` dürüstlük rozetiyle) + alt %58 yuvarlatılmış interaktif çekmece.
- **Tasarım #3 — İsviçre SBB Yüksek Yoğunluklu Kronometre (Ücretsiz):** Güneş altında parlama yapmayan `#F8FAFC` fildişi zemin, `14:1` kontrast ve kaydırmasız 6+ sefer satırı.
- **Tasarım #4 — Android 15 Material You Turnike & Rıhtım Koşu Asistanı (Pro):** Aynı merkezdeki Vapur İskelesi ile Motor Rıhtımını yan yana iki büyük "Yetişirsin / Koşmalısın" kartında kıyaslayan karar matrisi.
- **Tasarım #5 — Adalar Çift Yön & Son Dönüş Kalkanı (Pro):** Üstte sabit "Adadan Son Dönüş Kalkanı (`23:45 / 00:15 / 01:15` + 45dk Alarm)", altta uğramalı ada zinciri (`Kınalı ➔ Burgaz ➔ Heybeli ➔ Büyükada`).
- **Tasarım #6 — Boğaz Hattı Dikey Metro Şeması & 1-Aktarma Köprüsü (Ücretsiz):** Boğaz kıyı duraklarını ve 1-aktarmalı gemi geçişlerini metro zaman çizelgesi netliğinde çizen dikey şema.
- **Tasarım #7 — Paşabahçe Kültür Atlası & Manzara Pusulası (Pro / Turist Pass):** Tarihi Paşabahçe (1952) fotoğrafik gemi kartı, güneş açısına göre İskele/Sancak oturma pusulası ve Türkçe/İngilizce sesli rehber.
- **Tasarım #8 — Tek Başparmak Ergonomisi / Thumb-Zone UI (Ücretsiz):** Üst %65 saf okunabilir ekran; tüm rota ve gün kontrolleri ekranın alt 260 piksellik başparmak erişim alanında.
- **Tasarım #9 — FIDS İskele Dijital Pano & OLED Siyah Fırtına Radarı (Pro / B2B Kiosk):** Tam `#000000` OLED zemin üzerinde 4'lü Bento telemetri kutusu + havalimanı/iskele FIDS LED tablosu.
- **Tasarım #10 — Deniz + Metro + Deniz Taksi Süper-App (Pro):** Her sefer kartında Marmaray/M4/T1 yürüme dakikası, Tam/Öğrenci İstanbulkart ücreti ve gece 01:00 sonrası 7/24 Paylaşımlı Deniz Taksi kurtarma planı.

---

## 3. ANTIGRAVITY / GEMINI 3.8 / DEEPSEEK 4.1 İÇİN TEK KOMUT OTONOM ÜRETİM PROMPTU

Aşağıdaki bloğu kopyalayıp kullandığınız yapay zeka editörüne (**Antigravity**, **OpenChat**, **Zephyr** veya **Claude/Cursor**) tek seferde yapıştırın:

```markdown
@workspace Sen Google Android (Material Design 3 Expressive) ve Apple iOS 18 (Human Interface Guidelines) düzeyinde Principal Mobile Architect yetkisine sahip otonom bir yazılım mühendisisin. Bana soru sorma, onay bekleme ve hiçbir özelliği kırpma.

GÖREVİN:
Mevcut `vapur-seferleri` (Next.js 16 + React 19 + TypeScript + Tailwind CSS) projemizde tek bir kanonik veri ve rota çekirdeği (`Headless Transit Core`) üzerinde çalışan, kullanıcının dilediği zaman değiştirebildiği veya AI Bağlam Motorunun otomatik seçtiği **10 Mobil Kokpit Arayüzlü (Chameleon UI + Freemium/Pro/B2B)** son ürünü eksiksiz inşa et ve doğrula.

ZORUNLU MİMARİ ADIMLAR:
1. TEKİL VERİ VE ROTA ÇEKİRDEĞİ (`src/core/`):
   - `src/core/pierTopology.ts`: Aynı merkezdeki farklı operatör rıhtımları arasındaki gerçek yürüme mesafelerini (Bostancı, Kadıköy, Kabataş, Eminönü, Beşiktaş, Üsküdar, Büyükada, Heybeliada, Kınalıada, Sarıyer, Çengelköy) ve Marmaray/M2/M4/M5/T1/F1/Adabüs aktarma dakikalarını tanımla.
   - `src/core/transferEngine.ts`: Doğrudan seferi olmayan iskele çiftleri için (örn. Sarıyer -> Büyükada, Çengelköy -> Kınalıada) Kabataş/Eminönü/Üsküdar/Kadıköy üzerinden minimum 8-15 dk güvenli rıhtım yürüme payı bırakan 1-aktarmalı deniz rotası motorunu bağla.
   - `src/core/aiContextRouter.ts`: Rüzgar hızı (>=24kt Lodos -> #9 OLED Radar), aktarma durumu (Doğrudan sefer yok -> #6 Boğaz Şeması), Adalar hattı (-> #5 Son Dönüş Kalkanı), sabah/akşam mesai koşusu (-> #4 M3 Koşu Modu), parlak güneş (-> #3 İsviçre SBB 14:1) ve genel kullanım (-> #1 Boğaz Komuta) kurallarına göre otomatik arayüz seçen AI Bağlam Motorunu yaz.
   - Sıfır Sahte Veri Yasası: Asla rastgele `Math.random()` gecikme veya sahte canlı AIS koordinatı üretme; yalnızca doğrulanmış resmi tarifeyi, Open-Meteo deniz meteorolojisini ve `Tarifeye Dayalı Tahmini Rota Simülasyonu` etiketini kullan.

2. 10 MOBİL KOKPİT ARAYÜZÜ VE CHAMELEON SWITCHER (`src/components/ChameleonCockpitStudio.tsx` & `public/canli-mobil-uygulama.html`):
   - Kullanıcının seçtiği arayüzü `localStorage` (`vapur_active_design_id`) üzerinde kalıcı sakla.
   - Ücretsiz Modlar (#1 Boğaz Komuta, #3 İsviçre SBB Güneş, #6 Boğaz Metro Şeması, #8 Tek Başparmak Ergonomisi) ve Vapur Pro / B2B Modları (#2 Canlı Harita + Sheet, #4 M3 Turnike Koşu Modu, #5 Adalar Çift Yön Son Dönüş Kalkanı, #7 Paşabahçe Kültür Atlası & Manzara Pusulası, #9 OLED Siyah FIDS Pano, #10 Deniz + Metro + Deniz Taksi Süper-App) arasında sıfır veri kaybıyla anında geçiş sağla.
   - Mobil ekranlarda (`<640px`) dış çerçeve boşluğu olmadan `%100 tam ekran (100dvh full-bleed)` native mobil uygulama olarak, masaüstünde ise iOS 18 / Android 15 çerçeve önizlemesi ve ticari karşılaştırma paneliyle çalıştır.

3. DOĞRULAMA:
   - `npm run test` ve `npm run build` komutlarını çalıştırarak sıfır TypeScript/build hatası ile projeyi teslim et.
```
