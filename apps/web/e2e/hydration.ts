import { expect, type Page } from "@playwright/test";

/**
 * Arayüz hidrasyonunun bittiğini bekler.
 *
 * `HydrationSignal` bileşeni React bağlandığında `<html data-hydrated="true">`
 * niteliğini koyar. Bu, "tıklanabilir mi" sorusunun tek güvenilir cevabıdır:
 * SSR HTML'i görünür ama handler'sızdır; yoğun yük altında (paralel worker)
 * hidrasyon saniyeler sürebilir.
 */
export async function waitForHydration(page: Page, timeout = 60_000): Promise<void> {
  await expect(page.locator("html")).toHaveAttribute("data-hydrated", "true", { timeout });
}

/** `goto` + hidrasyon beklemesi: etkileşimli testler için tek adım. */
export async function gotoReady(
  page: Page,
  path = "/",
  timeout = 90_000,
): Promise<void> {
  await page.goto(path, { waitUntil: "domcontentloaded", timeout });
  await waitForHydration(page);
}
