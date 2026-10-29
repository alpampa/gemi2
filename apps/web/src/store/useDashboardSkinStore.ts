"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useThemeStore, type ThemePresetId } from "./useThemeStore";

export type DashboardSkinId = 1 | 2 | 3 | 4 | 5;

export interface DashboardSkinMeta {
  id: DashboardSkinId;
  name: string;
  summary: string;
  bestFor: string;
  tag: string;
  themePreset: ThemePresetId;
}

/**
 * İSTANBUL ODAKLI 5 GÖRÜNÜM MODU
 *
 * 10 kokpitlik deneme, tek veri çekirdeği üzerinde yalnızca renk değiştirdiği
 * için kullanıcıya gerçek bir fayda sağlamıyordu. Burada her mod, İstanbul'da
 * gerçekten farklı bir kullanım bağlamına karşılık gelir:
 *
 * 1) Standart / Boğaz  → günlük commuter, dengeli varsayılan
 * 2) Gün Işığı         → güneş altında okunabilirlik + düşük görüş
 * 3) Gece / OLED       → gece yolculuğu, düşük parlama, pil tasarrufu
 * 4) Adalar            → ada sakini, son dönüş vapuru odağı
 * 5) Kültür & Turist   → tarihi vapur kültürü, turist ve çok dilli kullanım
 */
export const DASHBOARD_SKINS: DashboardSkinMeta[] = [
  {
    id: 1,
    name: "Standart / Boğaz",
    summary: "Dengeli lacivert tema; günlük sefer takibi için sade görünüm.",
    bestFor: "Tüm İstanbul yolcuları, sabah-akşam commuter",
    tag: "Varsayılan",
    themePreset: "deep-navy",
  },
  {
    id: 2,
    name: "Gün Işığı & Erişilebilir",
    summary: "Yüksek kontrast, açık zemin ve büyük yazı; güneş altında ve az görenler için.",
    bestFor: "Güvertede oturanlar, 65+ ve az gören kullanıcılar",
    tag: "Gündüz",
    themePreset: "sun-contrast",
  },
  {
    id: 3,
    name: "Gece / OLED",
    summary: "Siyah zemin ve düşük parlama; gece ile fırtına takibi için.",
    bestFor: "Gece yolcuları ve pil tasarrufu isteyenler",
    tag: "Gece",
    themePreset: "cyber-radar",
  },
  {
    id: 4,
    name: "Adalar / Son Vapur",
    summary: "Ada hattı ve son dönüş odağı; sakin Ege denizi tonları.",
    bestFor: "Büyükada, Heybeliada, Burgazada, Kınalıada sakinleri",
    tag: "Adalar",
    themePreset: "aegean-emerald",
  },
  {
    id: 5,
    name: "Kültür & Turist",
    summary: "Tarihi vapur hissi ve sıcak pirinç tonları; çok dilli içerikle uyumlu.",
    bestFor: "Turistler, vapur kültürü ve fotoğraf meraklıları",
    tag: "Turist",
    themePreset: "heritage-brass",
  },
];

interface DashboardSkinStoreState {
  activeSkinId: DashboardSkinId;
  setSkinId: (id: DashboardSkinId) => void;
}

const isValidSkinId = (value: unknown): value is DashboardSkinId =>
  DASHBOARD_SKINS.some((skin) => skin.id === value);

export const useDashboardSkinStore = create<DashboardSkinStoreState>()(
  persist(
    (set) => ({
      activeSkinId: 1,
      setSkinId: (id: DashboardSkinId) => {
        set({ activeSkinId: id });
        const meta = DASHBOARD_SKINS.find((skin) => skin.id === id);
        if (meta) {
          useThemeStore.getState().setTheme(meta.themePreset);
        }
      },
    }),
    {
      name: "vapur-chameleon-skin-storage",
      version: 2,
      migrate: (persistedState: unknown) => {
        const stored = persistedState as { activeSkinId?: unknown } | undefined;
        return {
          activeSkinId: isValidSkinId(stored?.activeSkinId) ? stored.activeSkinId : 1,
        };
      },
    }
  )
);
