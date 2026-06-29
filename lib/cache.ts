// Server-side cache keyed by a hash of the product URL.
// Optional: if Upstash env vars are absent, every call is a safe no-op so the app still runs.

import { Redis } from "@upstash/redis";
import { CACHE_TTL_SECONDS } from "./config";
import type { CachedResult } from "./schema";

let redis: Redis | null = null;
function client(): Redis | null {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redis = new Redis({ url, token });
  return redis;
}

export async function cacheGet(key: string): Promise<CachedResult | null> {
  const c = client();
  if (!c) return null;
  try {
    return (await c.get<CachedResult>(`baloo:${key}`)) ?? null;
  } catch (err) {
    console.error("cacheGet error:", err);
    return null;
  }
}

export async function cacheSet(key: string, value: CachedResult): Promise<void> {
  const c = client();
  if (!c) return;
  try {
    await c.set(`baloo:${key}`, value, { ex: CACHE_TTL_SECONDS });
  } catch (err) {
    console.error("cacheSet error:", err);
  }
}
