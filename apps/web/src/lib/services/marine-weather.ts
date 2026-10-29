export interface MarineWeatherStatus {
  temperature: number;
  windSpeedKnots: number;
  windGustsKnots: number;
  windDirectionDeg: number;
  windName: string;
  visibilityKm: number;
  /** Open-Meteo Marine API'den gelen gerçek dalga yüksekliği (m). Kaynak yoksa undefined. */
  waveHeightM?: number;
  /** Gerçek dalga periyodu (sn). Kaynak yoksa undefined. */
  wavePeriodS?: number;
  /** Gerçek dalga yönü (derece). Kaynak yoksa undefined. */
  waveDirectionDeg?: number;
  /** Gerçek deniz suyu sıcaklığı (°C). Kaynak yoksa undefined. */
  seaTemperatureC?: number;
  /** Open-Meteo gözlem zamanı (İstanbul saati, ISO benzeri). */
  observedAt?: string;
  alertType: 'NORMAL' | 'LODOS_WARNING' | 'STORM_WARNING' | 'FOG_WARNING';
  alertTitle: string;
  alertDescription: string;
  isFerryDisruptionRisk: boolean;
}

export function getIstanbulWindName(degrees: number): string {
  const normalized = ((degrees % 360) + 360) % 360;
  if (normalized >= 337.5 || normalized < 22.5) return 'Yıldız (Kuzey)';
  if (normalized >= 22.5 && normalized < 67.5) return 'Poyraz (Kuzeydoğu)';
  if (normalized >= 67.5 && normalized < 112.5) return 'Gündoğusu (Doğu)';
  if (normalized >= 112.5 && normalized < 157.5) return 'Keşişleme (Güneydoğu)';
  if (normalized >= 157.5 && normalized < 202.5) return 'Kıble (Güney)';
  if (normalized >= 202.5 && normalized < 247.5) return 'Lodos (Güneybatı)';
  if (normalized >= 247.5 && normalized < 292.5) return 'Günbatısı (Batı)';
  return 'Karayel (Kuzeybatı)';
}

const ATMOSPHERE_URL =
  'https://api.open-meteo.com/v1/forecast?latitude=40.95&longitude=29.05&current=temperature_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,visibility&wind_speed_unit=kn&timezone=Europe%2FIstanbul';

const MARINE_URL =
  'https://marine-api.open-meteo.com/v1/marine?latitude=40.95&longitude=29.05&current=wave_height,wave_period,wave_direction,sea_surface_temperature&timezone=Europe%2FIstanbul';

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * İstanbul Boğazı için canlı meteoroloji verisi.
 *
 * KURAL: Hiçbir alan varsayılan/uydurma değerle doldurulmaz. Atmosfer verisi
 * eksik veya kaynak erişilemezse `null` döner; arayüz "veri yok" durumunu
 * gösterir. Deniz (dalga/su sıcaklığı) verisi ayrı kaynaktan gelir ve yalnızca
 * gerçekten sayıysa taşınır.
 */
