"use client";

import { useSyncExternalStore } from "react";

/**
 * URL sorgu parametreleri (client) — render sırasında güvenli.
 *
 * NEDEN: `useEffect(() => { const p = new URLSearchParams(window.location.search); setState(p.get(...)) })`
 * deseni React Compiler'ın set-state-in-effect kuralını ihlal eder ve ilk
 * boyamada yanlış görünüm gösterip sonra düzeltir. URL zaten React dışı bir
 * depo olduğundan `useSyncExternalStore` doğru araçtır:
 * - SSR anlık görüntüsü boş (hidrasyon uyuşmazlığı yok),
 * - istemcide gerçek `location.search`,
 * - geri/ileri gezinmede (popstate) güncellenir.
 *
 * NOT: Next.js `useSearchParams` yerine bilinçli tercih — bu görünümler
 * Suspense sınırı gerektirmeden statik kabuk içinde çalışmaya devam eder.
 */

const subscribe = (callback: () => void) => {
  window.addEventListener("popstate", callback);
  window.addEventListener("pushstate", callback);
  window.addEventListener("replacestate", callback);
  return () => {
    window.removeEventListener("popstate", callback);
    window.removeEventListener("pushstate", callback);
    window.removeEventListener("replacestate", callback);
  };
};

const getSnapshot = () => window.location.search;
const getServerSnapshot = () => "";

export function useUrlSearchParams(): URLSearchParams {
  const search = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return new URLSearchParams(search);
}
