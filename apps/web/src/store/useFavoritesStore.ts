"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

function normalizeRouteKey(key: string): string {
  return key.replace(/➔/g, "→");
}

interface FavoritesState {
  favorites: string[]; // array of route keys: "Kadıköy → Karaköy"
  toggleFavorite: (routeKey: string) => boolean;
  isFavorite: (routeKey: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      toggleFavorite: (rawKey: string) => {
        const routeKey = normalizeRouteKey(rawKey);
        const current = get().favorites.map(normalizeRouteKey);
        const exists = current.includes(routeKey);
        const next = exists
          ? current.filter(r => r !== routeKey)
          : [...current, routeKey];

        set({ favorites: next });
        return !exists;
      },
      isFavorite: (rawKey: string) => {
        const routeKey = normalizeRouteKey(rawKey);
        return get().favorites.map(normalizeRouteKey).includes(routeKey);
      }
    }),
    {
      name: 'vapur_favorites_v1',
      onRehydrateStorage: () => (state) => {
        if (state && Array.isArray(state.favorites)) {
          // Bunlar daha önce kullanıcı kaydı olmadan eklenen örnek kısayollardı.
          // Başka hatırlara dokunmadan yalnızca bu hazır önerileri kaldır.
          state.favorites = state.favorites
            .map(normalizeRouteKey)
            .filter((route) => route !== "Kadıköy → Karaköy" && route !== "Kabataş → Büyükada");
        }
      }
    }
  )
);
