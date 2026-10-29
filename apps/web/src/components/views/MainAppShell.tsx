"use client";

import { useState, useEffect, useMemo } from "react";
import { ScheduleListClient } from "@/components/schedule/ScheduleListClient";
import { ChameleonMobileCockpit } from "@/components/cockpit/ChameleonMobileCockpit";
import { DepartureBoardView } from "@/components/views/DepartureBoardView";
import { PiersDirectoryView } from "@/components/views/PiersDirectoryView";
import { MarineWeatherSafetyCenter } from "@/components/views/MarineWeatherSafetyCenter";
import { FavoritesAlarmsView } from "@/components/views/FavoritesAlarmsView";
import { BottomNav } from "@/components/navigation/BottomNav";
import { PreferenceEffects } from "@/components/settings/PreferenceEffects";
import type { ScheduleCardDto } from "@/lib/types/schedule";
import type { MarineWeatherStatus } from "@/lib/services/marine-weather";
import type { SourceFreshnessMeta } from "@/components/trust/ServiceDataTrustBar";

interface MainAppShellProps {
  schedules: ScheduleCardDto[];
  serverTimeIso: string;
  marineWeather?: MarineWeatherStatus | null;
  /** Resmî kaynakların en son doğrulanma üst verisi (sunucudan gelir). */
  sourceFreshness: SourceFreshnessMeta;
}

export function MainAppShell({ schedules, serverTimeIso, marineWeather, sourceFreshness }: MainAppShellProps) {
  const [activeTab, setActiveTab] = useState<string>("schedules");
  const [uiExperienceMode, setUiExperienceMode] = useState<"chameleon" | "classic">("chameleon");
  const [forcedPierFilter, setForcedPierFilter] = useState<string | null>(null);

  const todaySchedules = useMemo(
    () => schedules.filter((s) => s.runsToday !== false),
    [schedules]
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const view = params.get("view");
      if (view === "piers" || view === "weather" || view === "favorites" || view === "schedules" || view === "board") {
        setActiveTab(view);
      }
      if (params.get("ui") === "classic") {
        setUiExperienceMode("classic");
      }
    }
  }, []);

  const handleSelectPierForSchedules = (pierName: string) => {
    setForcedPierFilter(pierName);
    setActiveTab("schedules");
  };

  return (
    <>
      <PreferenceEffects />

      {activeTab === "schedules" && uiExperienceMode === "chameleon" && (
        <ChameleonMobileCockpit
          schedules={schedules}
          serverTimeIso={serverTimeIso}
          marineWeather={marineWeather}
          sourceFreshness={sourceFreshness}
          onSwitchToClassicView={() => setUiExperienceMode("classic")}
          onSelectNavTab={(tab) => setActiveTab(tab)}
        />
      )}

      {activeTab === "schedules" && uiExperienceMode === "classic" && (
        <div>
          <div className="px-3 py-2 bg-sky-950/60 border-b border-sky-500/30 flex items-center justify-between">
            <span className="text-xs font-bold text-sky-200">
              📋 Klasik Arama & Tüm İskeleler Görünümü
            </span>
            <button
              type="button"
              onClick={() => setUiExperienceMode("chameleon")}
              className="px-3 py-1 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-xs"
            >
              🎨 10-Kokpit Mobil Arayüze Dön
            </button>
          </div>
          <ScheduleListClient
            schedules={schedules}
            serverTimeIso={serverTimeIso}
            marineWeather={marineWeather}
            sourceFreshness={sourceFreshness}
            initialOrigin={forcedPierFilter || undefined}
          />
        </div>
      )}

      {activeTab === "board" && (
        <DepartureBoardView
          schedules={todaySchedules}
          serverTimeIso={serverTimeIso}
        />
      )}

      {activeTab === "piers" && (
        <PiersDirectoryView
          schedules={todaySchedules}
          onSelectPierForSchedules={handleSelectPierForSchedules}
        />
      )}

      {activeTab === "weather" && (
        <MarineWeatherSafetyCenter
          weather={marineWeather}
        />
      )}

      {activeTab === "favorites" && (
        <FavoritesAlarmsView
          schedules={todaySchedules}
          serverTimeIso={serverTimeIso}
          onNavigateToSchedules={() => setActiveTab("schedules")}
        />
      )}

      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab !== "schedules") {
            setForcedPierFilter(null);
          }
        }}
      />
    </>
  );
}
