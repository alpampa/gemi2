"use client";

import { useMemo, useState } from "react";
import {
  Sparkles,
  Palette,
  LayoutGrid,
  List,
  Ship,
  MapPin,
  CloudSun,
  Bot,
} from "lucide-react";
import { ScheduleListClient } from "@/components/schedule/ScheduleListClient";
import { ThemeSelectorModal } from "@/components/theme/ThemeSelectorModal";
import { useDashboardSkinStore, DASHBOARD_SKINS } from "@/store/useDashboardSkinStore";
import type { ScheduleCardDto } from "@/lib/types/schedule";
import type { MarineWeatherStatus } from "@/lib/services/marine-weather";
import type { SourceFreshnessMeta } from "@/components/trust/ServiceDataTrustBar";

interface ChameleonMobileCockpitProps {
  schedules: ScheduleCardDto[];
  serverTimeIso: string;
  marineWeather?: MarineWeatherStatus | null;
  sourceFreshness: SourceFreshnessMeta;
  onSwitchToClassicView: () => void;
  onSelectNavTab: (tab: string) => void;
}

/**
 * CHAMELEON MOBILE COCKPIT
 *
 * Tek kanonik veri çekirdeği (ScheduleListClient) + seçilebilir kokpit
 * kişiselleştirmesi. Kokpit seçimi yalnızca tema/palet ve öncelikleri
 * değiştirir; hiçbir sefer, duyuru veya hava verisi arayüz içinde yeniden
 * üretilmez. Böylece "sıfır veri duplikasyonu" korunur.
 */
export function ChameleonMobileCockpit({
  schedules,
  serverTimeIso,
  marineWeather,
  sourceFreshness,
  onSwitchToClassicView,
  onSelectNavTab,
}: ChameleonMobileCockpitProps) {
  const { activeSkinId, aiAutoContext, setSkinId, setAiAutoContext } = useDashboardSkinStore();
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  const activeSkin = useMemo(
    () => DASHBOARD_SKINS.find((s) => s.id === activeSkinId) ?? DASHBOARD_SKINS[0],
    [activeSkinId]
  );

  return (
    <div className="pb-24">
      <div className="px-3 pt-2 pb-1.5 bg-gradient-to-b from-[#0a1428] to-[#0a1428]/95 text-white border-b border-cyan-500/25">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <Sparkles size={13} className="text-cyan-300 shrink-0" />
              <span className="text-[10px] font-black uppercase tracking-[0.14em] text-cyan-300">
                Chameleon Kokpit
              </span>
            </div>
            <div className="truncate text-xs font-extrabold mt-0.5">
              {activeSkin.shortName}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setAiAutoContext(!aiAutoContext)}
              aria-pressed={aiAutoContext}
              className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black flex items-center gap-1 border transition-colors ${
                aiAutoContext
                  ? "bg-cyan-500 text-slate-950 border-cyan-300"
                  : "bg-white/5 text-slate-200 border-white/15"
              }`}
            >
              <Bot size={12} />
              OTO
            </button>
            <button
              type="button"
              onClick={() => setIsPaletteOpen(true)}
              className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-100 border border-white/15 text-[10px] font-black flex items-center gap-1"
            >
              <Palette size={12} />
              TEMA
            </button>
            <button
              type="button"
              onClick={onSwitchToClassicView}
              className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-100 border border-white/15 text-[10px] font-black flex items-center gap-1"
            >
              <List size={12} />
              KLASİK
            </button>
          </div>
        </div>

        <div className="mt-1.5 -mx-1 overflow-x-auto">
          <div className="flex items-center gap-1 px-1 pb-0.5">
            {DASHBOARD_SKINS.map((skin) => (
              <button
                key={skin.id}
                type="button"
                onClick={() => setSkinId(skin.id)}
                aria-pressed={skin.id === activeSkinId}
                className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-black border transition-colors ${
                  skin.id === activeSkinId
                    ? "bg-cyan-400 text-slate-950 border-cyan-200"
                    : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
                }`}
              >
                {skin.id}. {skin.tier === "FREE" ? "Ücretsiz" : skin.tier === "PRO" ? "PRO" : "B2B"}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-1 grid grid-cols-3 gap-1">
          <button
            type="button"
            onClick={() => onSelectNavTab("board")}
            className="py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold flex items-center justify-center gap-1"
          >
            <LayoutGrid size={11} className="text-cyan-300" />
            Pano
          </button>
          <button
            type="button"
            onClick={() => onSelectNavTab("piers")}
            className="py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold flex items-center justify-center gap-1"
          >
            <MapPin size={11} className="text-emerald-300" />
            İskeleler
          </button>
          <button
            type="button"
            onClick={() => onSelectNavTab("weather")}
            className="py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold flex items-center justify-center gap-1"
          >
            <CloudSun size={11} className="text-amber-300" />
            Deniz Hava
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] text-slate-400 bg-slate-950/40 border-b border-white/5">
        <Ship size={11} className="text-cyan-400 shrink-0" />
        <span className="truncate">{activeSkin.title}</span>
      </div>

      <ScheduleListClient
        schedules={schedules}
        serverTimeIso={serverTimeIso}
        marineWeather={marineWeather}
        sourceFreshness={sourceFreshness}
      />

      <ThemeSelectorModal isOpen={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} />
    </div>
  );
}