export async function fetchLiveMarineWeather(): Promise<MarineWeatherStatus | null> {
  try {
    const [atmosphereRes, marineRes] = await Promise.all([
      fetch(ATMOSPHERE_URL, { next: { revalidate: 300 } }),
      fetch(MARINE_URL, { next: { revalidate: 300 } }).catch(() => null),
    ]);

    if (!atmosphereRes.ok) {
      throw new Error('Open-Meteo atmosphere API error: ' + atmosphereRes.status);
    }

    const atmosphere = await atmosphereRes.json();
    const curr = atmosphere?.current;

    // Zorunlu alanlardan biri bile yoksa uydurma değer üretme: veri yok.
    if (
      !curr ||
      !isFiniteNumber(curr.temperature_2m) ||
      !isFiniteNumber(curr.wind_speed_10m) ||
      !isFiniteNumber(curr.wind_gusts_10m) ||
      !isFiniteNumber(curr.wind_direction_10m) ||
      !isFiniteNumber(curr.visibility)
    ) {
      return null;
    }

    const temp = Math.round(curr.temperature_2m);
    const speed = Math.round(curr.wind_speed_10m);
    const gusts = Math.round(curr.wind_gusts_10m);
    const deg = Math.round(curr.wind_direction_10m);
    const visibilityKm = Math.round((curr.visibility / 1000) * 10) / 10;
    const windName = getIstanbulWindName(deg);

    // Deniz verisi ikincil kaynaktır: alınamazsa dalga/su sıcaklığı gösterilmez.
    let waveHeightM: number | undefined;
    let wavePeriodS: number | undefined;
    let waveDirectionDeg: number | undefined;
    let seaTemperatureC: number | undefined;
    if (marineRes?.ok) {
      try {
        const marine = await marineRes.json();
        const m = marine?.current;
        if (isFiniteNumber(m?.wave_height)) waveHeightM = m.wave_height;
        if (isFiniteNumber(m?.wave_period)) wavePeriodS = m.wave_period;
        if (isFiniteNumber(m?.wave_direction)) waveDirectionDeg = m.wave_direction;
        if (isFiniteNumber(m?.sea_surface_temperature)) seaTemperatureC = m.sea_surface_temperature;
      } catch {
        // Deniz verisi yoksa yalnızca o alanlar boş kalır; atmosfer verisi korunur.
      }
    }

    const isLodos = deg >= 195 && deg <= 255;
    const isFog = curr.visibility < 1200;

    let alertType: 'NORMAL' | 'LODOS_WARNING' | 'STORM_WARNING' | 'FOG_WARNING' = 'NORMAL';
    let alertTitle = 'Deniz Ulaşımı Elverişli';
    let alertDescription =
      'Marmara Denizi ve Boğaz genelinde seferler normal akışında sürdürülmektedir.';
    let isFerryDisruptionRisk = false;

    if (isFog) {
      alertType = 'FOG_WARNING';
      alertTitle = '⚠️ Yoğun Sis Sefer Uyarısı';
      alertDescription =
        'Görüş mesafesi ' +
        visibilityKm +
        ' km seviyesine inmiştir. Şehir Hatları ve Adalar seferlerinde yavaşlama ve geçici askıya almalar görülebilir.';
      isFerryDisruptionRisk = true;
    } else if (isLodos && (speed >= 18 || gusts >= 24)) {
      alertType = 'LODOS_WARNING';
      alertTitle = '⚠️ Marmara Lodos Uyarısı';
      alertDescription =
        "Marmara'da " +
        speed +
        ' knot (' +
        gusts +
        ' knot hamleli) Lodos etkili. Bostancı-Adalar, Kabataş-Adalar ve Kartal seferlerinde aksama riski yüksektir.';
      isFerryDisruptionRisk = true;
    } else if (speed >= 25 || gusts >= 32) {
      alertType = 'STORM_WARNING';
      alertTitle = '⚠️ Şiddetli Fırtına Uyarısı';
      alertDescription =
        'Rüzgar hamleleri ' +
        gusts +
        ' knot seviyesine ulaşmıştır. Deniz otobüsü ve motor seferlerinde gecikmeler yaşanabilir.';
      isFerryDisruptionRisk = true;
    }

    return {
      temperature: temp,
      windSpeedKnots: speed,
      windGustsKnots: gusts,
      windDirectionDeg: deg,
      windName,
      visibilityKm,
      waveHeightM,
      wavePeriodS,
      waveDirectionDeg,
      seaTemperatureC,
      observedAt: typeof curr.time === 'string' ? curr.time : undefined,
      alertType,
      alertTitle,
      alertDescription,
      isFerryDisruptionRisk,
    };
  } catch (err) {
    // Uydurma "normal hava" üretme: çağıran taraf veri yok durumunu gösterir.
    console.warn('Live marine weather unavailable:', err);
    return null;
  }
}

