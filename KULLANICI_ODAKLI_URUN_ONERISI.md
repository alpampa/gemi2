# Vapur uygulaması: kullanıcı odaklı geliştirme önerisi

**Onaya sunulan öneri — 29 Ekim 2026**

## Önerinin özeti

Vapur’u daha kullanışlı yapmak için ilk olarak ana ekrandaki seçenekleri azaltıp yolcunun kararını hızlandıralım. Yolcu uygulamayı açtığında şu üç bilgiye kolayca ulaşmalı:

1. Nereden bineceğim?
2. Oradan hangi iskelelere gerçekten sefer var?
3. Yetişebileceğim en uygun sefer hangisi?

İlk geliştirme aşamasında özellikle **Nereden / Nereye seçimini doğru ve anlaşılır hâle getirmeyi** öneriyorum. Bu, tarifeye yeni sefer eklemekten veya ekranı baştan yazmaktan daha doğrudan bir kullanıcı sorununu çözer.

## Mevcut durum

Uygulamada bugün sefer listesi, iskele panosu, iskele rehberi, hava durumu, favoriler ve iptal duyuruları var. Gün seçimi, operatör filtresi, sefer paylaşımı ve aktarmalı rota önerileri de bulunuyor. Bunlar iyi bir temel oluşturuyor.

Ancak “Nereye?” listesi, seçilen iskeleden doğrudan gidilebilen yerleri ayırsa da **doğrudan sefer olmayan diğer iskeleleri de “aktarmalı” seçenek olarak gösterebiliyor**. Bu seçeneklerin hepsinin seçilen gün ve saat için gerçekten yapılabilir bir yolculuğu olup olmadığı önceden doğrulanmıyor. Ayrıca operatör filtresi değiştiğinde listede görünen varış yerleri, sonuçlarla aynı ölçüde daralmayabiliyor.

Örneğin yolcu Bostancı’yı seçtiğinde:

- “Nereye?” listesinin ilk bölümünde yalnızca Bostancı’dan tarifede sefer bulunan iskeleler görünmeli.
- Bostancı’dan Üsküdar’a doğrudan sefer yoksa Üsküdar bu bölümde görünmemeli.
- Aktarmalı yolculuk da sunulacaksa, Üsküdar ancak seçilen gün ve saatlerde iki seferin de yapılabildiği doğrulanırsa, ayrı bir “Aktarmalı” bölümünde çıkmalı.
- Gerçek bir yolculuk bulunmuyorsa varış yeri seçenek olarak gösterilmemeli.

Bu kural tüm iskeleler, operatörler ve gün seçimleri için geçerli olmalı.

## Önerilen yolcu akışı

### 1. Uygulama açılır

Ana ekranda sefer arama ve kalkış iskelesi seçimi ilk bakışta görülsün. Favori iskeleler varsa tek dokunuşla seçilebilsin. Yakındaki iskeleyi bulma seçeneği sunulsun; konum izni zorunlu olmasın.

Alt menü ve yardımcı bölümler kalsın, ancak ilk ekranda sefer bulmanın önüne geçmesin. Duyuru, hava durumu ve tanıtım içerikleri sefer kararını gölgelememeli.

### 2. Kalkış iskelesi seçilir

İskele listesi gerçek tarifedeki kalkış ve ara duraklardan oluşturulsun. Seçili gün ve operatör değiştiğinde, o tercihlerde hizmet verilmeyen yerler uygun seçenek gibi kalmasın.

### 3. Varış yeri seçilir

Varsayılan olarak yalnızca **doğrudan sefer olan varışlar** gösterilsin. Yolcu isterse “Aktarmalı seçenekleri de göster” seçeneğini açsın. Aktarmalı listede yalnızca tüm ayakları tarifede bulunan ve aktarma bekleme süresi uygun olan yollar yer alsın.

Gün, operatör veya saat değiştiğinde bu liste yeniden hesaplansın. Böylece seçenekler sonuç ekranıyla aynı kurala dayanır.

### 4. Sefer sonuçları karşılaştırılır

Her sefer satırında önce kalkış saati ve kalan süre görünsün. Ardından kalkış-varış, işletme, ücret ve varsa aktarma bilgisi yer alsın. Kullanıcının kararını etkileyen bilgi kartlar arasında aynı yerde bulunsun.

Gerçek gemi konumu ile yalnızca tarifeye göre hesaplanan süre ayrı anlatılsın. Ücreti veya varış süresi doğrulanmamış seferlerde kesin fiyat/süre izlenimi verilmesin; “tahmini” veya “bilgi doğrulanamadı” etiketi kullanılsın.

### 5. Sefer ayrıntısı açılır

Yolcu bilet almadan önce iskeleye nasıl ulaşacağını, hangi rıhtımdan bineceğini, yürüyüş süresini ve biniş için ne zamana kadar iskelede olması gerektiğini görebilsin. Bilgi doğrulanmamışsa rıhtım numarası varsayılmasın.

