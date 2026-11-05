import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

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
