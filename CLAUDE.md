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
