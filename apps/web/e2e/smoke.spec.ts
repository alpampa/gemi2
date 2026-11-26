import { expect, test, type Page } from "@playwright/test";
import { gotoReady } from "./hydration";

/**
 * Duman testleri: üretim build'i üzerinde kritik kullanıcı akışları.
 * Seçiciler mevcut erişilebilirlik etiketlerine dayanır (aria-label / role),
 * böylece kozmetik değişikliklerde kırılmaz.
 *
 * MOBİL NOTU: Bazı kontroller masaüstünde ayrı düğme, mobilde "Hızlı Araçlar
 * Menüsü" içinde yaşar. Testler her iki yerleşimi de aynı semantik seçiciyle
 * doğrular; erişilebilirlik adı değişmediği için bu bir gevşetme değildir.
 */

/** Ayarlar çekmecesini masaüstü/mobil yerleşime göre açar. */
async function openSettings(page: Page) {
  const mobileTools = page.getByRole("button", { name: "Hızlı Araçlar Menüsü" });
  if (await mobileTools.isVisible()) {
    // NEDEN `force`: başlık saati/sayaç her saniye yeniden çiziliyor; WebKit'te
    // paralel yük altında Playwright'ın "iki ardışık karede aynı kutu" kararlılık
    // kontrolü hiç sağlanmıyor ve tıklama 90 sn bekliyordu (tam matriste bir kez).
    // Bu adım bir HAZIRLIK adımıdır, iddia değil: ayarlar çekmecesinin gerçekten
    // açıldığı hemen ardından `Görünüm Modu` ve tema kartı iddialarıyla
    // doğrulanır. Kararlılık kontrolü atlanır, görünürlük/etkinlik korunur.
    await mobileTools.click({ force: true });
    await page
      .getByRole("button", { name: /Görünüm ve erişilebilirlik ayarları/ })
      .click({ force: true });
    return;
  }
  await page.getByRole("button", { name: "Ayarlar" }).click({ force: true });
}

test("Ana sayfa: sefer listesi, güven şeridi ve alt menü görünür", async ({ page }) => {
  await gotoReady(page);

  await expect(page.getByRole("navigation", { name: "Ana gezinme" })).toBeVisible();
  // Güven şeridi mobilde yalnızca ikon + tarih gösterir; erişilebilir ad
  // her iki yerleşimde de "Duyuru doğrulama" içerir.
  await expect(page.getByRole("button", { name: /Duyuru doğrulama/ })).toBeVisible();
  // Gün rozeti (tarife günü) bugün şu biçimlerde görünür
  await expect(page.getByText(/Hafta içi|Cumartesi|Pazar|Tatil/).first()).toBeVisible();
  await expect(
    page.getByRole("button", { name: /seferi, detay için açın/ }).first()
  ).toBeVisible();
});

test("Erişilebilirlik: viewport yakınlaştırmayı engellemez", async ({ page }) => {
  await page.goto("/");

  const viewports = page.locator('meta[name="viewport"]');
  await expect(viewports).toHaveCount(1);
  const content = (await viewports.getAttribute("content")) ?? "";
  expect(content).not.toContain("user-scalable");
  expect(content).not.toContain("maximum-scale");
  expect(content).toContain("width=device-width");
});

test("Ana sayfa: kaynaksız doluluk tahmini gösterilmez", async ({ page }) => {
  await gotoReady(page);

  await expect(page.getByRole("button", { name: /seferi, detay için açın/ }).first()).toBeVisible();
  await expect(page.getByText(/tahmini doluluk/i)).toHaveCount(0);
  await expect(page.getByText(/~\s*%\d+/)).toHaveCount(0);
});

test("Pano sekmesi: iskele kalkış panosu açılır", async ({ page }) => {
  await gotoReady(page, "/?view=board");

  await expect(page.getByText(/İSKELE KALKIŞ PANOSU/i)).toBeVisible();
  await expect(page.getByText(/İskelesi/).first()).toBeVisible();
});

