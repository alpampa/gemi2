"use client";

import { useState, useEffect } from "react";
import { WifiOff, Wifi } from "lucide-react";

/**
 * GERÇEK AĞ KESİNTİSİ DOĞRULAMALI ÇEVRİMDIŞI BANDI (29 EKİM 2026 REFAKTÖRÜ)
 *
 * Kural: Sadece `navigator.onLine === false` bilgisine güvenilmez; gerçekten `/api/version`
 * veya kök sunucuya ulaşılamadığında VE tarayıcı `offline` olayını tetiklediğinde
 * tek satırlık (36px) kompakt iOS/Android sistem çubuğu olarak görünür.
 * Çevrimiçi (Online) durumda 0px yer kaplar.
 */
export function OfflineMarineGuideBanner() {
  const [confirmedOffline, setConfirmedOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    const verifyConnectivity = async () => {
      if (navigator.onLine) {
        if (!cancelled) setConfirmedOffline(false);
        return;
      }
      try {
        const res = await fetch("/manifest.json", { method: "HEAD", cache: "no-store" });
        if (!cancelled) setConfirmedOffline(!res.ok);
      } catch {
        if (!cancelled) setConfirmedOffline(true);
      }
    };

    if (!navigator.onLine) {
      verifyConnectivity();
    }

    const handleOnline = () => {
      if (cancelled) return;
      setConfirmedOffline(false);
      setShowReconnected(true);
      setTimeout(() => {
        if (!cancelled) setShowReconnected(false);
      }, 2800);
    };

    const handleOffline = () => {
      verifyConnectivity();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      cancelled = true;
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (showReconnected) {
    return (
      <div className="bg-emerald-600 text-white px-3 py-1.5 text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-sm z-50">
        <Wifi size={13} />
        <span>Bağlantı kuruldu — Canlı sefer ve meteoroloji verileri güncel.</span>
      </div>
    );
  }

  if (!confirmedOffline) return null;

  return (
    <div className="bg-amber-600/95 text-slate-950 px-3 py-1.5 text-[11px] font-extrabold flex items-center justify-between gap-2 z-50">
      <div className="flex items-center gap-1.5 truncate">
        <WifiOff size={13} className="shrink-0" />
        <span className="truncate">Çevrimdışı Mod — 692 Resmi Sefer Cihaz Hafızasından Çalışıyor</span>
      </div>
      <span className="px-1.5 py-0.5 rounded bg-black/15 text-[9px] font-mono shrink-0">ÇEVRİMDIŞI</span>
    </div>
  );
}
