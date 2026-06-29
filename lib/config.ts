// Central constants. Keys are read from env at call sites, never hard-coded.

export const MODEL = "claude-sonnet-4-6";

// Cache time-to-live: 7 days, per the brief.
export const CACHE_TTL_SECONDS = 7 * 24 * 60 * 60;

// API routes do a Firecrawl scrape + one or two Claude calls; give them room.
export const ROUTE_MAX_DURATION = 60;

// Retailers the brief commits to supporting. Used for client-side URL validation
// and for the friendly error copy. Extend by adding to this list.
export const SUPPORTED_RETAILERS: { name: string; match: string[] }[] = [
  { name: "Whole Foods", match: ["wholefoodsmarket.com", "wholefoods.com"] },
  { name: "Ocado", match: ["ocado.com"] },
  { name: "Tesco", match: ["tesco.com"] },
  { name: "Target", match: ["target.com"] },
  { name: "Kroger", match: ["kroger.com"] },
];
