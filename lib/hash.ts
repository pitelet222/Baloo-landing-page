import { createHash } from "crypto";

// Normalise then hash the product URL so the same product maps to one cache key.
export function hashUrl(url: string): string {
  let normalised = url.trim();
  try {
    const u = new URL(url);
    // Drop query/hash so tracking params don't fragment the cache.
    normalised = `${u.hostname}${u.pathname}`.toLowerCase().replace(/\/$/, "");
  } catch {
    /* fall back to the raw string */
  }
  return createHash("sha256").update(normalised).digest("hex").slice(0, 32);
}
