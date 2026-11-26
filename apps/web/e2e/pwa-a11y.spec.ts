import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { gotoReady, waitForHydration } from "./hydration";

/**
 * PWA manifest sözleşmesi ve erişilebilirlik taraması.
 *
 * Manifest testi, kısayol URL'lerinin UYGULAMANIN GERÇEKTEN OKUDUĞU
 * parametrelerle eşleştiğini doğrular (kısayolun sessizce çalışmaması
 * regresyonunu engeller).
 */

test("Manifest: kurulabilirlik ve kısayol parametreleri tutarlı", async ({ request }) => {
  const res = await request.get("/manifest.json");
  expect(res.ok()).toBeTruthy();
  const m = await res.json();

  expect(m.id).toBe("/");
  expect(m.scope).toBe("/");
  expect(m.lang).toBe("tr");
  expect(m.orientation).toBeUndefined();

  const sizes = (m.icons ?? []).map((i: { sizes: string }) => i.sizes);
  expect(sizes).toContain("192x192");
  expect(sizes).toContain("512x512");
  const maskable = (m.icons ?? []).filter((i: { purpose?: string }) =>
    (i.purpose ?? "").includes("maskable")
  );
  expect(maskable.length).toBeGreaterThan(0);

  for (const s of m.shortcuts ?? []) {
    expect(s.url).toMatch(/^\/\?/);
  }
  const shortcutUrls = (m.shortcuts ?? []).map((s: { url: string }) => s.url);
  expect(shortcutUrls).toContain("/?cat=ADALAR");
  expect(shortcutUrls).toContain("/?cat=BOGAZ");
  expect(shortcutUrls).toContain("/?view=piers");
  expect(shortcutUrls).toContain("/?view=weather");
});

test("Apple touch icon mevcut ve PNG", async ({ request }) => {
  const res = await request.get("/apple-touch-icon.png");
  expect(res.ok()).toBeTruthy();
  expect(res.headers()["content-type"]).toContain("image/png");
});

for (const path of ["/", "/profile"]) {
  test(`axe: ${path} serious/critical ihlal yok`, async ({ page }) => {
    // Ana sayfa ~17.6k DOM düğümü içeriyor; axe taraması CPU'ya duyarlı ve
    // paralel koşuda 30 sn varsayılanı aşabiliyor. Bu test yalnızca "serious/
    // critical ihlal yok" ölçütünü doğrular; süre eşiği burada bir sözleşme
    // değildir, bu yüzden yalnızca bu test için üst sınır yükseltilir.
    test.setTimeout(180_000);
    await page.goto(path, { waitUntil: "domcontentloaded", timeout: 90_000 });
    await page.waitForTimeout(1500);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    const blocking = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical"
    );
    expect(
      blocking.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)
    ).toEqual([]);
  });
}

/**
 * CANLI İPTAL SENARYOSU — neden deterministik bir mock:
 *
 * Gerçek axe ihlali (düşük kontrastlı iptal metni + klavyeyle erişilemeyen
 * yatay kaydırma bölgesi) yalnızca /api/announcements canlı bir iptal
 * duyurusu döndürdüğünde ortaya çıkıyordu. Bu, testin o gün kaynakta iptal
 * olup olmamasına bağlı olması demekti: iptal yoksa ihlal hiç üretilmiyor,
 * varsa üretiliyordu. Aşağıdaki senaryo iptal yanıtını sabitler; böylece
 * düzeltilen görünüm HER KOŞUDA ekrana gelir ve taranır.
 *
 * UYDURMA VERİ YOK: bu bir test fixture'ıdır (API yanıtı taklidi), kullanıcıya
 * gösterilen üretim verisi değildir. `tripId` ekranda GERÇEKTEN render edilmiş
 * bir seferden okunur; sabit bir id yazılsaydı gün/saat filtreleri (bugünün
 * tarifesi, kalkmış seferler) testi günün saatine göre kırılgan yapardı.
 *
 * SERVİS İŞÇİSİ KAPALI: ölçülen şey DOM/kontrast. Service worker açıkken
 * `page.reload()` zaman zaman eski kabuğu (önceki derlemenin chunk adlarıyla)
 * döndürüyor, React hidrasyonu hiç çalışmıyor ve test "kontrast temiz" değil
 * "hidrasyon yok" diye düşüyordu. SW bu iddianın parçası olmadığı için
 * kapatılır; çevrimdışı davranışı ayrı testler kapsıyor.
 *
 * AÇIK TEMA: ölçülen kontrast hataları açık temada ortaya çıkıyordu (koyu
 * temada `dark:` varyantları devreye girdiği için gizleniyorlardı). Bu yüzden
 * senaryo açık temayla açılır — aksi halde düzeltme geri alınsa bile test
 * geçerdi.
 */