export interface MaritimeLineRisk {
  lineId: string;
  name: string;
  corridor: 'ADALAR' | 'BOGAZ_NORTH' | 'BOGAZ_CROSS' | 'HALIC' | 'KANDILLI_CURRENT';
  /** Modelin tahmini risk yüzdesi. Resmî iptal oranı değildir. */
  riskPercentage: number;
  riskLevel: 'SAFE' | 'ATTENTION' | 'HIGH_RISK' | 'CANCELLED_LIKELY';
  /** Yalnızca gerçek deniz kaynağı varsa dolu. */
  waveHeightM?: number;
  criticalFactor: string;
  /** Modelin kısa değerlendirmesi. Resmî duyuru metni değildir. */
  modelNote: string;
}

/**
 * Hat bazlı TAHMİNİ risk modeli.
 *
 * Gerçek rüzgar/görüş/dalga verisini KEGM benzeri eşiklerle karşılaştırır.
 * Resmî iptal kararı değildir; yalnızca yolcuya ön bilgi verir. Hava verisi
 * yoksa boş dizi döner ve arayüz risk tablosu üretmez.
 */
export function calculateMaritimeLinesRisk(
  weather: MarineWeatherStatus | null | undefined
): MaritimeLineRisk[] {
  if (!weather) return [];

  const { windSpeedKnots: speed, windGustsKnots: gusts, windDirectionDeg: deg, visibilityKm } =
    weather;
  const waveHeightM = weather.waveHeightM;

  const isLodos = deg >= 195 && deg <= 250;
  const isPoyraz = deg >= 20 && deg <= 65;
  const isDenseFog = visibilityKm < 1.2;

  let adalarRisk = 5;
  let adalarLevel: MaritimeLineRisk['riskLevel'] = 'SAFE';
  let adalarNote = 'Marmara güney yaklaşımı açık; tarifeye göre seferler planlanmıştır.';

  if (isDenseFog) {
    adalarRisk = 90;
    adalarLevel = 'CANCELLED_LIKELY';
    adalarNote = 'Görüş mesafesi kritik eşiğin altında; seferler geçici olarak askıya alınabilir.';
  } else if (isLodos && gusts >= 30) {
    adalarRisk = 85;
    adalarLevel = 'CANCELLED_LIKELY';
    adalarNote = "Lodos fırtınası Marmara'da yüksek dalga oluşturuyor; iptal olasılığı yüksek.";
  } else if (isLodos && speed >= 18) {
    adalarRisk = 60;
    adalarLevel = 'HIGH_RISK';
    adalarNote = 'Lodos kaynaklı dalga ve rıhtım yanaşma zorluğu bekleniyor.';
  } else if ((waveHeightM ?? 0) >= 1.5) {
    adalarRisk = 55;
    adalarLevel = 'HIGH_RISK';
    adalarNote = 'Açık Marmara dalga yüksekliği yüksek; küçük teknelerde aksama olabilir.';
  } else if (speed >= 24) {
    adalarRisk = 45;
    adalarLevel = 'ATTENTION';
    adalarNote = 'Rüzgar sert; ada motorlarında sallantı ve gecikme yaşanabilir.';
  }

  let kandilliRisk = 5;
  let kandilliLevel: MaritimeLineRisk['riskLevel'] = 'SAFE';
  let kandilliNote = 'Boğaz yüzey akıntısı için canlı ölçüm yok; rüzgar koşulları olağan.';

  if (isDenseFog) {
    kandilliRisk = 95;
    kandilliLevel = 'CANCELLED_LIKELY';
    kandilliNote = 'Boğaz transit ve yerel trafiği sis nedeniyle VTS tarafından durdurulabilir.';
  } else if (isPoyraz && speed >= 22) {
    kandilliRisk = 65;
    kandilliLevel = 'HIGH_RISK';
    kandilliNote = 'Poyraz fırtınası nedeniyle Aşiyan ve Kandilli yanaşmalarında gecikme görülebilir.';
  } else if (speed >= 20) {
    kandilliRisk = 35;
    kandilliLevel = 'ATTENTION';
    kandilliNote = 'Akıntıburnu açıklarında hafif çatışma dalgaları olabilir.';
  }

  let crossRisk = 5;
  let crossLevel: MaritimeLineRisk['riskLevel'] = 'SAFE';
  let crossNote = 'Büyük gövdeli vapurlarla çapraz seferler planlandığı gibi görünüyor.';

  if (isDenseFog) {
    crossRisk = 90;
    crossLevel = 'CANCELLED_LIKELY';
    crossNote = 'Yoğun sis nedeniyle Boğaz trafiği çift yönlü askıya alınabilir.';
  } else if (gusts >= 38) {
    crossRisk = 70;
    crossLevel = 'HIGH_RISK';
    crossNote = 'Fırtına şiddeti yüksek; iskeleye aborda manevralarında gecikme yaşanabilir.';
  } else if (gusts >= 28) {
    crossRisk = 30;
    crossLevel = 'ATTENTION';
    crossNote = 'Hafif sallantı görülebilir; ana seferler zamanında icra edilebilir.';
  }

  let northRisk = 5;
  let northLevel: MaritimeLineRisk['riskLevel'] = 'SAFE';
  let northNote = 'Karadeniz boğaz ağzı açık; rüzgar koşulları olağan.';

  if (isPoyraz && speed >= 25) {
    northRisk = 75;
    northLevel = 'HIGH_RISK';
    northNote = "Karadeniz'den Boğaz girişine doğru yüksek dalga; seferler risk altında.";
  } else if (speed >= 18 && isPoyraz) {
    northRisk = 40;
    northLevel = 'ATTENTION';
    northNote = 'Boğaz ağzında çırpıntı dalgaları hakim.';
  }

  return [
    {
      lineId: 'adalar_bostanci',
      name: 'Bostancı / Maltepe → Adalar',
      corridor: 'ADALAR',
      riskPercentage: adalarRisk,
      riskLevel: adalarLevel,
      waveHeightM,
      criticalFactor: isLodos ? 'Marmara Lodos Fırtınası' : 'Açık Marmara',
      modelNote: adalarNote,
    },
    {
      lineId: 'adalar_kabatas',
      name: 'Kabataş / Kadıköy → Adalar',
      corridor: 'ADALAR',
      riskPercentage: Math.max(5, adalarRisk - 5),
      riskLevel: adalarLevel,
      waveHeightM,
      criticalFactor: isLodos ? 'Güney Marmara Dalgası' : 'Açık Marmara',
      modelNote: adalarNote,
    },
    {
      lineId: 'bogaz_kandilli',
      name: 'Aşiyan → Kandilli / Bebek (Şeytan Akıntısı)',
      corridor: 'KANDILLI_CURRENT',
      riskPercentage: kandilliRisk,
      riskLevel: kandilliLevel,
      criticalFactor: 'Boğaz Yüzey Akıntısı & Çatışma Dalgası',
      modelNote: kandilliNote,
    },
    {
      lineId: 'bogaz_cross',
      name: 'Kadıköy → Karaköy / Beşiktaş (Çapraz Hatlar)',
      corridor: 'BOGAZ_CROSS',
      riskPercentage: crossRisk,
      riskLevel: crossLevel,
      criticalFactor: isDenseFog ? 'Görüş Mesafesi (Sis)' : 'Stabil Seyir',
      modelNote: crossNote,
    },
    {
      lineId: 'bogaz_north',
      name: 'Sarıyer → Rumeli Kavağı / Anadolu Kavağı',
      corridor: 'BOGAZ_NORTH',
      riskPercentage: northRisk,
      riskLevel: northLevel,
      criticalFactor: isPoyraz ? 'Karadeniz Poyraz Girişi' : 'Normal Deniz',
      modelNote: northNote,
    },
    {
      lineId: 'halic',
      name: 'Üsküdar → Kasımpaşa → Eyüpsultan (Haliç)',
      corridor: 'HALIC',
      riskPercentage: 0,
      riskLevel: 'SAFE',
      criticalFactor: 'Korunaklı İç Haliç',
      modelNote: 'Haliç kapalı iç su yolu olduğundan rüzgardan en az etkilenen hattır.',
    },
  ];
}
