// Scan data layer — logs each SUCCESSFUL analysis to Upstash so the homepage board (Order D)
// can show "recently scanned", "top supermarkets", and "top countries". Everything here is
// fire-and-forget: a missing Upstash config or a Redis outage is a silent no-op and must never
// slow or break the user flow. No PII — product / retailer / country-level / time only.

import { Redis } from "@upstash/redis";

// Lazy client, same pattern as lib/cache.ts: null when Upstash isn't configured.
let redis: Redis | null = null;
function client(): Redis | null {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redis = new Redis({ url, token });
  return redis;
}

const RECENT_KEY = "baloo:scans:recent";
const RETAILERS_KEY = "baloo:stats:retailers";
const COUNTRIES_KEY = "baloo:stats:countries";
const RECENT_MAX = 30;

export type ScanEvent = {
  product_name: string;
  retailer: string;
  country: string | null;
  ts: number;
};

export type Board = {
  recent: ScanEvent[];
  topRetailers: { name: string; count: number }[];
  topCountries: { name: string; count: number }[];
};

// Fire-and-forget. Never throws; safe to call without awaiting. Logs a scan only for a real result.
export async function recordScan(scan: {
  product_name: string;
  retailer: string;
  country?: string | null;
}): Promise<void> {
  const c = client();
  if (!c || !scan.product_name) return;
  try {
    const event: ScanEvent = {
      product_name: scan.product_name,
      retailer: scan.retailer,
      country: scan.country ?? null,
      ts: Date.now(),
    };
    // Capped recent-scans list (newest first).
    await c.lpush(RECENT_KEY, event);
    await c.ltrim(RECENT_KEY, 0, RECENT_MAX - 1);
    // Leaderboards.
    if (scan.retailer) await c.zincrby(RETAILERS_KEY, 1, scan.retailer);
    if (scan.country) await c.zincrby(COUNTRIES_KEY, 1, scan.country);
  } catch (err) {
    console.error("recordScan error (ignored):", err);
  }
}

// Reads the board data. Silent no-op path returns empty arrays. Consumed by Order D.
export async function getBoard(topN = 5): Promise<Board> {
  const empty: Board = { recent: [], topRetailers: [], topCountries: [] };
  const c = client();
  if (!c) return empty;
  try {
    const [recentRaw, retailers, countries] = await Promise.all([
      c.lrange<unknown>(RECENT_KEY, 0, RECENT_MAX - 1),
      c.zrange<(string | number)[]>(RETAILERS_KEY, 0, topN - 1, { rev: true, withScores: true }),
      c.zrange<(string | number)[]>(COUNTRIES_KEY, 0, topN - 1, { rev: true, withScores: true }),
    ]);
    return {
      recent: (recentRaw ?? [])
        .map(toEvent)
        .filter((e): e is ScanEvent => e !== null),
      topRetailers: pairs(retailers),
      topCountries: pairs(countries),
    };
  } catch (err) {
    console.error("getBoard error (ignored):", err);
    return empty;
  }
}

// Upstash auto-deserializes JSON on read, but be tolerant if a raw string comes back.
function toEvent(raw: unknown): ScanEvent | null {
  try {
    const o = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (o && typeof o === "object" && "product_name" in o) return o as ScanEvent;
  } catch {
    /* ignore a malformed entry */
  }
  return null;
}

// ZRANGE ... WITHSCORES returns a flat [member, score, member, score, ...] array.
function pairs(flat: (string | number)[] | null): { name: string; count: number }[] {
  if (!flat) return [];
  const out: { name: string; count: number }[] = [];
  for (let i = 0; i < flat.length; i += 2) {
    out.push({ name: String(flat[i]), count: Number(flat[i + 1]) });
  }
  return out;
}
