import { describe, expect, it } from "vitest";
import {
  marqueeDurationSec,
  resolveMarqueeLayout,
} from "@/lib/utils/marquee-policy";

/**
 * Kayan şerit yerleşim sözleşmesi.
 *
 * NEDEN BİRİM TESTİ: bu davranış canlı sayfada yalnızca axe taramasıyla
 * dolaylı ölçülebiliyordu; gerçek ihlal (klavyeyle erişilemeyen kaydırma
 * bölgesi) ancak o an ekranda iptal duyurusu varsa ortaya çıkıyordu. Karar
 * saf fonksiyona taşındığı için sözleşme artık deterministik doğrulanıyor.
 */
describe("resolveMarqueeLayout", () => {
  it("içerik sığıyorsa ne akış ne kaydırma vardır", () => {
    const layout = resolveMarqueeLayout({
      copyWidthPx: 300,
      containerWidthPx: 600,
      prefersReducedMotion: false,
    });
    expect(layout).toEqual({
      overflows: false,
      flowing: false,
      keyboardScrollable: false,
    });
  });

  it("içerik taşıyorsa ve hareket kısıtı yoksa akış çalışır, kaydırma bölgesi olmaz", () => {
    const layout = resolveMarqueeLayout({
      copyWidthPx: 900,
      containerWidthPx: 600,
      prefersReducedMotion: false,
    });
    expect(layout.overflows).toBe(true);
    expect(layout.flowing).toBe(true);
    expect(layout.keyboardScrollable).toBe(false);
  });

  it("hareketi azalt tercihinde akış durur ama taşan içerik klavyeyle erişilebilir kalır", () => {
    // Regresyon: akış kapalıyken kapsayıcı yatay kaydırılabilir kalıyor ve
    // odaklanabilir olmadığı için axe `scrollable-region-focusable` ihlali
    // üretiyordu.
    const layout = resolveMarqueeLayout({
      copyWidthPx: 900,
      containerWidthPx: 600,
      prefersReducedMotion: true,
    });
    expect(layout.overflows).toBe(true);
    expect(layout.flowing).toBe(false);
    expect(layout.keyboardScrollable).toBe(true);
  });

  it("hareketi azalt tercihinde sığan içerik kaydırma bölgesi sayılmaz", () => {
    const layout = resolveMarqueeLayout({
      copyWidthPx: 600,
      containerWidthPx: 600,
      prefersReducedMotion: true,
    });
    expect(layout.flowing).toBe(false);
    expect(layout.keyboardScrollable).toBe(false);
  });

  it("alt-piksel farkı (≤1px) taşma sayılmaz", () => {
    const layout = resolveMarqueeLayout({
      copyWidthPx: 601,
      containerWidthPx: 600,
      prefersReducedMotion: false,
    });
    expect(layout.overflows).toBe(false);
  });

  it("1px'ten büyük fark taşmadır", () => {
    const layout = resolveMarqueeLayout({
      copyWidthPx: 602,
      containerWidthPx: 600,
      prefersReducedMotion: false,
    });
    expect(layout.overflows).toBe(true);
  });
});

describe("marqueeDurationSec", () => {
  it("süre genişlikten ve hızdan türetilir", () => {
    expect(marqueeDurationSec(1800, 60)).toBe(30);
    expect(marqueeDurationSec(600, 100)).toBe(22); // alt sınır korunur
  });

  it("geçersiz hızda alt sınır döner (bölme sıfıra düşmez)", () => {
    expect(marqueeDurationSec(1800, 0)).toBe(22);
    expect(marqueeDurationSec(1800, -5)).toBe(22);
    expect(marqueeDurationSec(1800, Number.NaN)).toBe(22);
  });
});
