import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: true,
  /**
   * NEDEN 2 (3 değil): ana sayfa ~17.6k DOM düğümü / ~3.8 MB SSR üretiyor.
   * 3 eşzamanlı worker altında `next start` SSR kuyruğu doyuma giriyor; ölçülen
   * sonuç: 30 sn'lik gezinmeler, 503 yanıtları ve hidrasyonu tamamlanmayan
   * sayfalarda "tıkladım ama olmadı" hataları (11 başarısız test). Uygulama
   * hatası değil, test altyapısının kapasite sınırı. 2 worker ile SSR kuyruğu
   * kararlı kalıyor.
   */
  workers: 2,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  /**
   * Varsayılan 5 sn, bu uygulamanın görünürlük iddiaları için fazla sıkı:
   * ağır sayfada hidrasyon/çizim birkaç saniye sürebiliyor. Beklenen süre bir
   * sözleşme değil; iddiaların kendisi aynı kalıyor.
   */
  expect: { timeout: 15_000 },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "pixel-7",
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "iphone-13",
      /**
       * NEDEN serviceWorkers: "block": Playwright WebKit'in Service Worker
       * desteği eksik. Ölçüldü (aynı sayfa, aynı sunucu):
       *  - SW açıkken WebKit, aynı-kaynak `/api/version`, `/api/announcements`,
       *    `/api/ads` isteklerini "access control checks" gerekçesiyle düşürüyor
       *    (istek ağa hiç çıkmıyor) ve chunk yüklemeleri ChunkLoadError veriyor;
       *  - `serviceWorkers: "block"` ile hatalar tamamen kayboluyor ve istekler
       *    200 dönüyor.
       * Bu bir uygulama hatası değil, tarayıcı motorunun kısıtıdır; offline/SW
       * testleri de bu yüzden Chromium'a sınırlanmıştır. WebKit koşusu, SW'siz
       * bir WebKit'i temsil eder ve kalan tüm arayüz iddialarını gerçek şekilde
       * doğrular.
       */
      use: { ...devices["iPhone 13"], serviceWorkers: "block" },
    },
  ],
  webServer: {
    command: "npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
