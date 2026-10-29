import { MarineWeatherStatus } from "./marine-weather";

/**
 * LODOS & FIRTINA İPTAL TAHMİN MODELİ (Predictive Disruption Engine)
 * 
 * Meteorolojik vektörleri (rüzgar knot, Lodos açısı, sağanak hamlesi, sis)
 * Şehir Hatları ve Adalar operasyonel güvenlik limitleriyle karşılaştırarak
 * hat bazlı iptal olasılığını hesaplar.
 */

export interface DisruptionPrediction {
  cancellationRiskPercent: number; // 0 - 100 (tahmini model çıktısı)
  riskLevel: "DUSUK" | "ORTA" | "YUKSEK" | "KRITIK";
  headline: string;
  recommendation: string;
  affectedCorridors: string[];
  isPredictiveAlertActive: boolean;
  /** Canlı hava verisi var mı? Yoksa hiçbir risk yüzdesi üretilmez. */
  hasWeatherData: boolean;
}

export function predictFerryDisruption(weather?: MarineWeatherStatus | null): DisruptionPrediction {
  // KURAL: Hava verisi yokken "normal" veya "%5 risk" gibi bir sonuç üretilmez.
  // Veri yokluğu, güvenli liman varsayımı değildir.
  if (!weather) {
    return {
      cancellationRiskPercent: 0,
      riskLevel: "DUSUK",
      headline: "Canlı hava verisi alınamadı",
      recommendation:
        "Meteoroloji kaynağına şu anda ulaşılamıyor. Sefer iptalleri için resmî duyuruları kontrol edin.",
      affectedCorridors: [],
      isPredictiveAlertActive: false,
      hasWeatherData: false,
    };
  }

  const { windSpeedKnots, windGustsKnots, windDirectionDeg, visibilityKm, alertType } = weather;

  const isLodos = alertType === "LODOS_WARNING" || (windDirectionDeg >= 195 && windDirectionDeg <= 255);
  const isStorm = alertType === "STORM_WARNING" || windSpeedKnots >= 28 || windGustsKnots >= 35;
  const isFog = alertType === "FOG_WARNING" || (visibilityKm !== undefined && visibilityKm < 1.2);

  let risk = 5; // Base minimum risk
  const affected: string[] = [];

  // 1. Lodos Riski (Adalar ve Güney Marmara hatları için kritik)
  if (isLodos) {
    if (windSpeedKnots >= 24 || windGustsKnots >= 30) {
      risk += 65;
      affected.push("Adalar (Bostancı, Kabataş, Kartal)");
      affected.push("Maltepe - Adalar");
    } else if (windSpeedKnots >= 18 || windGustsKnots >= 22) {
      risk += 35;
      affected.push("Küçük Motor İskeleleri (Dentur, Turyol, Prens Tur)");
    } else {
      risk += 15;
    }
  }

  // 2. Fırtına & Hamle (Tüm hatlar)
  if (isStorm) {
    risk += 45;
    affected.push("Boğaz Hatları (Beşiktaş, Üsküdar, Kadıköy)");
    affected.push("Haliç Hattı");
  }

  // 3. Sis ve Görüş Kısıtı
  if (isFog) {
    risk += 50;
    affected.push("Boğaz Transit Trafiği & Çapraz Hatlar");
  }

  const clampedRisk = Math.min(95, Math.max(5, risk));

  let riskLevel: "DUSUK" | "ORTA" | "YUKSEK" | "KRITIK" = "DUSUK";
  let headline = "Deniz Ulaşımı Elverişli";
  let recommendation = "Tüm hatlarda seferler normal seyrinde planlanmaktadır.";

  if (clampedRisk >= 75) {
    riskLevel = "KRITIK";
    headline = "⚠️ Yüksek İptal Riski — Şiddetli Lodos / Fırtına";
    recommendation = "İskelelere hareket etmeden önce canlı iptal duyurularını kontrol ediniz. Karayolu veya Marmaray alternatifini değerlendiriniz.";
  } else if (clampedRisk >= 45) {
    riskLevel = "YUKSEK";
    headline = "⚡ Muhtemel Sefer Aksaklığı Riski";
    recommendation = "Açık deniz ve Adalar seferlerinde yanaşma gecikmeleri veya kısmi iptaller yaşanabilir.";
  } else if (clampedRisk >= 25) {
    riskLevel = "ORTA";
    headline = "Hafif Deniz Çalkantısı";
    recommendation = "Deniz seferleri icra edilmektedir, ancak küçük teknelerde sallantı hissedilebilir.";
  }

  return {
    cancellationRiskPercent: clampedRisk,
    riskLevel,
    headline,
    recommendation,
    affectedCorridors: Array.from(new Set(affected)),
    isPredictiveAlertActive: clampedRisk >= 40,
    hasWeatherData: true,
  };
}
