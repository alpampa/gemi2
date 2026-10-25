/**
 * PAŞABAHÇE VAPURU — İkonik İstanbul Boğaz ve Adalar Vapuru
 * (1952 Taranto yapımı tarihi Paşabahçe'nin yandan birebir silueti)
 *
 * Özellikler:
 * - Keskin İtalyan clipper pruva (burun) ve klasik kıç formu
 * - Siyah/lacivert borda, beyaz üst salon güverteleri
 * - Geleneksel Şehir Hatları sarı-siyah buharlı bacası
 * - Bacadan süzülen gerçekçi duman animasyonu
 * - Gemi çevresinde süzülen Boğaz martıları
 * - Dalgalar, su hattı ve pruva köpüğü
 */
export function AdaVapuruIcon({ className = "w-8 h-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 -7 64 33"
      className={className}
      role="img"
      aria-label="Paşabahçe Vapuru"
      fill="none"
    >
      {/* MARTILAR — Gemi üzerinde ve pruvasında süzülen Boğaz martıları */}
      <g stroke="#94a3b8" strokeWidth="0.85" strokeLinecap="round">
        <g transform="translate(8 3.5)">
          <path className="ferry-gull" d="M-2.2,0.6 Q-1.1,-0.8 0,0.1 Q1.1,-0.8 2.2,0.6" />
        </g>
        <g transform="translate(20 1.2)">
          <path className="ferry-gull ferry-gull-2" d="M-1.8,0.5 Q-0.9,-0.7 0,0.1 Q0.9,-0.7 1.8,0.5" />
        </g>
        <g transform="translate(56 6.5)">
          <path className="ferry-gull ferry-gull-3" d="M-1.9,0.5 Q-1,-0.7 0,0.1 Q1,-0.7 1.9,0.5" />
        </g>
      </g>

      {/* DENİZ VE DALGALAR — Seyir su hattı */}
      <path
        className="ferry-wave"
        d="M2,24.5 q2.5,-1.2 5,0 t5,0 t5,0 t5,0 t5,0 t5,0 t5,0 t5,0 t5,0 t5,0 t5,0 t5,0"
        stroke="#7dd3fc"
        strokeWidth="0.75"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path
        className="ferry-wave ferry-wave-2"
        d="M-2,26 q2.5,-1.2 5,0 t5,0 t5,0 t5,0 t5,0 t5,0 t5,0 t5,0 t5,0 t5,0 t5,0 t5,0"
        stroke="#38bdf8"
        strokeWidth="0.85"
        strokeLinecap="round"
        opacity="0.9"
      />

      {/* Pruva Köpüğü (Bow Spray) */}
      <g stroke="#bae6fd" strokeWidth="0.7" strokeLinecap="round" opacity="0.95">
        <path d="M53,23.5 q2,-2.2 4.5,-0.8" />
        <path d="M55,23.1 q1.4,-1.5 3.2,-0.5" />
      </g>

      {/* PAŞABAHÇE GÖVDESİ VE ÜST YAPISI (Denizde nazik yalpalama: ferry-bob) */}
      <g className="ferry-bob">
        {/* BACADAN DUMAN — Geriye ve yukarıya süzülen duman pufcukları */}
        <circle className="ferry-smoke" cx="30" cy="2.5" r="1.8" fill="#cbd5e1" opacity="0.85" />
        <circle className="ferry-smoke ferry-smoke-2" cx="30.8" cy="2.8" r="1.3" fill="#e2e8f0" opacity="0.75" />
        <circle className="ferry-smoke ferry-smoke-3" cx="29.2" cy="3.1" r="0.9" fill="#f1f5f9" opacity="0.65" />

        {/* GELENEKSEL ŞEHİR HATLARI BACASI (Sarı gövde, eğik form, siyah şapka) */}
        <path
          d="M28.5,8 L29.8,2.2 L34.2,2.2 L33.2,8 Z"
          fill="#f59e0b"
          stroke="#d97706"
          strokeWidth="0.4"
        />
        {/* Bacanın Siyah Üst Bandı */}
        <path
          d="M29.5,3.7 L29.8,2.2 L34.2,2.2 L33.9,3.7 Z"
          fill="#0f172a"
        />
        {/* Baca Beyaz Şehir Hatları Çapa Logosu Noktası */}
        <circle cx="31.8" cy="5.4" r="0.8" fill="#ffffff" opacity="0.9" />

        {/* PRUVA VE KIÇ DİREKLERİ */}
        {/* Pruva Direği */}
        <line x1="51" y1="5.5" x2="51" y2="16.5" stroke="#94a3b8" strokeWidth="0.7" />
        {/* Kıç Türk Bayrağı */}
        <line x1="10" y1="11" x2="10" y2="17" stroke="#64748b" strokeWidth="0.6" />
        <path d="M7,11.2 L10,11.2 L10,13.2 L7,13.2 Z" fill="#ef4444" />
        <circle cx="8.5" cy="12.2" r="0.5" fill="#ffffff" />

        {/* ÜST GÜVERTE & KÖPRÜÜSTÜ (BEYAZ SALON BİNASI) */}
        {/* 2. Kat Üst Salon */}
        <rect x="18" y="8" width="26" height="4.2" rx="0.5" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.4" />
        {/* Üst Pencereler */}
        <g fill="#0284c7" opacity="0.9">
          <rect x="20" y="9.2" width="1.8" height="1.8" rx="0.3" />
          <rect x="22.8" y="9.2" width="1.8" height="1.8" rx="0.3" />
          <rect x="25.6" y="9.2" width="1.8" height="1.8" rx="0.3" />
          <rect x="36" y="9.2" width="1.8" height="1.8" rx="0.3" />
          <rect x="38.8" y="9.2" width="1.8" height="1.8" rx="0.3" />
          <rect x="41.6" y="9.2" width="1.8" height="1.8" rx="0.3" />
        </g>

        {/* ÖNDE YÜKSELTİLMİŞ KAPTAN KÖŞKÜ (WHEELHOUSE) */}
        <path
          d="M44,12.2 L45.2,7.5 L50.2,7.5 L51.2,12.2 Z"
          fill="#ffffff"
          stroke="#cbd5e1"
          strokeWidth="0.4"
        />
        {/* Köprüüstü Camları */}
        <g fill="#0c4a6e">
          <rect x="46" y="8.6" width="1.5" height="1.6" rx="0.2" />
          <rect x="48.2" y="8.6" width="1.5" height="1.6" rx="0.2" />
        </g>

        {/* KIÇ AÇIK GÜVERTE KORKULUKLARI */}
        <line x1="13" y1="12.2" x2="18" y2="12.2" stroke="#94a3b8" strokeWidth="0.5" />
        <line x1="13" y1="10.8" x2="18" y2="10.8" stroke="#94a3b8" strokeWidth="0.4" />

        {/* 1. KAT ANA YOLCU SALONU */}
        <rect x="13" y="12.2" width="37.5" height="5.2" rx="0.4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.4" />
        {/* Ana Salon Ahşap Pencereleri (Paşabahçe Sıralı Camları) */}
        <g fill="#0284c7">
          <rect x="15" y="13.6" width="1.7" height="2.2" rx="0.3" />
          <rect x="17.6" y="13.6" width="1.7" height="2.2" rx="0.3" />
          <rect x="20.2" y="13.6" width="1.7" height="2.2" rx="0.3" />
          <rect x="22.8" y="13.6" width="1.7" height="2.2" rx="0.3" />
          <rect x="25.4" y="13.6" width="1.7" height="2.2" rx="0.3" />
          <rect x="28" y="13.6" width="1.7" height="2.2" rx="0.3" />
          <rect x="30.6" y="13.6" width="1.7" height="2.2" rx="0.3" />
          <rect x="33.2" y="13.6" width="1.7" height="2.2" rx="0.3" />
          <rect x="35.8" y="13.6" width="1.7" height="2.2" rx="0.3" />
          <rect x="38.4" y="13.6" width="1.7" height="2.2" rx="0.3" />
          <rect x="41" y="13.6" width="1.7" height="2.2" rx="0.3" />
          <rect x="43.6" y="13.6" width="1.7" height="2.2" rx="0.3" />
          <rect x="46.2" y="13.6" width="1.7" height="2.2" rx="0.3" />
        </g>

        {/* PAŞABAHÇE İKONİK SİYAH/LACİVERT GÖVDESİ (Keskin Raked Pruva) */}
        <path
          d="M8,17.4 L51.5,17.4 L55.5,23.8 Q54.5,24.6 52.5,24.6 L9.5,24.6 Q7.5,24.6 7,23 Z"
          fill="#0f172a"
          stroke="#334155"
          strokeWidth="0.4"
        />
        {/* Beyaz Borda Kuşağı */}
        <path
          d="M8.2,17.6 L51.6,17.6 L52.6,18.8 L8,18.8 Z"
          fill="#f8fafc"
        />
        {/* Su Altı Kırmızı Karina Çizgisi */}
        <path
          d="M10,24.3 L52.8,24.3 Q51.5,24.9 49,24.9 L13,24.9 Z"
          fill="#b91c1c"
          opacity="0.9"
        />
      </g>
    </svg>
  );
}
