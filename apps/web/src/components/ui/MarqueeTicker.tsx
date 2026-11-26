"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  marqueeDurationSec,
  resolveMarqueeLayout,
} from "@/lib/utils/marquee-policy";

interface MarqueeTickerProps {
  children: ReactNode;
  /** Akış hızı (px/sn) — süre, içerik genişliğinden hesaplanır */
  speedPxPerSec?: number;
  className?: string;
  ariaLabel?: string;
  /**
   * KULLANICI KURALI (dönerli sistem): Kayan içerik BİR TAM TUR attığında
   * çağrılır; akış yoksa (içerik sığıyor / hareket azaltma) fallbackCycleMs
   * sonunda çağrılır. Geri çağrı her turda yeniden kurulur; üst üste
   * çağrılar sıradaki öğeye geçişi tetikler.
   */
  onCycleEnd?: () => void;
  /** Akış olmadığında tur yerine geçen okuma süresi (ms) */
  fallbackCycleMs?: number;
  /**
   * Ölçüm/tur yeniden kurulumunu tetikleyen İÇERİK anahtarı. Üst bant gibi
   * sık yeniden render edilen yerlerde verilmezse her render tur sayacını
   * sıfırlar; verilirse tur yalnızca öğe değişince yeniden başlar.
   */
  cycleKey?: string | number;
}

/**
 * KULLANICI KURALI: İptal seferler ve kritik duyurular TEK SATIRDA akmalıdır.
 *
 * İçerik kapsayıcıya sığmıyorsa kesintisiz döngüyle soldan sağa akar
 * (iki kopya + translateX(-50%), dikişsiz). Sığıyorsa veya kullanıcı
 * "hareketi azalt" tercihindeyse sabit kalır ve elle kaydırılabilir —
 * duyuru bu durumda bile asla gizlenmez.
 */
