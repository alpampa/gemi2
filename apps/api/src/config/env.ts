import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Minimal, bağımlılıksız .env yükleyici.
 *
 * NestJS CJS (CommonJS) olarak derlendiği için, ESM-only yapılandırma
 * paketlerine bağımlı olmak yerine ortam değişkenlerini burada
 * doğrudan okuruz. Zaten tanımlı olan değişkenler EZİLMEZ.
 */
export function loadEnv(): void {
  const candidates = [
    '.env',
    'apps/api/.env',
    '../../.env',
    resolve(process.cwd(), '.env'),
  ];

  for (const candidate of candidates) {
    const filePath = resolve(process.cwd(), candidate);
    if (!existsSync(filePath)) continue;

    const content = readFileSync(filePath, 'utf8');
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;

      const eq = line.indexOf('=');
      if (eq === -1) continue;

      const key = line.slice(0, eq).trim();
      if (!key) continue;

      let value = line.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }

  if (process.env.NODE_ENV === 'production') {
    if (process.env.ENABLE_DEMO_MODE === 'true') {
      throw new Error('ENABLE_DEMO_MODE üretimde true olamaz.');
    }
    for (const key of ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET']) {
      const value = process.env[key]?.trim();
      if (
        !value ||
        value.length < 32 ||
        /change[_ -]?me|dev_(access|refresh)_secret/i.test(value)
      ) {
        throw new Error(
          `${key} üretimde en az 32 karakterlik güçlü bir sır olmalıdır.`,
        );
      }
    }
  }
}
