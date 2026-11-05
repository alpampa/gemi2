# Gemi2 düzeltme raporu

## BASELINE — 30 Ekim 2026

Kontroller, `fix/trust-and-mobile-hardening` dalında ve bu görev başlamadan önce depoda bulunan yerel değişikliklerle çalıştırıldı. Çalışma ağacı temiz değildi; bu nedenle sonuçlar temiz `main` dalını değil, mevcut geliştirme durumunu gösterir. Başlangıçta hiçbir kaynak dosyası değiştirilmedi.

| Kontrol | Sonuç |
| --- | --- |
| `npm ci` | İzin hatasından sonra gerekli dosya izniyle tamamlandı; 1.052 paket kuruldu. npm, Prisma ve `unrs-resolver` dahil 4 paketin kurulum betiğini çalıştırmadı. Eski bağımlılıklar için kullanımdan kalkma uyarıları verdi. |
| `npm run typecheck` | Başarılı. |
| `npm test` | 265 testin 252'si geçti, 13'ü başarısız oldu; 30 dosyanın 26'sı geçti. Hatalar duyuru ayrıştırma, duyuru güncelliği ve snapshot davranışlarında. |
| `npm run lint` | Başarısız: 211 bulgu; 52 hata ve 159 uyarı. Görünen kesin hata örneklerinden biri `src/store/useLanguageStore.ts` içindeki `any` kullanımı. |
| `npx playwright install chromium` | Ağ erişimi olmadan DNS hatası verdi; yükseltilmiş ağ izniyle komut başarılı tamamlandı. |
| `npm run test:e2e` | Sonuç alınamadı. Playwright, `output: "standalone"` kullanan projede `next start` ile sunucu açmaya çalıştı; testler başlamadan süreç durduruldu. |
| `npm run build` | Başarısız. İlk denemede Google Fonts'tan Inter indirilemedi. Tekrar denemede Turbopack, `leaflet.css` işlenirken alt Node sürecini başlatamadı ve derleme durdu. |

### Başlangıçtan görülen işler

- Duyuru testlerindeki beklenen davranışlar ile mevcut ayrıştırıcı/snapshot çıktıları uyuşmuyor. Testleri zayıflatmadan kök neden incelenecek.
- Lint'te mevcut 52 hata ve 159 uyarı var; yeni uyarı eklenmeyecek, kapsam içindeki hatalar sırayla giderilecek.
- E2E ayarı `next start` komutunu kullanıyor; Next.js 16 standalone çıktısı için sunucu başlatma yolunun düzeltilmesi gerekiyor.
- Yerel derleme ağ erişimine ve Turbopack alt sürecine bağlı bir hata verdi. Hata kaynağı doğrulanmadan ürün kodunda değişiklik yapılmayacak.
- `npm ci`, dört paketin kurulum betiğini çalıştırmadan tamamlandı; bu durum Prisma veya native resolver kullanan işlerde ayrıca doğrulanmalı.

## Kullanıcı eylemi gereken kararlar

- Faz 3.4 canlı veri kaynağı için seçenekler değerlendirilip karar istenecek; karar gelmeden yeni çekim altyapısı kurulmayacak.
- Faz 4.6'da belirtilen dosya taşıma/silme işleri onay gelmeden yapılmayacak.
- Faz 5.3'te `apps/api`'nin geleceği hakkında karar alınana kadar API uygulaması değiştirilmeyecek.
- Üretimde `ADMIN_SECRET` ve `CRON_SECRET` değerlerinin döndürülmesi kullanıcı tarafından yapılmalı.
