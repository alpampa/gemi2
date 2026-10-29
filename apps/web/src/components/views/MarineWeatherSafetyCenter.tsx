"use client";

import { Wind, Waves, Eye, Thermometer, AlertTriangle, Info, ExternalLink, ShieldAlert } from "lucide-react";
import type { MarineWeatherStatus } from "@/lib/services/marine-weather";
import { calculateMaritimeLinesRisk } from "@/lib/services/marine-weather";

interface MarineWeatherSafetyCenterProps {
  weather?: MarineWeatherStatus | null;
}

function formatObservedAt(value?: string): string | null {
  if (!value) return null;
  const timePart = value.split("T")[1];
  if (!timePart) return null;
  return timePart.slice(0, 5);
}

export function MarineWeatherSafetyCenter({ weather }: MarineWeatherSafetyCenterProps) {
  const isStorm = weather?.isFerryDisruptionRisk || false;
  const lineRisks = calculateMaritimeLinesRisk(weather);
  const observedAt = formatObservedAt(weather?.observedAt);
  const hasMarineData =
    weather?.waveHeightM != null || weather?.seaTemperatureC != null;

  return (
    <div className="px-3 py-3 max-w-4xl mx-auto space-y-4 animate-fadeIn pb-24">
      {/* Hero Marine Weather HUD */}
      <div className="bg-gradient-to-br from-slate-900 via-[#0a1329] to-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 text-white shadow-xl">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 shadow-lg">
              <Waves size={24} className={weather ? "animate-pulse" : ""} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  BOĞAZ & MARMARA DENİZ METEOROLOJİSİ
                </h2>
                <span className="text-[10px] font-mono bg-cyan-950 text-cyan-400 border border-cyan-800 px-2 py-0.5 rounded-full font-bold">
                  KAYNAK: OPEN-METEO
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                İstanbul Boğazı ve Adalar hattı için canlı rüzgar, sıcaklık, görüş ve dalga verisi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-xs text-right">
              <span className="text-[9px] text-slate-500 block uppercase font-bold">
                {observedAt ? `Gözlem ${observedAt}` : "Gözlem"}
              </span>
              {weather ? (
                <strong className="text-cyan-300 font-bold">{weather.temperature}°C</strong>
              ) : (
                <strong className="text-amber-300 font-bold">Veri yok</strong>
              )}
            </div>
          </div>
        </div>

        {/* Veri yok durumu: uydurma değer gösterme */}
        {!weather && (
          <div className="mt-3 p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-100 text-xs font-bold flex items-start gap-2.5">
            <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-black">Canlı hava verisi şu anda alınamıyor.</p>
              <p className="font-medium text-amber-200/90 leading-snug">
                Meteoroloji kaynağına ulaşılamadığı için sıcaklık, rüzgar ve görüş değerleri
                gösterilmiyor. Bu durum “deniz sakin” anlamına gelmez; sefer iptalleri için resmî
                duyuruları kontrol edin.
              </p>
            </div>
          </div>
        )}

        {/* Lodos Storm Warning */}
        {isStorm && weather && (
          <div className="mt-3 p-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs font-bold flex items-center gap-2.5 animate-pulse">
            <AlertTriangle size={18} className="text-amber-400 shrink-0" />
            <span>
              {weather.alertTitle}: {weather.alertDescription}
            </span>
          </div>
        )}

        {/* 4 Telemetry Gauges — yalnızca gerçek veri varsa */}
        {weather && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
              <div className="flex items-center gap-2 text-sky-400 text-xs font-bold mb-1">
                <Wind size={15} />
                <span>Rüzgar</span>
              </div>
              <div className="text-sm sm:text-base font-black text-white font-mono">
                {weather.windSpeedKnots} kt
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {weather.windName} · Hamle {weather.windGustsKnots} kt
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold mb-1">
                <Thermometer size={15} />
                <span>Hava / Deniz</span>
              </div>
              <div className="text-sm sm:text-base font-black text-white font-mono">
                {weather.temperature}°C
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {weather.seaTemperatureC != null
                  ? `Deniz suyu ${weather.seaTemperatureC.toFixed(1)}°C`
                  : "Deniz suyu verisi yok"}
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold mb-1">
                <Waves size={15} />
                <span>Dalga</span>
              </div>
              <div className="text-sm sm:text-base font-black text-white font-mono">
                {weather.waveHeightM != null ? `${weather.waveHeightM.toFixed(2)} m` : "—"}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {weather.waveHeightM != null
                  ? `${weather.wavePeriodS != null ? `${weather.wavePeriodS.toFixed(1)} sn` : "Periyot yok"}${
                      weather.waveDirectionDeg != null ? ` · ${Math.round(weather.waveDirectionDeg)}°` : ""
                    }`
                  : "Dalga verisi alınamadı"}
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold mb-1">
                <Eye size={15} />
                <span>Görüş</span>
              </div>
              <div className="text-sm sm:text-base font-black text-amber-400 font-mono">
                {weather.visibilityKm} km
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {weather.visibilityKm < 2 ? "⚠️ Sis kısıtlaması" : "Açık seyir"}
              </div>
            </div>
          </div>
        )}

        {/* Veri kaynağı notu */}
        <div className="mt-3 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
          <div className="flex items-center gap-2 mb-1.5">
            <Info size={14} className="text-cyan-400 shrink-0" />
            <span className="text-[11px] font-black uppercase tracking-wider text-cyan-300">
              VERİ KAYNAĞI VE SINIRLAR
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Hava sıcaklığı, rüzgar şiddeti/yönü, hamle, görüş mesafesi, dalga yüksekliği ve deniz
            suyu sıcaklığı Open-Meteo’nun canlı model verisinden alınır. Boğaz akıntısı için canlı
            ölçüm kaynağı bağlı olmadığından akıntı değeri gösterilmez.{" "}
            {hasMarineData
              ? "Dalga ve deniz suyu değerleri ikincil deniz modelinden gelir."
              : "Deniz modeli bu an için dalga/su sıcaklığı döndürmedi."}{" "}
            Sefer iptal kararları daima Kıyı Emniyeti Genel Müdürlüğü ve İBB Şehir Hatları’nın resmî
            duyurusuyla verilir.
          </p>
        </div>
      </div>

      {/* HAT BAZLI TAHMİNİ RİSK */}
      <div className="bg-white dark:bg-[#111a2e] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert size={16} className="text-rose-500 shrink-0" />
              <span>HAT BAZLI TAHMİNİ RİSK DEĞERLENDİRMESİ</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Gerçek rüzgar, görüş ve dalga verisinin hat eşikleriyle karşılaştırılması
            </p>
          </div>

          <span className="text-[10px] font-mono bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
            TAHMİNİ MODEL — RESMÎ KARAR DEĞİL
          </span>
        </div>

        {!weather ? (
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
            <Info size={15} className="text-blue-500 shrink-0 mt-0.5" />
            <span>
              Canlı hava verisi olmadan hat riski üretilmez. Güncel iptal kararları için aşağıdaki
              resmî duyuru bağlantısını kullanın.
            </span>
          </div>
        ) : (
          <div className="space-y-2.5">
            {lineRisks.map((item) => {
              const isHigh =
                item.riskLevel === "HIGH_RISK" || item.riskLevel === "CANCELLED_LIKELY";
              const isWarn = item.riskLevel === "ATTENTION";

              return (
                <div
                  key={item.lineId}
                  className={`p-3 rounded-xl border transition-all ${
                    isHigh
                      ? "bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-500/50 shadow-xs"
                      : isWarn
                      ? "bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-500/50"
                      : "bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isHigh
                            ? "bg-rose-500 animate-ping"
                            : isWarn
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                      />
                      <span className="text-xs font-black text-slate-900 dark:text-white">
                        {item.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-mono font-black px-2 py-0.5 rounded border ${
                          isHigh
                            ? "bg-rose-500 text-white border-rose-600"
                            : isWarn
                            ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40"
                            : "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40"
                        }`}
                      >
                        {isHigh
                          ? `⚠️ ~%${item.riskPercentage} tahmini aksama`
                          : isWarn
                          ? `~%${item.riskPercentage} tahmini sallantı`
                          : "Model: olağan"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800/60">
                    <div>
                      <span className="font-semibold">Kritik Etken:</span>{" "}
                      <span className="text-slate-700 dark:text-slate-300 font-bold">
                        {item.criticalFactor}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold">Dalga:</span>{" "}
                      <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">
                        {item.waveHeightM != null ? `${item.waveHeightM.toFixed(2)} m` : "veri yok"}
                      </span>
                    </div>
                    <div className="col-span-2 sm:col-span-1 text-[10px] text-slate-600 dark:text-slate-400 italic truncate">
                      {item.modelNote}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Resmi Teyit Uyarısı */}
        <div className="mt-3 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <Info size={13} className="text-blue-500 shrink-0" />
            <span>
              Resmî sefer iptal kararları Kıyı Emniyeti Genel Müdürlüğü ve İBB Şehir Hatları
              tarafından icra edilir.
            </span>
          </div>
          <a
            href="https://sehirhatlari.istanbul/tr/iptal-seferler"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 font-bold hover:underline inline-flex items-center gap-1 shrink-0 ml-2"
          >
            <span>Resmî İptal Duyuruları</span>
            <ExternalLink size={11} />
          </a>
        </div>
      </div>
    </div>
  );
}
