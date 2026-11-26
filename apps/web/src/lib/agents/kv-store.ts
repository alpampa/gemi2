/**
 * HAFİF KALICI DEPO (KV)
 *
 * Sunucu tarafı kalıcı veri (izleme sağlığı, duyuru arşivi, değişiklik
 * geçmişi) için kullanılan ince katman.
 *
 * TASARIM (kısıtlar):
 *  - Yeni npm bağımlılığı YOK → Upstash/Vercel KV'nin REST API'si düz
 *    `fetch` ile çağrılır (lockfile değişmez).
 *  - Ortam değişkenleri yoksa (yerel geliştirme/test) otomatik olarak
 *    süreç-içi (in-memory) yedeğe düşer; uygulama ASLA çökmez.
 *  - Runtime'da dosya sistemine yazılmaz (Vercel serverless salt-okunur).
 *
 * Anahtarlar `vapur:` ön ekiyle tümü küçük harf/nokta ile adlandırılır.
 */

const MEMORY = new Map<string, { value: string; expiresAt: number | null }>();

/** Süreç-içi yedeğin temizlenmesi (testler için) */
export function __resetMemoryKv(): void {
  MEMORY.clear();
}

interface KvCredentials {
  url: string;
  token: string;
}

/**
 * Öncelik sırası: Vercel KV (KV_REST_API_*) → Upstash (UPSTASH_REDIS_REST_*).
 * İkisi de yoksa `null` → in-memory yedek.
 */
function getCredentials(): KvCredentials | null {
  const url =
    process.env.KV_REST_API_URL?.trim() ||
    process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token =
    process.env.KV_REST_API_TOKEN?.trim() ||
    process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  return { url, token };
}

export function isKvConfigured(): boolean {
  return getCredentials() !== null;
}

export function kvBackendName(): "upstash" | "memory" {
  return isKvConfigured() ? "upstash" : "memory";
}

/** Upstash REST'e tek komut gönderir: POST ["GET"|"SET", ...] */
async function upstashCommand(command: (string | number)[]): Promise<unknown> {
  const creds = getCredentials();
  if (!creds) throw new Error("KV yapılandırılmadı");
  const res = await fetch(creds.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${creds.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`KV HTTP ${res.status}`);
  const json = (await res.json()) as { result?: unknown; error?: string };
  if (json.error) throw new Error(`KV: ${json.error}`);
  return json.result ?? null;
}

export async function kvGet(key: string): Promise<string | null> {
  if (isKvConfigured()) {
    try {
      const result = await upstashCommand(["GET", key]);
      return typeof result === "string"
        ? result
        : result === null
          ? null
          : String(result);
    } catch (err) {
      console.warn(
        `[kv] GET başarısız (${key}): ${err instanceof Error ? err.message : err}`,
      );
    }
  }
  const entry = MEMORY.get(key);
  if (!entry) return null;
  if (entry.expiresAt !== null && entry.expiresAt <= Date.now()) {
    MEMORY.delete(key);
    return null;
  }
  return entry.value;
}

export async function kvSet(
  key: string,
  value: string,
  ttlSeconds?: number,
): Promise<void> {
  if (isKvConfigured()) {
    try {
      const command: (string | number)[] = ["SET", key, value];
      if (ttlSeconds && ttlSeconds > 0) command.push("EX", ttlSeconds);
      await upstashCommand(command);
      return;
    } catch (err) {
      console.warn(
        `[kv] SET başarısız (${key}): ${err instanceof Error ? err.message : err}`,
      );
    }
  }
  MEMORY.set(key, {
    value,
    expiresAt:
      ttlSeconds && ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : null,
  });
}

/**
 * Atomik "yoksa yaz" (SET NX EX) — dağıtık kilit için.
 *
 * KV yapılandırılmışsa ve komut başarısız olursa **false** döner (fail-closed):
 * kilidi alamadıysak tur atlanır; böylece çift yazma/çift olay oluşmaz.
 */
export async function kvSetNx(
  key: string,
  value: string,
  ttlSeconds: number,
): Promise<boolean> {
  if (isKvConfigured()) {
    try {
      const result = await upstashCommand([
        "SET",
        key,
        value,
        "NX",
        "EX",
        ttlSeconds,
      ]);
      return result === "OK";
    } catch (err) {
      console.warn(
        `[kv] SET NX başarısız (${key}): ${err instanceof Error ? err.message : err}`,
      );
      return false;
    }
  }
  const entry = MEMORY.get(key);
  if (entry && (entry.expiresAt === null || entry.expiresAt > Date.now()))
    return false;
  MEMORY.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  return true;
}

export async function kvDel(key: string): Promise<void> {
  if (isKvConfigured()) {
    try {
      await upstashCommand(["DEL", key]);
      return;
    } catch (err) {
      console.warn(
        `[kv] DEL başarısız (${key}): ${err instanceof Error ? err.message : err}`,
      );
    }
  }
  MEMORY.delete(key);
}

export async function kvGetJson<T>(key: string): Promise<T | null> {
  const raw = await kvGet(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** KV-backed strict read for data where silently returning an instance-local fallback is misleading. */
export async function kvGetJsonStrict<T>(key: string): Promise<T | null> {
  if (!isKvConfigured()) return null;
  const raw = await upstashCommand(["GET", key]);
  if (typeof raw !== "string") return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** Execute an atomic Redis Lua update and parse its JSON result. */
export async function kvRunLuaJson<T>(
  script: string,
  keys: string[],
  args: string[],
): Promise<T | null> {
  if (!isKvConfigured()) return null;
  const result = await upstashCommand([
    "EVAL",
    script,
    keys.length,
    ...keys,
    ...args,
  ]);
  if (typeof result !== "string") return null;
  try {
    return JSON.parse(result) as T;
  } catch {
    return null;
  }
}

/** Atomic fixed-window counter used for shared rate limits. */
export async function kvIncrementWithTtl(
  key: string,
  ttlSeconds: number,
): Promise<number> {
  if (isKvConfigured()) {
    const result = await upstashCommand([
      "EVAL",
      "local n = redis.call('INCR', KEYS[1]); if n == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]); end; return n",
      1,
      key,
      ttlSeconds,
    ]);
    const count = Number(result);
    if (!Number.isFinite(count))
      throw new Error("KV rate limit sayacı geçersiz yanıt verdi.");
    return count;
  }

  const now = Date.now();
  const entry = MEMORY.get(key);
  const count =
    entry && (entry.expiresAt === null || entry.expiresAt > now)
      ? Number(entry.value) + 1
      : 1;
  MEMORY.set(key, { value: String(count), expiresAt: now + ttlSeconds * 1000 });
  if (MEMORY.size % 100 === 0) {
    for (const [entryKey, value] of MEMORY) {
      if (value.expiresAt !== null && value.expiresAt <= now)
        MEMORY.delete(entryKey);
    }
  }
  return count;
}

export async function kvSetJson(
  key: string,
  value: unknown,
  ttlSeconds?: number,
): Promise<void> {
  await kvSet(key, JSON.stringify(value), ttlSeconds);
}
