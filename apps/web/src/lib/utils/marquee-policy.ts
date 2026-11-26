/**
 * Kayan şerit (marquee) yerleşim politikası — saf karar fonksiyonları.
 *
 * NEDEN AYRI MODÜL: bileşen içindeki karar `useEffect` + `ResizeObserver` +
 * ölçüm gerektiriyordu; bu yüzden "hareketi azalt" ve taşma davranışı yalnızca
 * tarayıcıda (axe taramasıyla dolaylı olarak) doğrulanabiliyordu. Karar buraya
 * taşındığında sözleşme birim testiyle kilitlenir; bileşen yalnızca ölçüm
 * yapar ve sonucu uygular.
 *
 * SÖZLEŞME:
 * - İçerik sığıyorsa ne akış ne kaydırma vardır (içerik olduğu gibi görünür).
 * - İçerik taşıyor ve hareket kısıtı YOKSA akış (animasyon) çalışır; kapsayıcı
 *   kaydırma bölgesi DEĞİLDİR (aksi halde iki ayrı gezinme modeli çakışır).
 * - İçerik taşıyor ve "hareketi azalt" tercihi VARSA akış durur; içerik yine
 *   erişilebilir olmalıdır → bölge klavyeyle kaydırılabilir (odaklanabilir)
 *   hale gelir. Bu, axe `scrollable-region-focusable` kuralının karşılığıdır.
 */

/** Aynı düzeni koruyan alt-piksel yuvarlama payı (px). */
const OVERFLOW_TOLERANCE_PX = 1;

/** Akışın bir turu için izin verilen en kısa süre (sn). */
const MIN_DURATION_SEC = 22;

export interface MarqueeMeasurement {
  /** İçeriğin TEK kopyasının genişliği (px). */
  copyWidthPx: number;
  /** Görünür kapsayıcının genişliği (px). */
  containerWidthPx: number;
  /** `prefers-reduced-motion: reduce` tercihi. */
  prefersReducedMotion: boolean;
}

export interface MarqueeLayout {
  /** Tek kopya kapsayıcıdan geniş mi? */
  overflows: boolean;
  /** Animasyonlu akış çalışıyor mu? */
  flowing: boolean;
  /** Akış yokken içerik klavyeyle kaydırılabilir mi? */
  keyboardScrollable: boolean;
}

export function resolveMarqueeLayout(measurement: MarqueeMeasurement): MarqueeLayout {
  const { copyWidthPx, containerWidthPx, prefersReducedMotion } = measurement;
  const overflows = copyWidthPx > containerWidthPx + OVERFLOW_TOLERANCE_PX;
  const flowing = overflows && !prefersReducedMotion;
  return {
    overflows,
    flowing,
    keyboardScrollable: overflows && !flowing,
  };
}

/** Bir tam tur süresi (sn) — hız sabit, süre içerik genişliğinden türetilir. */
export function marqueeDurationSec(copyWidthPx: number, speedPxPerSec: number): number {
  if (!Number.isFinite(speedPxPerSec) || speedPxPerSec <= 0) return MIN_DURATION_SEC;
  return Math.max(MIN_DURATION_SEC, Math.round(copyWidthPx / speedPxPerSec));
}
