# Baloo — Landing Page Web Tool

Paste a supermarket product URL → get a streamed, per-ingredient breakdown (what each ingredient is,
why it's in that product, Natural/Processed, any listed %). Next.js + Firecrawl + Claude.

## Quick start

```bash
npm install
cp .env.example .env.local   # fill in keys (see below)
npm run dev                  # http://localhost:3000
```

The UI runs immediately with no keys — you can type and validate URLs. The live analysis turns on
once `ANTHROPIC_API_KEY` and `FIRECRAWL_API_KEY` are set.

## Environment variables (server-side only)

| Variable | Needed for | Where to get it |
|---|---|---|
| `ANTHROPIC_API_KEY` | The analysis (required) | console.anthropic.com |
| `FIRECRAWL_API_KEY` | Scraping product pages (required) | firecrawl.dev |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Caching (optional) | Vercel → Marketplace → Upstash Redis |
| `LOOPS_API_KEY` | Email capture (optional) | loops.so |

Never prefix these with `NEXT_PUBLIC_` — they must stay on the server.

## How it works

```
app/page.tsx ── POST /api/extract ──> Firecrawl scrape ──> Claude extract (generateObject)
             └─ POST /api/analyze ──> Claude analyse (streamObject) ──> cards stream via useObject
```

- `/api/extract` checks the cache first; a hit returns the full result instantly.
- `/api/analyze` streams ingredient cards and writes the finished analysis to cache (7-day TTL).
- All failures surface one friendly message; nothing technical reaches the user.

## Project layout

```
app/
  page.tsx              the tool (URL input → loading → streamed results → email)
  api/extract/route.ts  cache check + Firecrawl + Claude extract
  api/analyze/route.ts  streamObject analysis + cache write
  api/subscribe/route.ts email → Loops
components/              UrlForm, LoadingState, ResultsView, IngredientCard, EmailCapture, RetailerRow
lib/                     schema (Zod), prompts, firecrawl, cache, hash, retailers, config
fixtures/test-urls.ts    brief's test products + a no-ingredients error case
```

## Deploy (Vercel)

```bash
npx vercel            # link/create the project
npx vercel env add    # add the env vars (or via the dashboard)
npx vercel --prod     # deploy
```

Add caching from **Vercel → Storage/Marketplace → Upstash Redis** (Vercel KV is retired); it injects
the Upstash env vars automatically. Connect **baloo.life** under the project's Domains once it passes
the checklist in `Baloo_LandingPage_Playbook.md`.

## Notes
- Pinned to the AI SDK v4 line; see `CLAUDE.md` if you upgrade.
- `claude-sonnet-4-6` is set in `lib/config.ts`.
```
# Baloo-landing-page
