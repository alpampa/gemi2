"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Modal/çekmece erişilebilirliği — tek kaynak:
 *  1. Açılınca odağı modal içine taşır (varsa `initialFocusRef`).
 *  2. Tab/Shift+Tab ile odağı modal içinde tutar (focus trap).
 *  3. Esc ile kapatır.
 *  4. Android donanım geri tuşu: açılışta history.pushState, popstate'te kapatır.
 *  5. Kapanınca odağı, açan öğeye geri verir ve geçici history kaydını temizler.
 *
 * ÖNEMLİ: `onClose` sıklıkla satır-arı işlev olarak geçilir; etkileşim 1 saniyelik
 * saat re-render'larında yeniden bağlanmamalı. Bu yüzden geri çağrı ref'te tutulur,
 * effect yalnızca `isOpen` (ve `initialFocusRef`) değişince yeniden kurulur.
 *
 * iOS standalone PWA'da tarayıcı geri tuşu yoktur; bu yüzden her modalde
 * GÖRÜNÜR bir kapatma butonu ayrıca bulunmalıdır (bu hook bunu sağlamaz).
 */
export function useModalA11y(
  isOpen: boolean,
  onClose: () => void,
  initialFocusRef?: React.RefObject<HTMLElement | null>,
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const pushedRef = useRef(false);
  const onCloseRef = useRef(onClose);
  // Ref yazımı render sırasında yapılamaz (React Compiler kuralı);
  // her commit sonunda tazelenir, bayat closure kalmaz.
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!isOpen) return;

    restoreFocusRef.current = document.activeElement as HTMLElement | null;

    const handlePopState = () => {
      pushedRef.current = false;
      onCloseRef.current();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const container = containerRef.current;
      if (!container) return;
      const nodes = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (n) => n.offsetParent !== null || n === document.activeElement,
      );
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !container.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    try {
      window.history.pushState({ __vapurModal: true }, "");
      pushedRef.current = true;
    } catch {
      pushedRef.current = false;
    }

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("keydown", handleKeyDown);

    const focusTimer = window.setTimeout(() => {
      const target =
        initialFocusRef?.current ??
        containerRef.current?.querySelector<HTMLElement>(FOCUSABLE);
      target?.focus();
    }, 0);

    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("keydown", handleKeyDown);
      if (pushedRef.current) {
        pushedRef.current = false;
        // Kapanışta kendi pushState kaydımızı geri al (popstate zincirine
        // ekstra onClose tetiklemesi olmadan).
        window.history.replaceState(null, "");
      }
      restoreFocusRef.current?.focus?.();
    };
  }, [isOpen, initialFocusRef]);

  return containerRef;
}
