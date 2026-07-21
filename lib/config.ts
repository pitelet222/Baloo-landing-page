// Central constants. Keys are read from env at call sites, never hard-coded.

export const MODEL = "claude-sonnet-4-6";

// Cache time-to-live: 7 days, per the brief.
export const CACHE_TTL_SECONDS = 7 * 24 * 60 * 60;

// API routes do a Firecrawl scrape + one or two Claude calls; give them room.
export const ROUTE_MAX_DURATION = 60;

// Max output tokens for the per-ingredient analysis (Order P2 — this was a real bug).
// The AI SDK's Anthropic provider defaults to 4096 output tokens. The Order-A prompt asks for
// 2-3 sentences of what_it_is AND why_its_here for EVERY ingredient, so a long label blows past
// 4096: the model stops at finishReason 'length', the object never validates, and the whole
// analysis is lost — silently, because the persist runs inside after(). Set it generously; we pay
// for tokens produced, not for the ceiling.
export const ANALYSIS_MAX_TOKENS = 16000;

// Retailers the brief commits to supporting. Used for client-side URL validation
// and for the friendly error copy. Extend by adding to this list.
// `region` (Order L7) is the market a retailer serves — drives Discover's "% available where you
// shop" soft-ranking. Derived here in code (the retailer set is small + static), never stored.
export const SUPPORTED_RETAILERS: { name: string; match: string[]; region: "US" | "UK" }[] = [
  { name: "Whole Foods", match: ["wholefoodsmarket.com", "wholefoods.com"], region: "US" },
  { name: "Ocado", match: ["ocado.com"], region: "UK" },
  { name: "Tesco", match: ["tesco.com"], region: "UK" },
  { name: "Target", match: ["target.com"], region: "US" },
  { name: "Kroger", match: ["kroger.com"], region: "US" },
];