Aktarmalı yolculukta her sefer ayrı satırda gösterilsin: hangi iskeleden binilecek, aktarma nerede, bekleme ne kadar, ikinci sefer kaçta kalkıyor ve toplam ücret ne kadar. Yaklaşık bilgiler açıkça yaklaşık olarak işaretlensin.

### 6. Sefer yoksa veya iptal edilmişse

Boş sonuç ekranı nedeni açıklasın. Örneğin:

- “Bu gün bu iskeleler arasında sefer yok.”
- “Bugün sefer var, ancak kalkış saati geçti.”
- “Doğrudan sefer yok; uygulanabilir aktarma da bulunamadı.”
- “Kaynak şu anda doğrulanamıyor; son bilgi … saatinde alındı.”

İptalde, duyurunun hangi işletmeden geldiği ve ne zaman doğrulandığı gösterilsin. Alternatif olarak sadece gerçekten yetişilebilecek başka sefer önerilsin. Rüzgâr veya hava durumuna dayalı risk tahmini, resmî iptal duyurusu gibi sunulmasın.

### 7. Favori ve hatırlatıcılar kullanılır

Favori iskele ve sık kullanılan yolculuklar ana ekrandan kolayca seçilebilsin. Bildirim izni, kullanıcı hatırlatıcı kurarken istensin; uygulamayı ilk açtığında karşısına çıkmasın. Hatırlatıcıda sefer saati ve iskele açıkça yer alsın.

### 8. İnternet kesilirse

Son indirilen tarife gösterilebilir, fakat ne zaman alındığı görünür olmalı. Eski bilgi “canlı” gibi gösterilmemeli. İptal bilgisi güncel doğrulanamıyorsa bunu ayrıca belirtelim.

## Ergonomi ve erişilebilirlik

- Yazılar güneş altında okunacak kadar belirgin olsun.
- Sık kullanılan düğmeler parmakla rahatça seçilecek büyüklükte kalsın.
- Aynı işlem, uygulamanın farklı ekranlarında farklı adlarla görünmesin.
- Sonuç yokken kullanıcıyı çıkmaza sokmak yerine açık seçenekler sunulsun.
- Ekran okuyucu kullanan kişiler sefer saati, iptal durumu ve düğme adlarını anlayabilsin.
- Hareketli efektler azaltılabilsin; renk tek başına durum anlatmak için kullanılmasın.
- Sponsorlu içerik açıkça etiketlensin ve en yakın sefer bilgisinin önüne geçmesin.

## Uygulama planı

### Aşama 1 — Doğru güzergâh seçimi

Doğrudan seferleri varış listesinden doğru süzmek; aktarmaları yalnızca tarifede gerçekten mümkünse göstermek; gün ve işletme seçimleriyle listeyi eşzamanlı güncellemek. Bostancı örneği için doğrudan ve aktarmalı seçenekleri ayrı ayrı doğrulamak.

### Aşama 2 — Sefer bulma ekranı

Arama, favori iskeleler ve kalkış-varış alanını ilk ekranda daha anlaşılır bir düzene almak. En yakın sefer bilgisini ve veri güncelliğini öne çıkarmak.

### Aşama 3 — Karar ve yolculuk ayrıntıları

Sefer kartlarını birbiriyle kolay karşılaştırılacak şekilde düzenlemek; ücret, rıhtım, yürüyüş, aktarma ve iptal bilgisini doğruluk durumuyla birlikte göstermek.

### Aşama 4 — Yolcu denemesi

İstanbul’da vapur kullanan kişilerle telefon üzerinde denemek. Özellikle Bostancı’dan farklı varışlar seçtirerek yanlış veya boş sonuç olup olmadığını, kullanıcının doğru sefere kaç adımda ulaştığını görmek. Geri bildirime göre son düzenlemeleri yapmak.

## Başarı ölçütleri

- Seçilen kalkıştan sefer olmayan varış, doğrudan sefer listesinde görünmüyor.
- “Aktarmalı” seçeneği seçildiğinde o yolculuğun tüm seferleri ve uygun aktarma saati bulunuyor.
- Gün ve işletme filtresi değişince varış listesi de sonuçlar gibi güncelleniyor.
- Kaçırılmış veya iptal edilmiş sefer, yetişilebilir seçenek gibi gösterilmiyor.
- Yolcu kalkış saatini, iskeleyi ve bilginin güncelliğini tek bakışta anlayabiliyor.
- İlk kullanımda konum izni vermeyen yolcu da sefer bulabiliyor.

## Onayınıza sunulan karar

İlk olarak **Aşama 1’i** yapmayı öneriyorum: “Nereden / Nereye” listelerini gerçek ve seçilebilir seferlere bağlayıp Bostancı örneğinden başlayarak tüm iskeleler için aynı kuralı uygulamak. Ardından ekran düzenini Aşama 2’de iyileştirebiliriz.

**Onayınız:** Önce Aşama 1 ile başlayalım mı?
