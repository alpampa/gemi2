# Proje genelinde veri doğruluğu kuralı

Bu kural tarifeler, sefer saatleri, duraklar, ücretler, işletmeci adları, gemi atamaları, iptaller ve diğer yolcuya gösterilen bilgiler için geçerlidir.

## Zorunlu kurallar

- Kaynağı görülmeyen veya doğrulanamayan bilgi gerçekmiş gibi ekrana çıkarılamaz.
- Sefer bilgisi, ilgili işletmenin kendi güncel sayfası, tarifesi veya resmî duyurusuyla doğrulanmalıdır. Her kayıt için doğrudan kaynak adresi ve son kontrol zamanı tutulmalıdır.
- Arama motoru sonuçları, haberler, üçüncü taraf sefer siteleri ve yapay zekâ tahminleri resmî tarifenin yerine geçmez. Bunlar yalnızca araştırma ipucu olabilir.
- Resmî kaynak erişilemiyorsa, eskiyse, belirsizse veya iki resmî kaynak çelişiyorsa ilgili bilgi yayımlanmaz; kullanıcıya “doğrulanamadı” denir ve inceleme için işaretlenir.
- Eksik saat, ücret, durak, işletmeci veya gemi adı tahminle tamamlanamaz. Varsayılan ücret, örnek saat ve hat adına göre gemi ataması üretilemez.
- Önbellekteki veya geçmişte doğrulanmış kayıt, güncelliğini kaybedince otomatik olarak güncel kabul edilemez. Son doğrulama zamanı kullanıcıya gösterilmeli; doğrulama süresi dolan sefer bilgisi gizlenmelidir.
- Testler biçim ve tutarlılığı kontrol edebilir; tek başına gerçek dünya doğrulaması sayılmaz. Test verisi, örnek veri ve simülasyon üretim tarifesi gibi sunulamaz.
- Bir veri kaynağı eklendiğinde izleme yöntemi, ne sıklıkla kontrol edildiği ve hata durumunda ne yapılacağı belirtilmelidir. Arka plan ajanı değişiklik bulursa kaynağı ve önceki/yeni değeri kaydetmeli; belirsiz farkları insan incelemesine bırakmalıdır.
- Yayına çıkmadan önce değişiklik kapsamındaki her yolcu verisinin kaynağı yeniden kontrol edilmelidir. Bir kaydı doğrulamak mümkün değilse o kaydı yayına alma.

## Kapsam

Bu kural depo içindeki tüm uygulamalar ve ajanlar için geçerlidir. Alt klasörlerdeki yönergeler bu kuralla çelişirse yolcu verisinin doğruluğu kuralı önceliklidir.
