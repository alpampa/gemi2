"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Palette, Check, Sparkles, CheckCircle2, Smartphone, Crown } from "lucide-react";
import { useThemeStore, THEME_PRESETS, ThemePresetId } from "@/store/useThemeStore";
import { useDashboardSkinStore, DASHBOARD_SKINS, DashboardSkinId } from "@/store/useDashboardSkinStore";
import { useLanguageStore } from "@/store/useLanguageStore";

interface ThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ThemeSelectorModal({ isOpen, onClose }: ThemeSelectorModalProps) {
  const { theme, setTheme } = useThemeStore();
  const { activeSkinId, aiAutoContext, planTier, setSkinId, setAiAutoContext, setPlanTier } = useDashboardSkinStore();
  const { language } = useLanguageStore();
  const [selectedId, setSelectedId] = useState<ThemePresetId>(theme);
  const [activeTab, setActiveTab] = useState<"cockpits" | "palettes">("cockpits");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleSelectTheme = (id: ThemePresetId) => {
    setSelectedId(id);
    setTheme(id);
  };

  const handleSelectSkin = (id: DashboardSkinId) => {
    setSkinId(id);
    const meta = DASHBOARD_SKINS.find((s) => s.id === id);
    if (meta) setSelectedId(meta.themePreset);
  };

  const handleConfirmAndClose = () => {
    setTheme(selectedId);
    onClose();
  };

  const activePreset = THEME_PRESETS.find((p) => p.id === selectedId) || THEME_PRESETS[0];
  const activeSkin = DASHBOARD_SKINS.find((s) => s.id === activeSkinId) || DASHBOARD_SKINS[0];

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] overflow-y-auto bg-black/80 backdrop-blur-md p-3 sm:p-4 flex min-h-full items-start sm:items-center justify-center">
        <div className="fixed inset-0" onClick={handleConfirmAndClose} />

        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 10 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative my-auto w-full max-w-2xl bg-white dark:bg-[#0c1322] border border-slate-300 dark:border-slate-800 rounded-3xl shadow-2xl text-slate-900 dark:text-white z-10 flex flex-col max-h-[90vh] overflow-hidden"
        >
          {/* 1. ÜST BAŞLIK & SEKME GEÇİŞİ */}
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/60 shrink-0 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-amber-500 text-white flex items-center justify-center font-black shadow-md shrink-0">
                  <Smartphone size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-black tracking-tight text-slate-900 dark:text-white">
                      CHAMELEON 10 MOBİL KOKPİT & TEMA MOTORU
                    </h3>
                    <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                      iOS 18 & Android 15
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                    {language === "en"
                      ? "Switch between 10 adaptive mobile dashboard architectures or 7 color palettes."
                      : "Tek veri çekirdeği üzerinde 10 farklı mobil kokpit mimarisi veya 7 renk paleti seçin."}
                  </p>
                </div>
              </div>

              <button
                onClick={handleConfirmAndClose}
                className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors shrink-0"
                title="Kapat"
              >
                <X size={16} />
              </button>
            </div>

            {/* Sekmeler + AI Bağlam + Freemium/Pro Anahtarı */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex p-1 rounded-xl bg-slate-200 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab("cockpits")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                    activeTab === "cockpits"
                      ? "bg-blue-600 text-white shadow"
                      : "text-slate-600 dark:text-slate-300"
                  }`}
                >
                  🔟 10 Mobil Kokpit Arayüzü
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("palettes")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                    activeTab === "palettes"
                      ? "bg-blue-600 text-white shadow"
                      : "text-slate-600 dark:text-slate-300"
                  }`}
                >
                  🎨 7 Renk Paleti
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setAiAutoContext(!aiAutoContext)}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-black border transition-all flex items-center gap-1 ${
                    aiAutoContext
                      ? "bg-indigo-600 text-white border-indigo-400"
                      : "bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                  }`}
                >
                  <Sparkles size={12} />
                  <span>AI Oto-Arayüz: {aiAutoContext ? "AÇIK" : "Kapalı"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPlanTier(planTier === "PRO" ? "FREE" : "PRO")}
                  className="px-2.5 py-1.5 rounded-xl text-[11px] font-black bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 flex items-center gap-1"
                >
                  <Crown size={12} />
                  <span>Plan: {planTier === "PRO" ? "VAPUR PRO" : "ÜCRETSİZ"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* 2. ORTA BÖLÜM: 10 KOKPİT ARAYÜZÜ VEYA 7 RENK PALETİ */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
            {activeTab === "cockpits" ? (
              <div className="space-y-2.5">
                <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    💡 10 arayüzün tamamını yan yana ve iOS 18 / Android 15 canlı simülatöründe tam ekran deneyimlemek için:
                  </div>
                  <a
                    href="/canli-mobil-uygulama.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shrink-0 text-center shadow"
                  >
                    📱 10 Arayüz Canlı Stüdyoyu Aç ↗
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {DASHBOARD_SKINS.map((skin) => {
                    const isSelected = activeSkinId === skin.id;
                    const isFree = skin.tier === "FREE";
                    return (
                      <div
                        key={skin.id}
                        onClick={() => handleSelectSkin(skin.id)}
                        className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-2 ${
                          isSelected
                            ? "ring-2 ring-blue-500 border-blue-500 bg-blue-50/60 dark:bg-blue-950/50 shadow-md"
                            : "border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1.5 mb-1">
                            <span className="text-xs font-black text-slate-900 dark:text-white">
                              {skin.shortName}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-extrabold ${
                                isFree
                                  ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                                  : "bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                              }`}
                            >
                              {skin.tierBadge}
                            </span>
                          </div>
                          <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 leading-snug">
                            {skin.title}
                          </p>
                          <p className="text-[10px] font-mono text-indigo-600 dark:text-indigo-300 mt-1">
                            🤖 AI: {skin.aiTrigger}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800/80 text-[10px]">
                          <span className="text-slate-500 dark:text-slate-400 truncate max-w-[180px]">
                            {skin.targetUser}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full font-black ${
                              isSelected
                                ? "bg-blue-600 text-white"
                                : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            {isSelected ? "AKTİF" : "Seç"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {THEME_PRESETS.map((preset) => {
                  const isSelected = selectedId === preset.id;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => handleSelectTheme(preset.id)}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-150 flex flex-col justify-between gap-3 text-left relative group ${
                        isSelected
                          ? "ring-2 ring-blue-500 border-blue-500 bg-blue-50/60 dark:bg-blue-950/50 shadow-md scale-[1.01]"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40"
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-tight">
                            {language === "en" ? preset.nameEn : preset.name}
                          </span>
                          {isSelected ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-black shrink-0 shadow-xs">
                              <Check size={11} />
                              <span>AKTİF</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400">Seç</span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug font-medium">
                          {preset.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2.5 border-t border-slate-200 dark:border-slate-800/80">
                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            preset.isDark
                              ? "bg-slate-900 text-slate-200 dark:bg-slate-800"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                          }`}
                        >
                          {preset.isDark ? "🌙 Gece / Koyu" : "☀️ Gündüz / Aydınlık"}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {preset.previewColors.map((color, cIdx) => (
                            <span
                              key={cIdx}
                              className="w-4 h-4 rounded-full border border-black/20 shadow-2xs"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. SABİT ALT ONAY BÖLÜMÜ */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 w-full sm:w-auto justify-center sm:justify-start">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              <span>
                Aktif Kokpit: <strong className="text-slate-900 dark:text-white">{activeSkin.shortName}</strong> ({activePreset.name})
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleConfirmAndClose}
                className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Check size={16} />
                <span>KOKPİTİ & TEMAYI UYGULA</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
