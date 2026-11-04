"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

/**
 * Hydration güvenli "istemcide miyiz" işareti.
 *
 * NEDEN: `const [mounted, setMounted] = useState(false); useEffect(() => setMounted(true))`
 * deseni React Compiler'ın set-state-in-effect kuralını ihlal eder ve Ekstra
 * re-render turu üretir. useSyncExternalStore ile SSR anlık görüntüsü false,
 * istemci anlık görüntüsü true döner; gereksiz ara state ve re-render yok.
 *
 * KULLANIM: Portal/plotlama gibi yalnızca `document` mevcutken güvenli olan
 * render bloklarını `const mounted = useHydrated();` ile koşullayın.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(noopSubscribe, clientSnapshot, serverSnapshot);
}
