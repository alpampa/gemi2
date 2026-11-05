import { expect, test, type Page } from "@playwright/test";

/**
 * Service Worker v10 zayıf-ağ davranışı.
 * Not: WebKit'te Service Worker API'si Playwright tarafından desteklenmez;
 * bu test yalnızca Chromium tabanlı projelerde çalışır.
 */
test.describe("Service Worker — zayıf ağ dayanıklılığı", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "Yalnızca Chromium SW destekler");

  /**
   * `navigator.serviceWorker.ready` yalnızca AKTİF bir kayıt olduğunu garanti
   * eder; bu sayfanın o SW tarafından KONTROL EDİLDİĞİNİ garanti etmez.
   * Kontrol yoksa reload ağa gider ve test zamanlaması ağ gecikmesini ölçer
   * (kararsızlığın kök nedeni). Bu yüzden kontrol devrini açıkça bekleriz.
   */
  async function waitForServiceWorkerControl(page: Page) {
    await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), undefined, {
      timeout: 10_000,
    });
  }

  test("çevrimdışı yeniden yükleme kabuğu döner", async ({ page, context }) => {
    await page.goto("/");
    await waitForServiceWorkerControl(page);
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

  test("yavaş sunucuda kabuk ağ yerine önbellekten döner", async ({ page, context }) => {
    await page.goto("/");
    await waitForServiceWorkerControl(page);
    await page.waitForTimeout(1000);

    // Sonraki navigasyon isteğini 6 sn geciktir.
    // NOT: `page.route` Service Worker'ın kendi `fetch()` isteğini görmez
    // (Playwright belgelenmiş kısıtı) — gecikme uygulanmaz ve test ağ hızını
    // ölçer. `context.route` ağ katmanında devreye girdiği için SW isteğini de
    // kapsar; gecikme böylece deterministik olur.
    await context.route("**/", async (route) => {
      const req = route.request();
      if (req.resourceType() !== "document") return route.continue();
      await new Promise((r) => setTimeout(r, 6000));
      return route.continue();
    });

    const started = Date.now();
    // Ölçülen sözleşme iki parçalı:
    // 1) Yanıt SW'nin önbellek kabuğundan gelmeli (X-Vapur-Shell işareti).
    //    Bu, yanıtın ağdan mı önbellekten mi geldiğini süre gürültüsünden
    //    bağımsız olarak kesinleştirir.
    // 2) Süre, 6 sn'lik ağ gecikmesinin belirgin altında kalmalı; SW'nin
    //    NAVIGATION_TIMEOUT_MS (3 sn) bütçesi + commit gürültüsü için pay var.
    const res = await page.reload({ waitUntil: "commit", timeout: 15000 });
    const elapsed = Date.now() - started;

    expect(res?.headers()["x-vapur-shell"]).toBeDefined();
    expect(elapsed).toBeLessThan(5500);
    await expect(page.locator("body")).toBeVisible();
  });
});