test.describe("canlı iptal yüzeyi", () => {
  test.use({ serviceWorkers: "block" });

  test("canlı iptal: iptal kartı ve duyuru bandı serious/critical ihlal üretmez", async ({
    page,
  }) => {
    test.setTimeout(240_000);

    await page.addInitScript(() => {
      localStorage.setItem(
        "vapur_app_theme_v2",
        JSON.stringify({ state: { theme: "nordic-clean" }, version: 0 })
      );
    });

    interface MockBody {
      generatedAt: string;
      announcements: unknown[];
      disruptions: Array<Record<string, unknown>>;
      sourceHealth: unknown[];
      recentChanges: unknown[];
      meta: {
        liveScanAt: string | null;
        storedSnapshotGeneratedAt: string | null;
        coverage: unknown[];
      };
    }

    const emptyBody: MockBody = {
      generatedAt: new Date().toISOString(),
      announcements: [],
      disruptions: [],
      sourceHealth: [],
      recentChanges: [],
      meta: { liveScanAt: null, storedSnapshotGeneratedAt: null, coverage: [] },
    };

    // Duyuru yanıtı testin kontrolünde: ilk yüklemede boş, sonra iptalli.
    let body: MockBody = emptyBody;
    await page.route("**/api/announcements*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(body),
      });
    });

    await gotoReady(page, "/");

    // Bugünün listesinde render edilmiş seferleri seç. Kalkışa en uzak olanlar
    // sondadır → yeniden yükleme sırasında "kalktı" penceresine girme olasılığı
    // en düşük. Birden çok sefer iptal edilmesi bandın GERÇEKTEN taşmasını
    // sağlar: tek satırlık içerik sığarsa marquee hiç devreye girmez ve asıl
    // kaydırma bölgesi ihlali ölçülemez.
    const cancellable = page.locator("[data-trip-id]:not([data-cancelled='true'])");
    await expect(cancellable.first()).toBeVisible();
    const allIds = await cancellable.evaluateAll((nodes) =>
      nodes
        .map((n) => n.getAttribute("data-trip-id"))
        .filter((id): id is string => Boolean(id))
    );
    const tripIds = Array.from(new Set(allIds)).slice(-6);
    expect(tripIds.length, "iptal edilecek sefer kimliği okunamadı").toBeGreaterThan(0);

    // İstanbul takvimine göre bugün (YYYY-MM-DD) — duyurunun geçerlilik tarihi.
    const parts = new Intl.DateTimeFormat("tr-TR", {
      timeZone: "Europe/Istanbul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .format(new Date())
      .split(".");
    const todayTr = `${parts[2]}-${parts[1]}-${parts[0]}`;

    body = {
      ...emptyBody,
      generatedAt: new Date().toISOString(),
      disruptions: tripIds.map((id, idx) => ({
        // `operator` istemci tarafındaki iptal eşleştirmesinde kullanılmıyor
        // (eşleşme `tripId` ile yapılır); yanıtın sözleşme şeklini korumak için
        // açıkça "test" olarak işaretlendi.
        operator: "Test Kaynağı",
        tripId: id,
        kind: "CANCELLED",
        announcementTitle: "Test duyurusu: sefer iptal",
        announcementId: `e2e-cancelled-trip-${idx}`,
        confidence: "CONFIRMED",
        freshness: "FRESH",
        validDate: todayTr,
      })),
    };

    // Hareket kısıtı açıkken akış DURUR; taşan bant yine de erişilebilir
    // olmalıdır. Düzeltilen `scrollable-region-focusable` regresyonu tam olarak
    // bu yolda ortaya çıkıyordu, bu yüzden tarama bu tercihle yapılır.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.reload({ waitUntil: "domcontentloaded" });
    await waitForHydration(page);

    // İptal bilgisi karta işlendi mi? (overlay → status CANCELLED)
    await expect(
      page.locator(`[data-trip-id="${tripIds[0]}"][data-cancelled="true"]`).first()
    ).toBeVisible();
    // Kayan iptal bandı da render edilmiş olmalı: asıl kaydırma/odak ihlali
    // bu bantta ortaya çıkıyordu.
    await expect(page.locator("#cancelled-trips-heading")).toBeVisible();
    // Taşan bant, hareket kısıtı altında klavyeyle kaydırılabilir olmalı.
    // (Bu iddia olmadan taşma gerçekleşmezse axe ihlali de üretilmez ve test
    // sessizce "boş" geçerdi.)
    await expect(
      page.getByRole("group", { name: "Yatay kaydırılabilir içerik" }).first()
    ).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    const blocking = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical"
    );
    expect(blocking.flatMap((v) => v.nodes.map((n) => `${v.id}: ${n.target.join(" ")}`))).toEqual(
      []
    );
  });
});
