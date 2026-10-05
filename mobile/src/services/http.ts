// Mobile HTTP layer - thay the cho Next.js fetch cache (next: revalidate).
// Su dung in-memory cache + retry + timeout tuong duong, chay tot tren Capacitor Android.

const memCache = new Map<string, { exp: number; data: any }>();
export const CACHE_TTL_MS = 10 * 60 * 1000;

export function cacheGet(key: string): any | undefined {
  const hit = memCache.get(key);
  if (!hit) return undefined;
  if (Date.now() > hit.exp) {
    memCache.delete(key);
    return undefined;
  }
  return hit.data;
}

export function cacheSet(key: string, data: any, ttl = CACHE_TTL_MS) {
  memCache.set(key, { exp: Date.now() + ttl, data });
}

export function cacheClear() {
  memCache.clear();
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

export async function fetchJson(
  url: string,
  opts: { headers?: Record<string, string>; ttlMs?: number; retries?: number; timeoutMs?: number; noCache?: boolean } = {},
): Promise<any> {
  const { ttlMs = CACHE_TTL_MS, retries = 2, timeoutMs = 15000, noCache = false } = opts;
  if (!noCache) {
    const hit = cacheGet(url);
    if (hit !== undefined) return hit;
  }
  const headers = {
    Referer: "https://phimanh.netlify.app",
    Accept: "application/json",
    ...(opts.headers || {}),
  };
  let lastErr: any = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetchWithTimeout(url, { headers }, timeoutMs);
      if (!res.ok) {
        // Retry 5xx
        if (res.status >= 500 && attempt < retries) {
          await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
          continue;
        }
        throw new Error(`API error: ${res.status}`);
      }
      const data = await res.json();
      if (!noCache) cacheSet(url, data, ttlMs);
      return data;
    } catch (e) {
      lastErr = e;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
        continue;
      }
    }
  }
  throw lastErr;
}
