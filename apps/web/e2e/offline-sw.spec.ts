import { expect, test, type Page } from "@playwright/test";

/**
 * Service Worker v10 zayıf-ağ davranışı.
 * Not: WebKit'te Service Worker API'si Playwright tarafından desteklenmez;
 * bu test yalnızca Chromium tabanlı projelerde çalışır.
 */
test.describe("Service Worker — zayıf ağ dayanıklılığı", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "Yalnızca Chromium SW destekler");

  /**
   * NEDEN 120 sn: ana sayfa ~17.6k düğüm / ~3.8 MB SSR; tek başına yükleme
   * birkaç saniye, SW devri + kabuk ısısı eklenince küresel 30 sn bütçesi
   * doluyordu (ölçüldü: testler önbellek oluşmadan "timeout of 30000ms" ile
   * düşüyordu). Bu bir gevşetme değil: iddialar aynı, yalnızca süre gerçekçi.
   */
  test.setTimeout(120_000);

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

  /**
   * Kabuk ("/") önbelleğe yazılana kadar bekle.
   *
   * NEDEN `expect.poll`: `page.waitForFunction` içine verilen `async` fonksiyon
   * AWAIT EDİLMEZ; dönen Promise nesnesi truthy olduğu için koşul anında
   * sağlanmış sayılır (ölçüm yapılmazdı). Gerçek koşul, Node tarafında
   * yoklanarak doğrulanır.
   */
  async function waitForCachedShell(page: Page) {
    await expect
      .poll(
        () =>
          page.evaluate(
            async () => "caches" in window && Boolean(await caches.match("/", { ignoreVary: true })),
          ),
        { timeout: 45_000, intervals: [250, 500, 1000] },
      )
      .toBe(true);
  }

  /**
   * SW'nin ağ yoluna yapay gecikme kurar ve onayı bekler.
   *
   * NEDEN: Playwright'ın route katmanı Service Worker'ın kendi `fetch()`
   * isteğini görmez; gecikme ağ katmanından enjekte edilemiyor. SW'deki test
   * kancası gerçek `handleNavigation` yarışını (3000 ms zaman aşımı +
   * önbellek yedeği) değiştirmeden çalıştırır.
   */
  async function setSwNetworkDelay(page: Page, ms: number) {
    await page.evaluate(
      (delay) =>
        new Promise<void>((resolve, reject) => {
          const sw = navigator.serviceWorker.controller;
          if (!sw) {
            reject(new Error("Service Worker sayfayı kontrol etmiyor"));
            return;
          }
          const timer = setTimeout(
            () => reject(new Error("SW gecikme onayı 5 sn içinde gelmedi")),
            5000,
          );
          const onMessage = (event: MessageEvent) => {
            if (event.data?.type !== "VAPUR_TEST_NETWORK_DELAY_ACK") return;
            clearTimeout(timer);
            navigator.serviceWorker.removeEventListener("message", onMessage);
            resolve();
          };
          navigator.serviceWorker.addEventListener("message", onMessage);
          sw.postMessage({ type: "VAPUR_TEST_NETWORK_DELAY", ms: delay });
        }),
      ms,
    );
  }

  test("çevrimdışı yeniden yükleme kabuğu önbellekten döner", async ({ page, context }) => {
    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 90_000 });
    await waitForServiceWorkerControl(page);
    await waitForCachedShell(page);

    await context.setOffline(true);
    try {
      const res = await page.reload({ waitUntil: "domcontentloaded", timeout: 15000 });
      // Sözleşme: çevrimdışıyken minimal "çevrimdışısınız" sayfasına değil,
      // önbellekteki uygulama kabuğuna düşülür (X-Vapur-Shell=cached).
      expect(res?.headers()["x-vapur-shell"]).toBe("cached");
      await expect(page.getByRole("navigation", { name: "Ana gezinme" })).toBeVisible();
    } finally {
      await context.setOffline(false);
    }
  });

  test("yavaş sunucuda kabuk ağ yerine önbellekten döner", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 90_000 });
    await waitForServiceWorkerControl(page);
    await waitForCachedShell(page);

    // Ağ isteğini 6 sn geciktir: SW'nin 3000 ms bütçesi aşılmalı.
    await setSwNetworkDelay(page, 6000);

    const started = Date.now();
    // Ölçülen sözleşme iki parçalı:
    // 1) Yanıt SW'nin önbellek kabuğundan gelmeli (X-Vapur-Shell işareti).
    //    Bu, yanıtın ağdan mı önbellekten mi geldiğini süre gürültüsünden
    //    bağımsız olarak kesinleştirir.
    // 2) Süre, 6 sn'lik ağ gecikmesinin belirgin altında kalmalı; SW'nin
    //    NAVIGATION_TIMEOUT_MS (3 sn) bütçesi + commit gürültüsü için pay var.
    const res = await page.reload({ waitUntil: "commit", timeout: 15000 });
    const elapsed = Date.now() - started;

    const marker = res?.headers()["x-vapur-shell"];
    // Teşhis bilgisi hata mesajına gömülür: kararsızlık tekrar ederse hangi
    // yolun (ağ/önbellek/çevrimdışı) kazandığı doğrudan görülür.
    expect(
      marker,
      `kabuk işareti yok (status=${res?.status()}, elapsed=${elapsed}ms, url=${res?.url()})`,
    ).toBe("cached");
    expect(elapsed).toBeLessThan(5500);
    await expect(page.locator("body")).toBeVisible();
  });
});
