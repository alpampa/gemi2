/**
 * PWA ikon üreticisi.
 *
 * Kaynak: `src/components/ui/AdaVapuruIcon.tsx` içindeki Paşabahçe vapuru
 * çizimi (marka görseli). Bu çizim burada SVG olarak yeniden kurulur ve
 * sharp ile PNG'ye render edilir; harici varlık indirilmez.
 *
 * Çıktı (apps/web/public/):
 *   icon-192.png            — purpose: any
 *   icon-512.png            — purpose: any
 *   icon-maskable-512.png   — purpose: maskable (içerik merkez %80 güvenli bölgede)
 *   apple-touch-icon.png    — 180x180, OPAK (şeffaf değil)
 *
 * Kullanım: node scripts/generate-icons.mjs   (npm run icons)
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, "../public");

const BG = "#0a0f1d";

// AdaVapuruIcon iç çizimi (viewBox 0 0 220 100).
const FERRY_INNER = `
  <g stroke="#64748b" stroke-width="1.7" stroke-linecap="round">
    <path d="M18 25q5-6 10 0 5-6 10 0" />
    <path d="M174 17q4-5 8 0 4-5 8 0" />
  </g>
  <g>
    <g transform="translate(220 0) scale(-1 1)">
      <g stroke="#cf9a35" stroke-width="2" stroke-linecap="round">
        <path d="M46 6v49M184 4v51" />
        <path d="M46 12L14 61M46 15L85 35M184 11L149 38M184 12L207 61" stroke="#94a3b8" stroke-width=".9" />
        <path d="M39 17h14M177 14h14" stroke-width="1.2" />
      </g>
      <path d="M17 56Q27 52 39 53L177 55Q194 56 210 67L199 82Q195 87 184 89H38Q27 88 23 80L10 64Q8 59 17 56Z" fill="#f8fafc" stroke="#354252" stroke-width="1.8" />
      <path d="M17 62Q28 59 42 60L181 62Q198 63 207 68" stroke="#d8a23b" stroke-width="2.4" />
      <path d="M24 78Q36 81 51 81H195L199 82Q195 88 184 89H38Q27 88 23 80Z" fill="#176b51" />
      <path d="M34 89Q45 93 58 93H177Q188 93 196 89" stroke="#a74637" stroke-width="3" stroke-linecap="round" />
      <path d="M34 61L176 62L174 77H39Z" fill="#f7f8f7" stroke="#687584" stroke-width="1" />
      <g fill="#26384c">
        <rect x="43" y="64" width="5" height="8" rx="1" /><rect x="52" y="64" width="5" height="8" rx="1" />
        <rect x="61" y="64" width="5" height="8" rx="1" /><rect x="70" y="64" width="5" height="8" rx="1" />
        <rect x="79" y="64" width="5" height="8" rx="1" /><rect x="88" y="64" width="5" height="8" rx="1" />
        <rect x="97" y="64" width="5" height="8" rx="1" /><rect x="106" y="64" width="5" height="8" rx="1" />
        <rect x="115" y="64" width="5" height="8" rx="1" /><rect x="124" y="64" width="5" height="8" rx="1" />
        <rect x="133" y="64" width="5" height="8" rx="1" /><rect x="142" y="64" width="5" height="8" rx="1" />
        <rect x="151" y="64" width="5" height="8" rx="1" /><rect x="160" y="64" width="5" height="8" rx="1" />
      </g>
      <g transform="translate(33 0)">
        <path d="M27 55L37 39Q40 34 48 33H108Q116 34 121 42L127 56Z" fill="#f4f5f3" stroke="#475569" stroke-width="1.5" />
        <path d="M33 46H116" stroke="#d8a23b" stroke-width="1.8" />
        <g fill="#26384c">
          <rect x="40" y="39" width="7" height="6" rx="1" /><rect x="50" y="39" width="7" height="6" rx="1" />
          <rect x="60" y="39" width="7" height="6" rx="1" /><rect x="70" y="39" width="7" height="6" rx="1" />
          <rect x="80" y="39" width="7" height="6" rx="1" /><rect x="90" y="39" width="7" height="6" rx="1" />
          <rect x="100" y="39" width="7" height="6" rx="1" />
        </g>
      </g>
      <g transform="translate(40 0)">
        <path d="M45 33V27Q48 20 57 20H81Q89 22 91 33Z" fill="#f8fafc" stroke="#475569" stroke-width="1.4" />
        <g fill="#26384c">
          <rect x="50" y="25" width="8" height="6" rx="1" /><rect x="61" y="25" width="8" height="6" rx="1" /><rect x="72" y="25" width="8" height="6" rx="1" />
        </g>
        <path d="M71 20V11Q71 8 75 8H86Q90 9 90 12V23Z" fill="#d6a13b" stroke="#475569" stroke-width="1.2" />
        <path d="M72 12H90" stroke="#263238" stroke-width="3" />
      </g>
      <g fill="#e5533d" stroke="#fff7ed" stroke-width="1">
        <circle cx="42" cy="51" r="3.3" /><circle cx="51" cy="51" r="3.3" /><circle cx="60" cy="51" r="3.3" />
        <circle cx="69" cy="51" r="3.3" /><circle cx="78" cy="51" r="3.3" />
      </g>
      <path d="M35 42l8 3-8 3z" fill="#e5533d" />
    </g>
    <path d="M19 57v9m-4-3q4 4 8 0m-8 0-3 3m11-3 3 3" stroke="#354252" stroke-width="1.5" stroke-linecap="round" />
  </g>`;

/**
 * @param {number} size
 * @param {number} ferryFraction  geminin kenar uzunluğuna oranı (maskable için 0.8)
 * @param {boolean} opaque  arka planı opak yap (apple-touch-icon şeffaf olmamalı)
 */
function buildSvg(size, ferryFraction, opaque) {
  const ferryW = size * ferryFraction;
  const ferryH = ferryW * (100 / 220);
  const x = (size - ferryW) / 2;
  const y = (size - ferryH) / 2;
  const bg = opaque
    ? `<rect width="${size}" height="${size}" fill="${BG}" />`
    : `<rect width="${size}" height="${size}" fill="${BG}" rx="${size * 0.22}" />`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    ${bg}
    <g transform="translate(${x} ${y}) scale(${ferryW / 220})">${FERRY_INNER}</g>
  </svg>`;
}

async function render(name, size, ferryFraction, opaque) {
  const svg = buildSvg(size, ferryFraction, opaque);
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  const out = path.join(PUBLIC_DIR, name);
  await writeFile(out, png);
  console.log(`✓ ${name} (${size}x${size}, ${png.length} bayt)`);
}

async function main() {
  await mkdir(PUBLIC_DIR, { recursive: true });
  await render("icon-192.png", 192, 0.92, false);
  await render("icon-512.png", 512, 0.92, false);
  await render("icon-maskable-512.png", 512, 0.8, false);
  await render("apple-touch-icon.png", 180, 0.92, true);
}

main().catch((err) => {
  console.error("İkon üretimi başarısız:", err);
  process.exit(1);
});
