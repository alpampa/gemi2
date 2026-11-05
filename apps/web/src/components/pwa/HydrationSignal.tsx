"use client";

import { useEffect } from "react";

/**
 * Hidrasyon tamamlandığında `<html data-hydrated="true">` işaretini koyar.
 *
 * NEDEN: E2E testleri tıklamadan önce arayüzün GERÇEKTEN etkileşimli olduğunu
 * bilmek zorunda. Sabit `waitForTimeout` yetersiz: 17k düğümlü ana sayfa yoğun
 * yük altında (3 paralel worker) saniyeler sonra hidrasyonu bitirebiliyor ve
 * sabit süre dolduğunda tıklama handler'sız yapılıyor — test "tıkladım ama
 * hiçbir şey olmadı" diye sebepsiz düşüyordu. Bu işaret, beklemeyi zamana değil
 * gerçek duruma bağlar.
 *
 * ÜRETİM ETKİSİ: Tek bir `data-*` niteliği; davranış, görünüm veya ağ maliyeti
 * yok. Nitelik, React bağlanmadan önce (SSR HTML'inde) bulunmaz.
 */
export function HydrationSignal() {
  useEffect(() => {
    document.documentElement.dataset.hydrated = "true";
    return () => {
      delete document.documentElement.dataset.hydrated;
    };
  }, []);

  return null;
}
