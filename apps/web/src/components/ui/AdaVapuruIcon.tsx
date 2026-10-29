/** Paşabahçe esintili, uzun gövdeli ve iki direkli vapur çizimi. */
export function AdaVapuruIcon({ className = "w-20 h-9" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 220 100"
      className={className}
      role="img"
      aria-label="Paşabahçe vapuru"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Uzakta süzülen martılar */}
      <g stroke="#94a3b8" strokeWidth="1.7" strokeLinecap="round">
        <path className="ferry-gull" d="M25 20q5-6 10 0 5-6 10 0" />
        <path className="ferry-gull ferry-gull-2" d="M168 15q4-5 8 0 4-5 8 0" />
        <path className="ferry-gull ferry-gull-3" d="M199 27q4-5 8 0" />
      </g>

      {/* İki yüksek direk ve aralarındaki ince halatlar */}
      <g stroke="#d19a35" strokeWidth="2" strokeLinecap="round">
        <path d="M60 7v48M157 3v49" />
        <path d="M60 14L27 54M60 17L87 43M157 10L127 40M157 12l42 44" stroke="#9aa5b1" strokeWidth=".9" />
        <path d="M52 18h16M148 14h18" strokeWidth="1.2" />
      </g>

      <g className="ferry-bob">
        {/* Tek baca ve hafifçe yükselen duman */}
        <circle className="ferry-smoke" cx="111" cy="21" r="4.2" fill="#cbd5e1" />
        <circle className="ferry-smoke ferry-smoke-2" cx="116" cy="17" r="3" fill="#e2e8f0" />
        <circle className="ferry-smoke ferry-smoke-3" cx="106" cy="16" r="2.4" fill="#f1f5f9" />

        {/* Uzun, alçak gövde; önde sivri burun, arkada yükselen kıç */}
        <path d="M21 53Q34 51 49 53L177 55Q196 56 211 66L199 82Q194 88 184 89H39Q28 88 25 80L11 63Q8 59 12 56Z" fill="#f8fafc" stroke="#354252" strokeWidth="1.8" />
        <path d="M20 61Q28 59 43 60L182 62Q197 63 207 68" stroke="#d8a23b" strokeWidth="2.4" />
        <path d="M25 78Q36 81 49 81H194L199 82Q194 88 184 89H39Q28 88 25 80Z" fill="#176b51" />
        <path d="M33 89Q41 93 52 93H179Q189 93 195 89" stroke="#a74637" strokeWidth="3" strokeLinecap="round" />

        {/* Alt yolcu salonu: gövde boyunca uzanan pencere sırası */}
        <path d="M38 60L178 62L176 77H40Z" fill="#f7f8f7" stroke="#687584" strokeWidth="1" />
        <g fill="#26384c">
          <rect x="46" y="64" width="5" height="8" rx="1" /><rect x="55" y="64" width="5" height="8" rx="1" />
          <rect x="64" y="64" width="5" height="8" rx="1" /><rect x="73" y="64" width="5" height="8" rx="1" />
          <rect x="82" y="64" width="5" height="8" rx="1" /><rect x="91" y="64" width="5" height="8" rx="1" />
          <rect x="100" y="64" width="5" height="8" rx="1" /><rect x="109" y="64" width="5" height="8" rx="1" />
          <rect x="118" y="64" width="5" height="8" rx="1" /><rect x="127" y="64" width="5" height="8" rx="1" />
          <rect x="136" y="64" width="5" height="8" rx="1" /><rect x="145" y="64" width="5" height="8" rx="1" />
          <rect x="154" y="64" width="5" height="8" rx="1" /><rect x="163" y="64" width="5" height="8" rx="1" />
        </g>

        {/* Üst güverte uzun ve basık; kıçta açık yolcu bölümü */}
        <path d="M34 52L47 39Q51 35 59 35H162Q172 36 180 43L188 57L47 55Z" fill="#f4f5f3" stroke="#475569" strokeWidth="1.5" />
        <path d="M40 46H175" stroke="#d8a23b" strokeWidth="1.8" />
        <g fill="#26384c">
          <rect x="50" y="40" width="7" height="6" rx="1" /><rect x="60" y="40" width="7" height="6" rx="1" />
          <rect x="70" y="40" width="7" height="6" rx="1" /><rect x="80" y="40" width="7" height="6" rx="1" />
          <rect x="90" y="40" width="7" height="6" rx="1" /><rect x="100" y="40" width="7" height="6" rx="1" />
          <rect x="110" y="40" width="7" height="6" rx="1" /><rect x="120" y="40" width="7" height="6" rx="1" />
          <rect x="130" y="40" width="7" height="6" rx="1" /><rect x="140" y="40" width="7" height="6" rx="1" />
          <rect x="150" y="40" width="7" height="6" rx="1" /><rect x="160" y="40" width="7" height="6" rx="1" />
        </g>

        {/* Köprüüstü ve bacanın ayrı, belirgin silueti */}
        <path d="M88 35V29Q91 23 99 23H119Q127 25 129 35Z" fill="#f8fafc" stroke="#475569" strokeWidth="1.3" />
        <g fill="#26384c">
          <rect x="94" y="28" width="7" height="5" rx=".8" /><rect x="104" y="28" width="7" height="5" rx=".8" /><rect x="114" y="28" width="7" height="5" rx=".8" />
        </g>
        <path d="M104 23V12Q104 10 107 10H118Q121 11 121 14V25Z" fill="#d6a13b" stroke="#475569" strokeWidth="1.2" />
        <path d="M104 14H121" stroke="#263238" strokeWidth="3" />

        {/* Kırmızı can simitleri ve burun çapası */}
        <g fill="#e5533d" stroke="#fff7ed" strokeWidth="1">
          <circle cx="66" cy="51" r="3.5" /><circle cx="76" cy="51" r="3.5" /><circle cx="86" cy="51" r="3.5" />
          <circle cx="96" cy="51" r="3.5" /><circle cx="106" cy="51" r="3.5" /><circle cx="116" cy="51" r="3.5" />
        </g>
        <path d="M22 57v9m-4-3q4 4 8 0m-8 0-3 3m11-3 3 3" stroke="#354252" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M185 42v12m0-12 8 3-8 3" stroke="#64748b" strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M185 42l8 3-8 3z" fill="#e5533d" />
      </g>

      {/* İnce köpük ve birbirinden farklı hızda akan dalgalar */}
      <path className="ferry-wave" d="M5 96q8-4 16 0t16 0t16 0t16 0t16 0t16 0t16 0t16 0t16 0t16 0t16 0t16 0t16 0" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" opacity=".85" />
      <path className="ferry-wave ferry-wave-2" d="M0 99q8-3 16 0t16 0t16 0t16 0t16 0t16 0t16 0t16 0t16 0t16 0t16 0t16 0t16 0t16 0" stroke="#7dd3fc" strokeWidth="1.2" strokeLinecap="round" opacity=".7" />
    </svg>
  );
}
