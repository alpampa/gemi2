"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useThemeStore, type ThemePresetId } from "./useThemeStore";

export type DashboardSkinId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface DashboardSkinMeta {
  id: DashboardSkinId;
  shortName: string;
  title: string;
  tier: "FREE" | "PRO" | "B2B_PRO";
  tierBadge: string;
  aiTrigger: string;
  targetUser: string;
  themePreset: ThemePresetId;
}

export const DASHBOARD_SKINS: DashboardSkinMeta[] = [
  {
    id: 1,
    shortName: "1. Boğaz Komuta ⭐",
    title: "Boğaz Komuta & Kıyı Asistanı (iOS 18 HIG + SBB Hibrit)",
    tier: "FREE",
    tierBadge: "ÜCRETSİZ ANA MOD",
    aiTrigger: "Genel Günlük Kullanım (Varsayılan)",
    targetUser: "Tüm İstanbul Yolcuları (1 Odak Kartı + 4 Alternatif Sefer + Alt İskele Yürüme)",
    themePreset: "deep-navy"
  },
  {
    id: 2,
    shortName: "2. Canlı Harita + Sheet",
    title: "Canlı Harita-Öncelikli & Kademeli Alt Çekmece (Apple Maps / Citymapper)",
    tier: "PRO",
    tierBadge: "👑 VAPUR PRO",
    aiTrigger: "Harita & Gezgin Keşif Modu",
    targetUser: "Görsel Rota Takipçileri & Boğaz/Adalar Gezginleri",
    themePreset: "deep-navy"
  },
  {
    id: 3,
    shortName: "3. İsviçre SBB Güneş",
    title: "İsviçre SBB Yüksek Yoğunluklu Kronometre (14:1 Güneş Işığı Modu)",
    tier: "FREE",
    tierBadge: "ÜCRETSİZ (ERİŞİLEBİLİRLİK)",
    aiTrigger: "☀️ Parlak Öğle Güneşi (>40.000 Lux)",
    targetUser: "Açık Güvertede Doğrudan Güneş Altındaki Yolcular & Hız Odaklı Banliyö",
    themePreset: "sun-contrast"
  },
  {
    id: 4,
    shortName: "4. Android M3 Koşu Modu",
    title: "Material You (Android 15) Turnike & Rıhtım Koşu Asistanı",
    tier: "PRO",
    tierBadge: "👑 VAPUR PRO (AI KOŞU)",
    aiTrigger: "🏃 Sabah/Akşam Mesai + İskele Yürüyüşü (<500m)",
    targetUser: "Vapur İskelesi vs Motor Rıhtımı Arasında Koşan Sabah/Akşam Yolcuları",
    themePreset: "aegean-emerald"
  },
  {
    id: 5,
    shortName: "5. Adalar Çift Yön Kalkan",
    title: "Adalar Gidiş-Dönüş & Gece Son Vapur Kalkanı (Split-Deck Island UI)",
    tier: "PRO",
    tierBadge: "👑 VAPUR PRO (ADA KALKANI)",
    aiTrigger: "🏝️ Adalar Hattı veya Ada Geofence Algılandığında",
    targetUser: "Büyükada, Heybeliada, Burgazada, Kınalıada Sakinleri ve Ziyaretçileri",
    themePreset: "deep-navy"
  },
  {
    id: 6,
    shortName: "6. Boğaz Metro Şeması",
    title: "Boğaz Hattı Dikey Durak Zinciri & 1-Aktarma Köprüsü",
    tier: "FREE",
    tierBadge: "ÜCRETSİZ (BOĞAZ & AKTARMA)",
    aiTrigger: "🔀 Aktarmalı veya Çok Duraklı Boğaz Hattı Seçildiğinde",
    targetUser: "Sarıyer, İstinye, Emirgan, Bebek, Çengelköy, Beykoz ve Aktarmalı Yolcular",
    themePreset: "nordic-clean"
  },
  {
    id: 7,
    shortName: "7. Paşabahçe Kültür Atlası",
    title: "Vapur Kültürü, Tarihi Gemi & Manzara Pusulası (Editorial Luxury)",
    tier: "PRO",
    tierBadge: "👑 VAPUR PRO / TURİST PASS",
    aiTrigger: "🏛️ Kültür Turu, Hafta Sonu veya Yabancı Dil Seçildiğinde",
    targetUser: "Vapur Keyfi Seven İstanbullular, Fotoğrafçılar ve Turistler",
    themePreset: "heritage-brass"
  },
  {
    id: 8,
    shortName: "8. Tek Başparmak (Thumb UI)",
    title: "Tek Başparmak Ergonomisi (Bottom-Heavy Reachability UI)",
    tier: "FREE",
    tierBadge: "ÜCRETSİZ (ERGONOMİ MODU)",
    aiTrigger: "👍 Yürüyüş / İvmeölçer Hareketi Algılandığında",
    targetUser: "Rıhtımda Elinde Çanta/Kahveyle Yürürken Tek Elle Kullananlar",
    themePreset: "deep-navy"
  },
  {
    id: 9,
    shortName: "9. OLED Terminal & Radar",
    title: "FIDS İskele Dijital Pano & OLED Siyah Fırtına Radarı (Bento Grid)",
    tier: "B2B_PRO",
    tierBadge: "👑 PRO & 📺 B2B TV KİOSK",
    aiTrigger: "🌙 Saat 20:00 Sonrası Gece Modu veya Lodos Fırtına (>22kt)",
    targetUser: "Gece Yolcuları, Lodos Takipçileri ve B2B Kafe/Otel/İskele Ekranları",
    themePreset: "cyber-radar"
  },
  {
    id: 10,
    shortName: "10. Deniz + Metro Süper-App",
    title: "Çoklu Mod Entegre Ulaşım Köprüsü (Vapur + Marmaray + Metro + Deniz Taksi)",
    tier: "PRO",
    tierBadge: "👑 VAPUR PRO (SÜPER-APP)",
    aiTrigger: "🚇 Metro/Marmaray Aktarması veya Gece 00:30 Sonrası",
    targetUser: "Deniz + Raylı Sistem Aktarması Yapanlar ve 7/24 Deniz Taksi Yolcuları",
    themePreset: "golden-hour"
  }
];

interface DashboardSkinStoreState {
  activeSkinId: DashboardSkinId;
  aiAutoContext: boolean;
  planTier: "FREE" | "PRO";
  setSkinId: (id: DashboardSkinId) => void;
  setAiAutoContext: (enabled: boolean) => void;
  setPlanTier: (tier: "FREE" | "PRO") => void;
}

export const useDashboardSkinStore = create<DashboardSkinStoreState>()(
  persist(
    (set) => ({
      activeSkinId: 1,
      aiAutoContext: false,
      planTier: "PRO",
      setSkinId: (id: DashboardSkinId) => {
        set({ activeSkinId: id });
        const meta = DASHBOARD_SKINS.find((s) => s.id === id);
        if (meta) {
          useThemeStore.getState().setTheme(meta.themePreset);
        }
      },
      setAiAutoContext: (enabled: boolean) => set({ aiAutoContext: enabled }),
      setPlanTier: (tier: "FREE" | "PRO") => set({ planTier: tier }),
    }),
    {
      name: "vapur-chameleon-skin-storage",
    }
  )
);