export function MarqueeTicker({
  children,
  speedPxPerSec = 50,
  className = "",
  ariaLabel,
  onCycleEnd,
  fallbackCycleMs = 9000,
  cycleKey,
}: MarqueeTickerProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  /**
   * İlk (gerçek) kopya. Genişlik ölçümü YALNIZCA buradan yapılır: dikişsiz
   * döngü kopyası koşullu render edildiği için `track.scrollWidth / 2` hesabı
   * kopya sayısına bağımlı olurdu (ölçüm ↔ kopya sayısı salınımı).
   */
  const copyRef = useRef<HTMLDivElement>(null);
  const [flowing, setFlowing] = useState(false);
  /**
   * İçerik kapsayıcıdan geniş mi? Akış (animasyon) kapalıyken kapsayıcı yatay
   * kaydırılabilir hale gelir; klavyeyle erişilemeyen kaydırma bölgesi
   * erişilebilirlik ihlalidir (axe: scrollable-region-focusable). Bu yüzden
   * yalnızca gerçekten taşma varken kapsayıcı odaklanabilir yapılır.
   */
  const [scrollable, setScrollable] = useState(false);
  const [durationSec, setDurationSec] = useState(60);
  // Tur sonu geri çağrısı her commit sonunda tazelenir (bayat closure yok);
  // ref yazımı render sırasında yapılamaz (React Compiler kuralı).
  const onCycleEndRef = useRef<(() => void) | undefined>(onCycleEnd);
  useEffect(() => {
    onCycleEndRef.current = onCycleEnd;
  });
  // cycleKey verilmişse ölçüm yalnızca içerik değişince yeniden yapılır
  const effectiveKey = cycleKey ?? children;

  useEffect(() => {
    const outer = outerRef.current;
    const copy = copyRef.current;
    if (!outer || !copy) return;

    const prefersReduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let cycleTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;
    /** Tur döngüsü: tam tur (akış) veya okuma süresi (sabit) sonunda bildirir
     *  ve bir sonraki turu kurar — üst bantta dönerli firma geçişi sağlar. */
    const scheduleCycle = (shouldFlow: boolean, durSec: number) => {
      if (cancelled || !onCycleEndRef.current) return;
      const ms = shouldFlow ? durSec * 1000 + 350 : fallbackCycleMs;
      cycleTimer = setTimeout(() => {
        if (cancelled) return;
        onCycleEndRef.current?.();
        scheduleCycle(shouldFlow, durSec);
      }, ms);
    };

    const measure = () => {
      // Tek kopya genişliği doğrudan ilk kopyadan okunur (kopya sayısından
      // bağımsız). `track / 2` yaklaşımı koşullu kopyayla salınım üretirdi.
      const layout = resolveMarqueeLayout({
        copyWidthPx: copy.scrollWidth,
        containerWidthPx: outer.clientWidth,
        prefersReducedMotion: prefersReduced,
      });
      // Akış kararı ile taşma durumu ayrı tutulur: "hareketi azalt" tercihinde
      // akış kapalıdır ama içerik taşıyorsa kaydırma bölgesi klavyeyle
      // erişilebilir olmalıdır.
      setScrollable(layout.overflows);
      setFlowing(layout.flowing);
      const durSec = layout.flowing
        ? marqueeDurationSec(copy.scrollWidth, speedPxPerSec)
        : 0;
      if (layout.flowing) setDurationSec(durSec);
      if (cycleTimer) clearTimeout(cycleTimer);
      scheduleCycle(layout.flowing, durSec);
    };

    measure();
    const raf = requestAnimationFrame(measure);

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(measure);
      observer.observe(outer);
      // İçeriğin kendisi de izlenir: web fontu geç yüklendiğinde metin
      // genişler ve yalnızca kapsayıcıyı izlemek bayat ölçümle sonuçlanır
      // (taşan içerik akışsız/kaynaksız kalır).
      observer.observe(copy);
    }
    window.addEventListener("resize", measure);

    return () => {
      cancelled = true;
      if (cycleTimer) clearTimeout(cycleTimer);
      cancelAnimationFrame(raf);
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [effectiveKey, speedPxPerSec, fallbackCycleMs]);

  // Akış kapalıyken içerik taşıyorsa bölge klavyeyle kaydırılabilir olmalı.
  const keyboardScrollable = !flowing && scrollable;

  return (
    <div
      ref={outerRef}
      role={ariaLabel ? "region" : keyboardScrollable ? "group" : undefined}
      aria-label={
        ariaLabel ?? (keyboardScrollable ? "Yatay kaydırılabilir içerik" : undefined)
      }
      tabIndex={keyboardScrollable ? 0 : undefined}
      className={`min-w-0 flex-1 ${
        keyboardScrollable
          ? "overflow-x-auto overflow-y-hidden hide-scrollbar focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          : "overflow-hidden"
      } ${className}`}
      style={
        flowing
          ? {
              maskImage:
                "linear-gradient(to right, transparent, black 16px, black calc(100% - 16px), transparent)",
              WebkitMaskImage:
                "linear-gradient(to right, transparent, black 16px, black calc(100% - 16px), transparent)",
            }
          : undefined
      }
    >
      <div
        ref={trackRef}
        className={`flex w-max items-center ${flowing ? "animate-marquee" : ""}`}
        style={
          flowing
            ? ({ "--marquee-duration": `${durationSec}s` } as CSSProperties)
            : undefined
        }
      >
        <div
          ref={copyRef}
          className="flex shrink-0 items-center gap-4 pr-4 whitespace-nowrap"
        >
          {children}
        </div>
        {/*
          Dikişsiz döngü için ikinci kopya YALNIZCA akış sırasında gerekir.
          Akış yokken ikinci kopya görünür kalırsa (a) içerik gözle görülür
          şekilde çiftlenir, (b) kapsayıcı iki kopya genişliğine taşarak
          gereksiz yatay kaydırma bölgesi üretir. Bu yüzden kopya koşulludur.
        */}
        {flowing && (
          <div
            className="flex shrink-0 items-center gap-4 pr-4 whitespace-nowrap"
            aria-hidden="true"
            inert
          >
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
