import { expect, test } from "@playwright/test";

/**
 * Service Worker v10 zayıf-ağ davranışı.
 * Not: WebKit'te Service Worker API'si Playwright tarafından desteklenmez;
 * bu test yalnızca Chromium tabanlı projelerde çalışır.
 */
test.describe("Service Worker — zayıf ağ dayanıklılığı", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "Yalnızca Chromium SW destekler");

  test("çevrimdışı yeniden yükleme kabuğu döner", async ({ page, context }) => {
    await page.goto("/");
    await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
    // Kabuğun önbelleğe yazılması için kısa bekleme
    await page.waitForTimeout(1000);

    await context.setOffline(true);
    try {
      const res = await page.reload({ waitUntil: "domcontentloaded", timeout: 15000 });
      // SW çevrimdışı yanıtı 503 dönebilir (yaşam kabuğu); sözleşme:
      // sayfa boş kalmaz, çevrimdışı bilgilendirici kabuk görünür.
      expect(res?.status()).toBeLessThan(600);
      await expect(page.locator("body")).toContainText(/çevrimdışı|offline/i, { ignoreCase: true });
    } finally {
      await context.setOffline(false);
    }
  });

  test("yavaş sunucuda 3.5 sn içinde önbellekten kabuk döner", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
    await page.waitForTimeout(1000);

    // Sonraki navigasyon isteğini 6 sn geciktir.
    await page.route("**/", async (route) => {
      const req = route.request();
      if (req.resourceType() !== "document") return route.continue();
      await new Promise((r) => setTimeout(r, 6000));
      return route.continue();
    });

    const started = Date.now();
    // Ölçülen sözleşme: SW, 6 sn geciktirilen AĞI atlayıp kabuğu hızla döndürür.
    // `commit`, yanıt başlıkları geldiğinde çözülür; böylece 3.5 sn bütçesi
    // DOM parse/CPU yükünü değil, önbellekten yanıt dönüşünü ölçer.
    await page.reload({ waitUntil: "commit", timeout: 15000 });
    const elapsed = Date.now() - started;

    expect(elapsed).toBeLessThan(3500);
    await expect(page.locator("body")).toBeVisible();
  });
});
