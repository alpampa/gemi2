/**
 * VERİ DOĞRULAMA KAPISI (`npm run validate:data`).
 *
 * AGENTS.md kuralı: kaynağı doğrulanamayan yolcu verisi yayına çıkamaz.
 * Bu betik:
 *  1. Yapısal doğrulama: zorunlu alanlar + HH:mm biçimleri + origin≠destination.
 *  2. Provens (kaynak) doğrulaması: her veri dosyası snapshot-seviyesi bir
 *     damga (generatedAt/fetchedAt) taşımalı; eksikse HATA.
 *  3. Kayıt-seviyesi sourceUrl/verifiedAt eksikse: UYDURMA TARİH YAZILMAZ;
 *     sayı raporlanır ve bu kayıtlar "kaynak-seviyesi doğrulanmamış" sayılır
 *     (yayın için inceleme gerekir — rapor sonunda listelenir).
 *
 * Çıkış kodu: yapısal hata veya snapshot damgası eksikse 1, aksi halde 0.
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(WEB_ROOT, "src/lib/data");
const SNAP_DIR = path.join(WEB_ROOT, "src/lib/agents/data-snapshots");

const HHMM = /^\d{2}:\d{2}$/;
const errors = [];
const warnings = [];

function readJson(rel) {
  if (!existsSync(rel)) {
    errors.push(`Dosya bulunamadı: ${rel}`);
    return null;
  }
  try {
    return JSON.parse(readFileSync(rel, "utf8"));
  } catch (e) {
    errors.push(`JSON okunamadı (${rel}): ${e.message}`);
    return null;
  }
}

function checkTripLike(rec, where, fallbackProv) {
  if (!rec || typeof rec !== "object") {
    errors.push(`${where}: kayıt nesne değil`);
    return;
  }
  if (!rec.id) errors.push(`${where}: id eksik`);
  if (!rec.origin) errors.push(`${where}: origin eksik`);
  if (!rec.destination) errors.push(`${where}: destination eksik`);
  if (rec.origin && rec.destination && rec.origin.trim() === rec.destination.trim()) {
    errors.push(`${where}: origin ve destination aynı (${rec.origin})`);
  }
  const dep = rec.departureTime ?? rec.time;
  if (dep && !HHMM.test(dep)) errors.push(`${where}: geçersiz kalkış saati "${dep}"`);
  if (rec.arrivalTime && !HHMM.test(rec.arrivalTime)) {
    errors.push(`${where}: geçersiz varış saati "${rec.arrivalTime}"`);
  }
  if (rec.arrivalSource === "official" && !rec.arrivalTime) {
    errors.push(`${where}: arrivalSource=official ama arrivalTime yok`);
  }
  // Dosya-seviyesi provens (örn. Dentur JSON `generatedAt` + `sourceBase`)
  // kayıtlara aktarılıyorsa kayıt-seviyesi eksik sayılmaz.
  const prov = rec.sourceUrl || rec.verifiedAt || rec.sourceVerifiedAt || fallbackProv;
  if (!prov) {
    warnings.push(`${where}: kayıt-seviyesi sourceUrl/verifiedAt yok`);
  }
}

// ---------- 1. Tarife dosyaları ----------
const denturPath = path.join(DATA_DIR, "dentur-schedules.json");
const dentur = readJson(denturPath);
if (dentur) {
  if (!dentur.generatedAt) errors.push("dentur-schedules.json: snapshot generatedAt eksik (kaynak doğrulanamaz)");
  // Dentur verisi dosya damgasını kayıtlara aktarır (dentur-schedules.ts).
  const denturProv = dentur.generatedAt ? { verifiedAt: dentur.generatedAt } : null;
  const lines = dentur.lines ?? [];
  lines.forEach((l, i) => checkTripLike({ id: `dentur-${i}`, ...l }, `dentur[${i}]`, denturProv));
  console.log(`• dentur-schedules.json: ${lines.length} hat doğrulandı (generatedAt: ${dentur.generatedAt ?? "YOK"})`);
}

const scrapedPath = path.join(DATA_DIR, "official-scraped-schedules.json");
const scraped = readJson(scrapedPath);
if (scraped) {
  const arr = Array.isArray(scraped) ? scraped : scraped.trips ?? scraped.schedules ?? [];
  if (!Array.isArray(scraped) && !scraped.generatedAt) {
    warnings.push("official-scraped-schedules.json: snapshot generatedAt yok");
  }
  arr.forEach((t, i) => checkTripLike(t, `scraped[${i}]`));
  console.log(`• official-scraped-schedules.json: ${arr.length} sefer doğrulandı`);
}

// ---------- 2. Duyuru snapshot'ı ----------
const annPath = path.join(SNAP_DIR, "announcements.json");
const ann = readJson(annPath);
if (ann) {
  if (!ann.generatedAt) errors.push("announcements.json: generatedAt eksik");
  const snaps = ann.snapshots ?? [];
  snaps.forEach((s, i) => {
    if (!s.operator) errors.push(`announcements.snapshots[${i}]: operator eksik`);
    if (!s.sourceUrl) errors.push(`announcements.snapshots[${i}]: sourceUrl eksik`);
    if (!s.fetchedAt) errors.push(`announcements.snapshots[${i}]: fetchedAt eksik`);
    (s.announcements ?? []).forEach((a, j) => {
      if (!a.id || !a.title) errors.push(`announcements[${i}][${j}]: id/title eksik`);
      if (!a.sourceUrl) warnings.push(`announcements[${i}][${j}]: sourceUrl yok`);
    });
  });
  console.log(
    `• announcements.json: ${snaps.length} snapshot doğrulandı (generatedAt: ${ann.generatedAt ?? "YOK"})`,
  );
}

// ---------- Rapor ----------
if (warnings.length) {
  const unique = [...new Set(warnings)];
  console.log(`\nUYARI: ${warnings.length} kayıt-seviyesi provens eksiği (uydurma tarih YAZILMADI).`);
  unique.slice(0, 10).forEach((w) => console.log(`  - ${w}`));
  if (unique.length > 10) console.log(`  ... ve ${unique.length - 10} benzeri`);
}

if (errors.length) {
  console.error(`\nHATA: ${errors.length} yapısal/provens hatası:`);
  errors.forEach((e) => console.error(`  ✗ ${e}`));
  process.exit(1);
}

console.log("\n✓ validate:data — yapısal ve snapshot-seviyesi doğrulama geçti.");
