# Veri senkronizasyonu ve doğrulama tablosu

Bu belge, yolcu verisinin hangi kaynaktan, hangi sıklıkla kontrol edildiğini ve
hata durumunda ne yapılacağını belgeler (kök `AGENTS.md` veri doğruluğu kuralı).
Zamanlar TR = UTC+3 sabitidir.

## Zamanlama (tek tablo)

| Tetik | Kaynak | Zaman (UTC) | Zaman (TR) | Ne yapar |
| --- | --- | --- | --- | --- |
| Gecelik tarife + duyuru senkronu | `.github/workflows/nightly-tariff-sync.yml` | `0 20 * * *` | 23:00 | Dentur.tarife çekimi, duyuru snapshot üretimi (görüntüden) |
| Gecelik canlı tarama | `apps/web/vercel.json` → `/api/cron/scan-announcements` | `5 21 * * *` | 00:05 | Çok-firmalı canlı iptal taraması (`getLiveScan({ force: true })`) |
| İzleme turu (monitor) | `/api/cron/monitor` uç noktası | Otomatik zamanlama YOK | — | Çağrıldığında `runMonitorTick` çalıştırır |

Kod içi yorumlarda artık kullanılmayan `0 22 * * *` gibi zamanlar
kaldırıldı; tek kaynak bu tablodur.

## Kaynak başına izleme

| Operatör | Duyuru kaynağı | Kontrol yöntemi | Sıklık | Hata davranışı |
| --- | --- | --- | --- | --- |
| Şehir Hatları | sehirhatlari.istanbul/tr/iptal-seferler | HTTP tarama (canlı) + snapshot | 00:05 TR gecelik; istek anında arşiv taze ise arşivden | Snapshot'a düşer, duyuru "bayat" etiketlenir |
| Dentur Avrasya | denturavrasya.com/tr-TR/duyurular | HTTP tarama | 00:05 TR gecelik | Snapshot'a düşer |
| Mavi Marmara | mavimarmara.net | HTTP tarama | 00:05 TR gecelik | Snapshot'a düşer |
| Turyol | turyol.com/Home/AktifPopupDuyurulari | HTTP tarama | 00:05 TR gecelik | Snapshot'a düşer |
| İDO | ido.com.tr/tr/iptal-seferler | Yok (WAF/autotam engel) | — | UI doğrudan resmî İDO iptal sayfasını linkler; veri uydurulmaz |
| Prens Tur | resmî site duyuru bölümü yok | Tarife afişi (JPEG) gecelik senkron | 23:00 TR | Duyuru yoksa "duyuru kaynağı yok" olarak işaretlenir |

## Tazelik sınıfları (`apps/web/src/lib/utils/data-freshness.ts`)

| Veri | Taze | Eskimekte | Bayat (uyarı) |
| --- | --- | --- | --- |
| Duyuru/iptal (dakika) | ≤ 90 dk (`ANNOUNCEMENT_FRESH_MAX_MIN`) | ≤ 360 dk (`ANNOUNCEMENT_STALE_MIN`) | > 360 dk → kırmızı bant |
| Tarife (gün) | ≤ 2 gün | ≤ 7 gün | > 7 gün |

Not: `ANNOUNCEMENT_*` eşikleri `data-freshness.ts` içinde tek kaynak
tanımlıdır (ayrıca `constants.ts`'e kopyalanmamıştır; çift kaynak istenmez).

## Değişiklik tespiti

- Belirgin fark (aynı alan, nettesabık değişim): arşive `ChangeEvent` olarak yazılır.
- Belirsiz fark: insan incelemesi için `monitor.recentChanges` içinde
  önceki/yeni değer ile saklanır; otomatik yayını aşmaz.

## Yayın öncesi kontrol listesi

1. `npm run validate:data` (tarife + duyuru kaynak alanları) geçmeli.
2. Duyuru snapshot'ının `generatedAt` damgası güncel mi? Değilse duyuru
   arayüzde kırmızı bantla gösterilir; yayın durdurulur.
3. Cron/Actions zamanları bu belgeyle uyuşmalı.

## Bilinen boşluklar

- Şehir Hatları/Mavi Marmara sayfaları Vercel'den 403 dönebilir: engel
  AŞILMAZ; resmî açık veri/İBB GTFS veya işletmeci izni yolu benimsenmelidir.
- Kalıcı depo (KV) ve dakikalık izlemeye yönelik barındırma kararları kullanıcıda
  (bkz. DUZELTME_RAPORU.md, Faz 3.4).
