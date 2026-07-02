# Baloo — Landing Page Web Tool (v1)

## What this is
A Next.js (App Router) web tool on baloo.life. The user pastes a supermarket product URL, hits
Analyse, and gets a streamed, per-ingredient breakdown: what each ingredient is, why it's in this
product, a Natural/Processed tag, and any listed %. The homepage IS the tool — no separate landing
and app pages. This is the prototype for a future mobile app; keep the pipeline portable.

## Pipeline (do not deviate without flagging)
`URL → Firecrawl (markdown) → Claude extract → Claude analyse → stream cards`
- /api/extract  — validate URL, check cache, Firecrawl scrape, Claude `generateObject` extract.
                  Returns a full cached result OR the header + ordered ingredient list.
- /api/analyze  — Claude `streamObject` per-ingredient analysis; streams to the client; writes the
                  finished result to cache on completion.
- /api/subscribe — email → Loops (graceful if not configured).
- app/page.tsx  — client orchestrator: extract first ("Reading ingredients…"), then stream analyse
                  via `experimental_useObject` ("Analysing with AI…").

## Hard rules
- Keys are SERVER-SIDE env vars only: ANTHROPIC_API_KEY, FIRECRAWL_API_KEY, UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN, LOOPS_API_KEY. Never NEXT_PUBLIC_*. Never call these APIs from the client.
- Model: claude-sonnet-4-6 (see lib/config.ts). Use the AI SDK: `generateObject` for extract,
  `streamObject` + `experimental_useObject` for the streamed analysis.
- Claude is the extraction layer — NO per-retailer CSS/regex parsers.
- Ingredient order = label order (most-to-least by quantity). Preserve it; never re-sort.
- Cache (Upstash Redis) keyed by hashUrl(url), 7-day TTL. Caching and email are OPTIONAL in code —
  the app must run with those env vars absent.
- Every failure shows ONE friendly message, never a raw error:
  "We couldn't read that page. Try a direct product link from Whole Foods, Ocado, Tesco, Target,
  or Kroger."

## Data layer (Phase 2 — scan logging)
- On every SUCCESSFUL analysis, `lib/stats.ts` logs a scan to Upstash: a capped "recent scans" list
  plus "top retailers" and "top countries" sorted sets. Powers the homepage board (Order D) and,
  later, B2B trends (which graduate to Postgres).
- `recordScan` is fire-and-forget and MUST never slow or break the user flow; like the cache, it is
  a silent no-op when the Upstash env vars are absent.
- Privacy: NO PII. Product name, retailer, country-level (Vercel geolocation), and timestamp only —
  no user identity, no exact location, no dedup by user.
- Feature flag: `SHOW_TOP_SCANNERS` stays off until accounts exist.

## Nutrition rules (Phase 2 — B1–B4)
- Extraction (B1) captures the nutrition panel verbatim — values exactly as printed, never
  invented or converted; empty when a page has no panel.
- ALL arithmetic happens in code (`lib/nutrition.ts`, Order B3) — the model never calculates;
  it only writes short, neutral context sentences around numbers computed in code.
- NO health score, NO nutrient colour-coding (no red/green), NO good/bad verdicts. Bars and
  numbers are neutral (ink-tinted); context, not judgment.
- Nutrition context is general education, not advice: the disclaimer is always shown, and child
  framing stays neutral and non-restrictive ("General estimate from public UK reference values
  (FSA/NHS) — not personalised medical or dietary advice.").
- Profiles = UK reference daily intakes in `lib/profile.ts` (PHE "Government Dietary
  Recommendations" 2016 + NHS front-of-pack RIs; sources cited in the file). Presets only, no
  custom profiles in v1. Choice persists in localStorage — no accounts.
- Context line: `/api/nutrition-context` generates it once per product×profile (Upstash-cached,
  7 days). Percentages and highlight selection are computed in code (`lib/nutrition.ts`); Claude
  only phrases the given numbers, and a deterministic fallback sentence covers missing keys or
  model errors so the Nutrition tab never blocks.

## Tone for the analysis model (verbatim)
"You are a knowledgeable, calm nutritionist. Education before persuasion. Never alarmist. Never
tell the user what to buy or avoid. Explain what ingredients are and why they are used. Context
over judgment." (in lib/prompts.ts)

## Out of scope for v1 (do not build)
Accounts/login, saved history, nutrition facts panel, scores/ratings, comparisons/alternatives,
mobile/native, paid subscriptions (Stripe account only, no paywall), non-food products,
multiple languages.

## Versions / gotchas
- Pinned to AI SDK v4 line (`ai` ^4, `@ai-sdk/*` ^1). If you upgrade to a newer major, the import
  paths / function names may shift (e.g. `experimental_useObject`, `toTextStreamResponse`) — migrate
  per the AI SDK docs.
- Firecrawl is called via REST (/v2/scrape) in lib/firecrawl.ts to avoid SDK version drift; verify
  the response shape if Firecrawl changes it.
- Keep the pipeline in lib/ framework-agnostic so the mobile app can reuse it.
