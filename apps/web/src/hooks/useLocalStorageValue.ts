"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * localStorage tabanlı dış depo.
 *
 * NEDEN: `useEffect(() => setState(localStorage.getItem(...)))` deseni
 * React Compiler'ın set-state-in-effect kuralını ihlal eder ve gereksiz bir
 * render turu üretir. localStorage zaten React dışı bir depo olduğundan
 * `useSyncExternalStore` doğru araçtır:
 * - SSR anlık görüntüsü null (hidrasyon uyuşmazlığı yok),
 * - istemcide gerçek değer,
 * - aynı sekmedeki yazmalar özel olayla, diğer sekmelerdeki yazmalar
 *   `storage` olayıyla aboneye yayılır.
 */

const LOCAL_STORAGE_EVENT = "vapur:local-storage";

function subscribe(key: string, callback: () => void) {
  const handler = (event: Event) => {
    if (event instanceof StorageEvent && event.key && event.key !== key) return;
    callback();
  };
  window.addEventListener("storage", handler);
  window.addEventListener(LOCAL_STORAGE_EVENT, handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(LOCAL_STORAGE_EVENT, handler);
  };
}

function readValue(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    // Gizli mod / depolama engelli olabilir; değer yokmuş gibi davran.
    return null;
  }
}

/** localStorage değerini abone olarak okur (SSR'de null). */
export function useLocalStorageValue(key: string): string | null {
  const subscribeFn = useCallback((cb: () => void) => subscribe(key, cb), [key]);
  const getSnapshot = useCallback(() => readValue(key), [key]);
  const getServerSnapshot = useCallback(() => null, []);
  return useSyncExternalStore(subscribeFn, getSnapshot, getServerSnapshot);
}

/** localStorage'a yazar ve aynı sekmedeki aboneleri bilgilendirir. */
export function writeLocalStorageValue(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
    window.dispatchEvent(new Event(LOCAL_STORAGE_EVENT));
  } catch {
    // Yazma engelliyse sessizce yut; çağıran akışı bozmamak için.
  }
}

/** localStorage değerini siler ve aynı sekmedeki aboneleri bilgilendirir. */
export function removeLocalStorageValue(key: string): void {
  try {
    window.localStorage.removeItem(key);
    window.dispatchEvent(new Event(LOCAL_STORAGE_EVENT));
  } catch {
    // Silme engelliyse sessizce yut.
  }
}
