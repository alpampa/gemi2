/** Paşabahçe'den esinlenen uzun gövde, öne alınmış köprü ve açık kıç güvertesi. */
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
      {/* Martılar vapurun çevresinde süzülür. */}
      <g stroke="#64748b" strokeWidth="1.7" strokeLinecap="round">
        <path className="ferry-gull" d="M18 25q5-6 10 0 5-6 10 0" />
        <path className="ferry-gull ferry-gull-2" d="M174 17q4-5 8 0 4-5 8 0" />
      </g>

      <g className="ferry-bob">
        {/* Çift direk, halatlar ve Türk bayrağı. */}
        <g stroke="#cf9a35" strokeWidth="2" strokeLinecap="round">
          <path d="M48 6v49M143 4v49" />
          <path d="M48 12L14 61M48 15L85 35M143 11L113 36M143 12L196 59" stroke="#94a3b8" strokeWidth=".9" />
          <path d="M41 17h14M136 14h14" strokeWidth="1.2" />
        </g>

        {/* İskeleye bakan baş soldadır. Kıç tarafındaki uzun açık alan belirgin kalır. */}
        <path d="M17 56Q27 52 39 53L177 55Q194 56 210 67L199 82Q195 87 184 89H38Q27 88 23 80L10 64Q8 59 17 56Z" fill="#f8fafc" stroke="#354252" strokeWidth="1.8" />
        <path d="M17 62Q28 59 42 60L181 62Q198 63 207 68" stroke="#d8a23b" strokeWidth="2.4" />
        <path d="M24 78Q36 81 51 81H195L199 82Q195 88 184 89H38Q27 88 23 80Z" fill="#176b51" />
        <path d="M34 89Q45 93 58 93H177Q188 93 196 89" stroke="#a74637" strokeWidth="3" strokeLinecap="round" />

        {/* Alt salon baş tarafa yakın; pencereler gövde boyunca uzanır. */}
        <path d="M34 61L176 62L174 77H39Z" fill="#f7f8f7" stroke="#687584" strokeWidth="1" />
        <g fill="#26384c">
          <rect x="43" y="64" width="5" height="8" rx="1" /><rect x="52" y="64" width="5" height="8" rx="1" />
          <rect x="61" y="64" width="5" height="8" rx="1" /><rect x="70" y="64" width="5" height="8" rx="1" />
          <rect x="79" y="64" width="5" height="8" rx="1" /><rect x="88" y="64" width="5" height="8" rx="1" />
          <rect x="97" y="64" width="5" height="8" rx="1" /><rect x="106" y="64" width="5" height="8" rx="1" />
          <rect x="115" y="64" width="5" height="8" rx="1" /><rect x="124" y="64" width="5" height="8" rx="1" />
          <rect x="133" y="64" width="5" height="8" rx="1" /><rect x="142" y="64" width="5" height="8" rx="1" />
          <rect x="151" y="64" width="5" height="8" rx="1" /><rect x="160" y="64" width="5" height="8" rx="1" />
        </g>

        {/* Üst salon başta kümelenir; sağdaki kıç güvertesi daha açık ve uzundur. */}
        <path d="M27 55L37 39Q40 34 48 33H108Q116 34 121 42L127 56Z" fill="#f4f5f3" stroke="#475569" strokeWidth="1.5" />
        <path d="M33 46H116" stroke="#d8a23b" strokeWidth="1.8" />
        <g fill="#26384c">
          <rect x="40" y="39" width="7" height="6" rx="1" /><rect x="50" y="39" width="7" height="6" rx="1" />
          <rect x="60" y="39" width="7" height="6" rx="1" /><rect x="70" y="39" width="7" height="6" rx="1" />
          <rect x="80" y="39" width="7" height="6" rx="1" /><rect x="90" y="39" width="7" height="6" rx="1" />
          <rect x="100" y="39" width="7" height="6" rx="1" />
        </g>

        {/* Köprü ve baca öne taşındı; bacanın üstü koyu renkli. */}
        <path d="M45 33V27Q48 20 57 20H81Q89 22 91 33Z" fill="#f8fafc" stroke="#475569" strokeWidth="1.4" />
        <g fill="#26384c">
          <rect x="50" y="25" width="8" height="6" rx="1" /><rect x="61" y="25" width="8" height="6" rx="1" /><rect x="72" y="25" width="8" height="6" rx="1" />
        </g>
        <path d="M71 20V11Q71 8 75 8H86Q90 9 90 12V23Z" fill="#d6a13b" stroke="#475569" strokeWidth="1.2" />
        <path d="M72 12H90" stroke="#263238" strokeWidth="3" />
        <circle className="ferry-smoke" cx="82" cy="7" r="3.5" fill="#cbd5e1" />
        <circle className="ferry-smoke ferry-smoke-2" cx="88" cy="4" r="2.4" fill="#e2e8f0" />

        {/* Can simitleri, baş çapası ve bayrak. */}
        <g fill="#e5533d" stroke="#fff7ed" strokeWidth="1">
          <circle cx="42" cy="51" r="3.3" /><circle cx="51" cy="51" r="3.3" /><circle cx="60" cy="51" r="3.3" />
          <circle cx="69" cy="51" r="3.3" /><circle cx="78" cy="51" r="3.3" />
        </g>
        <path d="M19 57v9m-4-3q4 4 8 0m-8 0-3 3m11-3 3 3" stroke="#354252" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M184 42v12m0-12 8 3-8 3" stroke="#64748b" strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M184 42l8 3-8 3z" fill="#e5533d" />
      </g>

      {/* Vapur ilerlerken su çizgileri farklı hızlarda akar. */}
      <path className="ferry-wave" d="M5 96q8-4 16 0t16 0t16 0t16 0t16 0t16 0t16 0t16 0t16 0t16 0t16 0t16 0t16 0" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" opacity=".85" />
      <path className="ferry-wave ferry-wave-2" d="M0 99q8-3 16 0t16 0t16 0t16 0t16 0t16 0t16 0t16 0t16 0t16 0t16 0t16 0t16 0t16 0" stroke="#7dd3fc" strokeWidth="1.2" strokeLinecap="round" opacity=".7" />
    </svg>
  );
}
