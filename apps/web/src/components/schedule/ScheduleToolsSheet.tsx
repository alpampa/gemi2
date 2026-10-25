"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, SlidersHorizontal, Moon, Compass, LayoutGrid, List, RotateCcw, Calendar, Clock } from "lucide-react";
import { SmartCommutePills } from "@/components/schedule/SmartCommutePills";
import { chipBase, chipOff, chipOn } from "@/lib/ui/button-styles";
import { useLanguageStore } from "@/store/useLanguageStore";

interface ScheduleToolsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentOrigin: string;
  currentDestination: string;
  onSelectRoute: (origin: string, destination: string, category: "ADALAR" | "BOGAZ") => void;
  operators: string[];
  selectedOperator: string;
  onSelectOperator: (op: string) => void;
  onOpenNightGuide: () => void;
  showPlanner: boolean;
  onTogglePlanner: () => void;
  isCompactDensity: boolean;
  onToggleDensity: () => void;
  onClearFilters: () => void;
  selectedDayType?: "TODAY" | "WEEKDAY" | "SATURDAY" | "SUNDAY";
  onSelectDayType?: (day: "TODAY" | "WEEKDAY" | "SATURDAY" | "SUNDAY") => void;
  showAllDay?: boolean;
  onToggleShowAllDay?: () => void;
}

export function ScheduleToolsSheet({
  isOpen,
  onClose,
  currentOrigin,
  currentDestination,
  onSelectRoute,
  operators,
  selectedOperator,
  onSelectOperator,
  onOpenNightGuide,
  showPlanner,
  onTogglePlanner,
  isCompactDensity,
  onToggleDensity,
  onClearFilters,
  selectedDayType = "TODAY",
  onSelectDayType,
  showAllDay = false,
  onToggleShowAllDay,
}: ScheduleToolsSheetProps) {
  const { t } = useLanguageStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ESC tuşu ile kapatma (WCAG 2.1 AA klavye erişilebilirliği)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] overflow-y-auto bg-black/80 backdrop-blur-md p-3 sm:p-4 flex items-end sm:items-center justify-center">
        <div className="fixed inset-0" onClick={onClose} />

        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 24 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 24 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          role="dialog"
          aria-modal="true"
          aria-label={t("filtersTools")}
          className="relative w-full max-w-lg bg-white dark:bg-[#0c1322] border border-slate-300 dark:border-slate-800 rounded-3xl shadow-2xl text-slate-900 dark:text-white z-10 flex flex-col max-h-[88vh] overflow-hidden pb-[max(0px,env(safe-area-inset-bottom))]"
        >
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/60 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md shrink-0">
                <SlidersHorizontal size={20} />
              </div>
              <h3 className="text-sm sm:text-base font-black tracking-tight">{t("filtersTools")}</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("close")}
              className="w-10 h-10 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <X size={18} />
            </button>
          </div>

          <div className="overflow-y-auto px-5 py-4 space-y-5">
            {/* Hızlı Rota Kısayolları */}
            <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 px-3 py-2.5">
              <SmartCommutePills
                currentOrigin={currentOrigin}
                currentDestination={currentDestination}
                onSelectRoute={(origin, destination, category) => {
                  onSelectRoute(origin, destination, category);
                  onClose();
                }}
              />
            </section>

            {/* Gün ve Tarife Seçimi (Ana ekranı işgal etmeyen temiz seçenek) */}
            <section>
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                <Calendar size={13} className="text-blue-500" />
                <span>Tarife Günü İncele</span>
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "TODAY", label: "Bugün (Canlı Seferler)" },
                  { id: "WEEKDAY", label: "Hafta İçi Tarifesi" },
                  { id: "SATURDAY", label: "Cumartesi Tarifesi" },
                  { id: "SUNDAY", label: "Pazar / Tatil Tarifesi" },
                ].map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => {
                      onSelectDayType?.(d.id as any);
                      onClose();
                    }}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                      selectedDayType === d.id
                        ? "bg-blue-600 text-white border-blue-500 shadow-sm"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Operatör Filtresi */}
            <section>
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                {t("operatorLabel")}
              </h4>
              <select
                value={selectedOperator}
                onChange={(e) => onSelectOperator(e.target.value)}
                aria-label={t("operatorLabel")}
                className="w-full min-h-12 px-3 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 appearance-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              >
                <option value="ALL">🏢 {t("allRoutes")}</option>
                {operators.map((op) => (
                  <option key={op} value={op}>{op}</option>
                ))}
              </select>
            </section>

            {/* Görünüm ve Ek Araçlar */}
            <section>
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Görünüm Yoğunluğu & Harita
              </h4>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onToggleDensity}
                  className={`${chipBase} min-h-11 gap-1.5 ${isCompactDensity ? chipOn : chipOff}`}
                  title={isCompactDensity ? "Detaylı Görünüme Geç" : "Özet Görünüme Geç"}
                >
                  {isCompactDensity ? <LayoutGrid size={13} /> : <List size={13} />}
                  <span>{isCompactDensity ? "Özet Görünüm (Kompakt)" : "Detaylı Görünüm"}</span>
                </button>

                {onToggleShowAllDay && (
                  <button
                    type="button"
                    onClick={onToggleShowAllDay}
                    className={`${chipBase} min-h-11 gap-1.5 ${showAllDay ? chipOn : chipOff}`}
                  >
                    <Clock size={13} />
                    <span>{showAllDay ? "Tüm Gün Açık" : "Sadece Yaklaşanlar"}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    onOpenNightGuide();
                    onClose();
                  }}
                  className={`${chipBase} min-h-11 gap-1.5 ${chipOff}`}
                >
                  <Moon size={13} />
                  <span>{t("nightMode")}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onTogglePlanner();
                    onClose();
                  }}
                  aria-pressed={showPlanner}
                  className={`${chipBase} min-h-11 gap-1.5 ${showPlanner ? chipOn : chipOff}`}
                >
                  <Compass size={13} />
                  <span>Aktarma Haritası</span>
                </button>
              </div>
            </section>

            <button
              type="button"
              onClick={onClearFilters}
              className="w-full min-h-11 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <RotateCcw size={13} />
              <span>{t("clear")}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
