"use client";

import { useState } from "react";
import { Moon, ShieldAlert, ChevronRight, Bell, BellRing, Sparkles } from "lucide-react";
import type { ScheduleCardDto } from "@/lib/types/schedule";
import { getIstanbulParts, hhmmToMinutes } from "@/lib/utils/istanbul-time";
import { isIslandRoute } from "@/lib/data/piers";
import { useAlarmStore } from "@/store/useAlarmStore";
import { requestNotificationPermission } from "@/lib/utils/sound";
import { triggerHaptic } from "@/lib/utils/haptics";

interface LastFerrySafeguardBannerProps {
  schedules: ScheduleCardDto[];
  /** Ekranda hâlihazırda görünen seferler — mükerrer duyuru engeli için. */
  visibleSchedules?: ScheduleCardDto[];
  serverTimeIso: string;
  onOpenNightTransit?: () => void;
  selectedOrigin?: string;
  selectedDestination?: string;
}

/**
 * Son Vapuru Kaçırma Asistanı (Last Ferry Safeguard & Return Guarantee)
 * 1. Gece 23:45+ saatlerinde acil "Son Vapur Uyarısı"
 * 2. Adalar rotası seçildiğinde günün son dönüş vapurunu (Şehir Hatları, Mavi Marmara, Prens Tur, İDO)
 *    önceden sabitleyip tek dokunuşla "Son Vapur Alarmı" kurma güvencesi.
 */
