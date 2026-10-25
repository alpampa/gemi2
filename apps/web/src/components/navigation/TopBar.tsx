"use client";

import { Ship, Clock, Settings, RotateCcw } from "lucide-react";
import { SettingsSheet } from "@/components/settings/SettingsSheet";
import { purgeAllCachesAndReload } from "@/components/pwa/ServiceWorkerRegister";
import { SUPPORTED_LANGUAGES } from "@/store/useLanguageStore";
import { useState } from "react";
import { useLanguageStore } from "@/store/useLanguageStore";
import { useTransitClock } from "@/hooks/useTransitClock";

// Modül seviyesinde önbelleklenmiş formatter'lar
const TIME_FMT = {
  tr: new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }),
  en: new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Istanbul", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }),
} as const;
const DATE_FMT = {
  tr: new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", weekday: "short", day: "numeric", month: "short" }),
  en: new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Istanbul", weekday: "short", day: "numeric", month: "short" }),
} as const;

export function TopBar() {
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const { language, toggleLanguage } = useLanguageStore();

  const { nowMs } = useTransitClock();
  const lang = language === "en" ? "en" : "tr";
  const timeStr = TIME_FMT[lang].format(nowMs);
  const dateStr = DATE_FMT[lang].format(nowMs);

  return (
    <header className="px-3 sm:px-4 py-1.5 pt-[max(6px,env(safe-area-inset-top))] bg-white/95 dark:bg-[#070e1e]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 shadow-xs flex items-center justify-between transition-colors duration-150">
      {/* SOL: VAPUR LOGO & BAŞLIK */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="bg-linear-to-br from-blue-600 to-indigo-600 p-1.5 rounded-lg flex items-center justify-center text-white shrink-0">
          <Ship size={15} />
        </div>
        <h1 className="font-black text-sm tracking-wider text-slate-900 dark:text-white uppercase leading-none">
          VAPUR
        </h1>
      </div>

      {/* SAĞ: CANLI SAAT (TR SAATİ) + DİL + AYARLAR */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100">
          <Clock size={12} className="text-blue-500 shrink-0" />
          <span suppressHydrationWarning className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold hidden xs:inline">
            {dateStr}
          </span>
          <span suppressHydrationWarning className="font-mono font-bold text-xs tabular-nums text-slate-900 dark:text-white">
            {timeStr}
          </span>
        </div>

        {/* Dil Seçici */}
        <button
          type="button"
          onClick={toggleLanguage}
          title={`Aktif Dil: ${language.toUpperCase()}`}
          aria-label="Dili değiştir"
          className="h-7 px-2 rounded-lg text-xs font-black transition-all border flex items-center justify-center gap-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer active:scale-95"
        >
          <span className="text-xs">{SUPPORTED_LANGUAGES.find((l) => l.code === language)?.flag || "🌐"}</span>
          <span className="text-[10px] font-mono">{language.toUpperCase()}</span>
        </button>

        {/* Ayarlar */}
        <button
          type="button"
          onClick={() => setIsSettingsOpen(true)}
          title="Ayarlar"
          aria-label="Ayarlar"
          className="w-7 h-7 rounded-lg text-xs font-black transition-all border flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer active:scale-95"
        >
          <Settings size={13} />
        </button>

        {/* Önbelleği Temizle & Yenile */}
        <button
          type="button"
          onClick={purgeAllCachesAndReload}
          title="Yenile"
          aria-label="Sayfayı yenile"
          className="w-7 h-7 rounded-lg text-xs font-black transition-all border flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 cursor-pointer active:scale-95"
        >
          <RotateCcw size={12} />
        </button>
      </div>

      <SettingsSheet isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </header>
  );
}