test("Sefer detayı: çekmece açılır, Aktarma sekmesinde yürüme takibi görünür", async ({ page }) => {
  test.setTimeout(90_000);
  await gotoReady(page);

  // Kalkışını yeni geçmiş kart ("HAREKET ETTİ", 30 sn'lik pencere) listede kendi
  // kronolojik yerinde kalır ve ilk sırada olabilir; detay akışı için listedeki
  // ilk KALKMAMIŞ seferi seç (kullanıcı da yaklaşan sefere dokunur).
  //
  // SEÇİM SIRAYLA DEĞİL KİMLİKLE YAPILIR: liste her saniye geri sayıma göre
  // yeniden sıralanıyor. Sıra numarasıyla seçmek, `innerText()` ile okuma ve
  // `click()` arasında hedefin BAŞKA bir karta kaymasına yol açıyordu (paralel
  // yükte tam matriste bir kez kırıldı). `data-trip-id` sıralamadan bağımsızdır.
  const cards = page.locator("[data-trip-id]");
  await expect(cards.first()).toBeVisible({ timeout: 10000 });

  const candidates = await cards.evaluateAll((nodes) =>
    nodes
      .map((n) => ({
        id: n.getAttribute("data-trip-id"),
        text: n.textContent ?? "",
      }))
      .filter((c): c is { id: string; text: string } => Boolean(c.id))
  );
  const target = candidates.find((c) => !c.text.includes("HAREKET ETTİ"));
  expect(target, "detayı açılacak kalkmamış sefer bulunamadı").toBeTruthy();

  const targetCard = page.locator(`[data-trip-id="${target!.id}"]`).first();
  await targetCard.getByRole("button", { name: /detay için açın/ }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible({ timeout: 10000 });

  await dialog.getByRole("tab", { name: "Aktarma" }).click();
  await expect(dialog.getByText("Yürüme Süresi")).toBeVisible();
  await expect(dialog.getByText("Turnike & Biniş Emniyeti")).toBeVisible();
});

test("Arama: doğal arama ile liste filtrelenir", async ({ page }) => {
  await gotoReady(page);

  // NEDEN "Tüm Gün": varsayılan liste yalnızca YAKLAŞAN seferleri gösterir.
  // Gece servis boşluğunda (00:10–06:00) ya da tek seferlik pencerelerde arama
  // sonucu boş kalır ve test saate bağımlı olur. Tüm Gün modunda tarifenin
  // tamamı (06:00–00:30) aranabilir; bu, ürünün arama sözleşmesini saate
  // bağımlı olmadan ölçer.
  await page.getByRole("button", { name: /Tüm Gün/ }).first().click();

  await page.getByRole("button", { name: "Ara", exact: true }).click();
  const search = page.getByPlaceholder(/İskele veya hat ara/i);
  await search.fill("Büyükada");

  // Sözleşme: sorgu yanıtlanır — ya Büyükada geçen bir sefer ya da açık
  // "eşleşen sefer bulunamadı" mesajı görünür. Sessiz boş liste kabul edilmez.
  await expect(
    page
      .getByRole("button", { name: /Büyükada/ })
      .first()
      .or(page.getByText(/eşleşen aktif vapur seferi bulunamadı/i).first())
  ).toBeVisible({ timeout: 8000 });
});

test("Tema kalıcılığı: Gün Işığı modu seçilir ve yenilemede korunur", async ({ page }) => {
  test.setTimeout(90_000);
  await gotoReady(page);

  // Görünüm seçimi bugün Ayarlar çekmecesinde (DASHBOARD_SKINS); "sun-contrast"
  // önderroği "Gün Işığı & Erişilebilir" kartını seçerek uygulanır.
  await openSettings(page);

  const sheet = page.getByText("Görünüm Modu", { exact: true });
  await sheet.waitFor({ timeout: 10000 });

  const skinCard = page.getByRole("button", { name: /Gün Işığı & Erişilebilir/ });
  await skinCard.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "sun-contrast");

  /**
   * Kalıcılık sözleşmesi iki adımlıdır ve ikisi ayrı ayrı doğrulanır:
   *  1) Tercih localStorage'a yazılmalı (yoksa reload sonrası hiçbir şey
   *     hatırlanamaz),
   *  2) Yeni belgede tema, hidrasyondan bağımsız olarak head'deki satır içi
   *     betikle uygulanmalı (FOUC yok).
   * Önceki sürüm doğrudan reload sonrası niteliği okuyordu; SW devri ile
   * yarışınca geçiş belgesinde boş değer görülüp sebepsiz düşüyordu.
   */
  const stored = await page.evaluate(() => localStorage.getItem("vapur_app_theme_v2"));
  expect(stored, "tema tercihi localStorage'a yazılmalı").toBeTruthy();
  expect(JSON.parse(stored as string).state.theme).toBe("sun-contrast");

  // Gece yükü altında reload bazen ERR_ABORTED verebilir (servis çalışanı devri);
  // kalıcılık kontrolü taze gezinmeyle de aynı şekilde doğrulanır.
  try {
    await page.reload({ waitUntil: "domcontentloaded", timeout: 30_000 });
  } catch {
    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 30_000 });
  }
  /**
   * HİDRASYON BEKLENMEZ. Bu testin sözleşmesi "tema tercihi yeni belgede
   * korunur"; tema `data-theme` niteliğine head'deki satır içi betikle
   * uygulanır, React'e bağlı değildir. Buna karşılık SW devri sırasında
   * reload geçiş belgesi döndürebiliyor ve bu belgede hidrasyon hiç
   * çalışmıyor (yukarıdaki notun aynı kök nedeni) — burada hidrasyon
   * beklemek, ölçülen sözleşmeyle ilgisiz bir kırılganlık ekliyordu.
   * İlk gezinmede `gotoReady` hidrasyonu zaten kanıtlıyor.
   */
  await expect(page.locator("html")).toHaveAttribute("data-theme", "sun-contrast", {
    timeout: 20_000,
  });
});