export function LastFerrySafeguardBanner({
  schedules,
  visibleSchedules,
  serverTimeIso,
  onOpenNightTransit,
  selectedOrigin,
  selectedDestination,
}: LastFerrySafeguardBannerProps) {
  const { isAlarmSet, toggleAlarm } = useAlarmStore();
  const [alarmJustSet, setAlarmJustSet] = useState(false);

  const serverMs = Date.parse(serverTimeIso) || Date.now();
  const { hour, minute } = getIstanbulParts(serverMs);
  const nowTotalMins = hour < 4 ? (hour + 24) * 60 + minute : hour * 60 + minute;

  const isLateNightWindow = (hour === 23 && minute >= 45) || hour === 0 || hour === 1;

  // 1. Durum: Adadan ana karaya dönüş rotası seçildiyse günün mutlak son vapurunu tespit et
  const isIslandOrigin =
    selectedOrigin &&
    (selectedOrigin.includes("ada") || selectedOrigin === "Büyükada" || selectedOrigin === "Heybeliada" || selectedOrigin === "Burgazada" || selectedOrigin === "Kınalıada");

  const matchingReturnTrips = schedules.filter((s) => {
    if (selectedOrigin && selectedOrigin !== "ALL" && s.origin !== selectedOrigin) return false;
    if (selectedDestination && selectedDestination !== "ALL" && s.destination !== selectedDestination) return false;
    if (!selectedOrigin || selectedOrigin === "ALL") {
      return isIslandRoute(s.origin, s.destination);
    }
    return true;
  });

  // Günün en son kalkan seferi
  const absoluteLastTrip = matchingReturnTrips.reduce<ScheduleCardDto | null>((latest, current) => {
    let mCur = hhmmToMinutes(current.departureTime) ?? 0;
    if (mCur < 4 * 60) mCur += 24 * 60;

    if (!latest) return current;
    let mLat = hhmmToMinutes(latest.departureTime) ?? 0;
    if (mLat < 4 * 60) mLat += 24 * 60;

    return mCur > mLat ? current : latest;
  }, null);

  // Gece 23:45 - 02:00 arasındaki gerçek son seferler (gece acil modu)
  const lateTrips = schedules.filter((s) => {
    const mins = hhmmToMinutes(s.departureTime);
    if (mins == null) return false;
    const normMins = mins < 4 * 60 ? mins + 24 * 60 : mins;
    return normMins >= nowTotalMins && normMins >= 23 * 60 + 45 && normMins <= 26 * 60;
  });

  const finalNightTrip = lateTrips.reduce((earliest, current) => {
    let mEarliest = hhmmToMinutes(earliest.departureTime) ?? 0;
    let mCurrent = hhmmToMinutes(current.departureTime) ?? 0;
    if (mEarliest < 4 * 60) mEarliest += 24 * 60;
    if (mCurrent < 4 * 60) mCurrent += 24 * 60;
    return mCurrent < mEarliest ? current : earliest;
  }, lateTrips[0]);

  const activeTrip = isLateNightWindow ? finalNightTrip : isIslandOrigin ? absoluteLastTrip : null;

  if (!activeTrip) return null;

  // Mükerrer Bilgi Kontrolü
  if (
    !isLateNightWindow &&
    visibleSchedules &&
    visibleSchedules.length > 0 &&
    visibleSchedules[0].id === activeTrip.id
  ) {
    return null;
  }

  const hasAlarm = isAlarmSet(activeTrip.id);

  const handleSetLastTripAlarm = async (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic("medium");
    await requestNotificationPermission();
    toggleAlarm(activeTrip.id);
    setAlarmJustSet(true);
    setTimeout(() => setAlarmJustSet(false), 3000);
  };

  return (
    <div className="fixed inset-x-2 bottom-[calc(5rem_+_env(safe-area-inset-bottom))] z-[45] animate-fadeIn sm:left-auto sm:right-4 sm:w-[min(440px,calc(100%_-_2rem))]">
      <div
        onClick={onOpenNightTransit}
        className={`w-full rounded-xl border px-2.5 py-2 text-white shadow-lg flex items-center justify-between gap-2 transition-all cursor-pointer backdrop-blur-md ${
          isLateNightWindow
            ? "border-rose-500/70 bg-gradient-to-r from-rose-950/80 via-slate-900/90 to-red-950/80 hover:from-rose-900/80"
            : "border-indigo-400/50 bg-gradient-to-r from-indigo-950/80 via-slate-900/90 to-blue-950/80 hover:from-indigo-900/80"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              isLateNightWindow
                ? "bg-rose-500/20 border border-rose-400/40 text-rose-300 animate-pulse"
                : "bg-indigo-500/20 border border-indigo-400/40 text-indigo-300"
            }`}
          >
            {isLateNightWindow ? <Moon size={16} /> : <Sparkles size={16} />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className={`text-[9px] font-black uppercase tracking-wide flex items-center gap-1 truncate ${
                  isLateNightWindow ? "text-rose-300" : "text-cyan-300"
                }`}
              >
                <ShieldAlert size={10} className={`shrink-0 ${isLateNightWindow ? "text-amber-400" : "text-cyan-400"}`} />
                {isLateNightWindow ? "Gece son sefer" : "Adadan son dönüş"}
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/40 text-slate-300 font-mono shrink-0">
                {activeTrip.operator}
              </span>
            </div>
            <p className="text-[10px] font-bold text-slate-200 truncate mt-0.5">
              <strong className="text-amber-300 font-mono">{activeTrip.departureTime}</strong> · {activeTrip.origin} → {activeTrip.destination}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleSetLastTripAlarm}
            title={hasAlarm ? "Son vapur alarmı kurulu" : "Son vapura 45 dk kala hatırlatıcı kur"}
            aria-label={hasAlarm ? "Son vapur alarmı kurulu" : "Son vapur alarmı kur"}
            className={`w-8 h-8 rounded-lg text-[10px] font-black flex items-center justify-center border transition-all cursor-pointer shrink-0 ${
              hasAlarm
                ? "bg-amber-400 text-slate-950 border-amber-300 shadow-sm"
                : "bg-white/10 hover:bg-white/20 text-slate-200 border-white/20"
            }`}
          >
            {hasAlarm ? <BellRing size={12} className="animate-bounce" /> : <Bell size={12} />}
          </button>

          <span title="Gece rehberini aç" className="w-8 h-8 text-[10px] font-black bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shrink-0 flex items-center justify-center">
            <ChevronRight size={14} />
          </span>
        </div>
      </div>
      {alarmJustSet && (
        <div className="text-[10px] text-amber-300 font-bold px-2 pt-1 animate-fadeIn">
          ✓ {activeTrip.departureTime} {activeTrip.origin} → {activeTrip.destination} son vapuruna hatırlatıcı kuruldu!
        </div>
      )}
    </div>
  );
}
