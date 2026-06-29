# Baloo — Landing Page Build Playbook

**Owner:** Miquel  **Target:** 2–3 days  **Version:** 1.0  **Date:** June 2026

The build plan for the baloo.life web tool: paste a supermarket product URL → ingredient
breakdown. This playbook pairs with the scaffolded repo (`baloo-web/`) — the scaffold already
stands up Phases 0–2; this doc is how you take it to "done," with the Claude Code prompts, the
`CLAUDE.md` (also in the repo), and the decisions that matter.

---

## 1. Approach in one paragraph

It's a Next.js app on Vercel, so unlike the extension there's a real backend: the Firecrawl and
Anthropic keys live as **server-side environment variables** and never reach the browser — the API
routes *are* the secure proxy, so there's no bundled-key risk, no CORS header, no "move to a proxy
later." The pipeline is `URL → Firecrawl (markdown) → Claude extract → Claude analyse → stream
cards`, with **Claude as the extraction layer** so there are no brittle per-retailer parsers. The
streaming is done with the **Vercel AI SDK** (`streamObject` server-side, `useObject` on the
client), which is the single biggest reason this is fast to build well — the brief calls streaming
"the most important UX decision," and the SDK gives it to you out of the box. Caching is server-side
in **Upstash Redis** (Vercel KV is retired) keyed by a hash of the URL.

---

## 2. Key technical decisions

**Keys are server-side env vars.** `ANTHROPIC_API_KEY`, `FIRECRAWL_API_KEY`, the Upstash pair, and
`LOOPS_API_KEY` all live in Vercel project settings / `.env.local`. Never `NEXT_PUBLIC_*`. This is
the production-safe setup from day one.

**Firecrawl is essential here (unlike the extension).** The landing page only has a URL, server-side,
and supermarket pages are JavaScript-rendered, so a plain fetch sees nothing. Firecrawl renders the
page and returns clean markdown. The scaffold calls Firecrawl's `/v2/scrape` REST endpoint directly
(no SDK dependency to drift), requesting `markdown` with `onlyMainContent: true` to cut tokens.

**Claude as the extraction layer.** Pass the markdown to Claude (call 1, `generateObject` + a Zod
schema) to pull product name, retailer, ordered ingredient list, and percentages. No CSS selectors,
no regex-per-retailer. Then call 2 (`streamObject`) analyses each ingredient. Start with two calls
for clarity; combine into one later if latency matters, exactly as the brief says.

**Streaming via the AI SDK.** `streamObject({ model, schema })` on the server returns
`result.toTextStreamResponse()`; `experimental_useObject({ api, schema })` on the client gives you a
growing partial object, so cards render one by one as they stream. This is the brief's top priority
and the scaffold wires it for you.

**Two requests, clean loading states.** `/api/extract` runs Firecrawl + extract and returns the
header (product name, retailer, count) — this is the "Reading ingredients…" phase. Then the client
fires `/api/analyze`, which streams the cards — the "Analysing with AI…" phase. The header shows
before any card, and the phase text changes naturally. (The extracted ingredient list is passed to
call 2, so the page is not re-scraped.)

**Caching.** Hash the product URL; `/api/extract` checks the cache first and returns a full cached
result instantly when present (no Firecrawl, no Claude). `/api/analyze` writes the finished analysis
to Upstash on stream completion with a 7-day TTL. Caching is optional in code — the app runs without
Upstash configured, it just won't cache.

---

## 3. Build phases (2–3 days)

| Phase | What | Est. | Done when |
|------|------|------|-----------|
| **0. Setup** | `create-next-app`, git, Vercel project linked, deploy hello-world to a preview URL, `.env` placeholders | done in scaffold | Preview URL loads |
| **1. Homepage shell** | Centered URL input + Analyse, client-side validation, supported-retailer row, results area stubbed on fixtures | mostly in scaffold | UI renders + validates with no keys |
| **2. Pipeline (non-streamed)** | `/api/extract`: Firecrawl → Claude extract → JSON, proven on one test URL | scaffolded; needs keys | One URL returns correct name + ingredients |
| **3. Streaming** | `/api/analyze` with `streamObject`; client `useObject` renders cards progressively; loading-state transitions | scaffolded; needs keys | Cards stream in, in label order |
| **4. Caching** | Upstash Redis, URL hash, 7-day TTL, instant cache hits | scaffolded; needs Upstash | Second submit of same URL is instant |
| **5. Error states** | Login wall / anti-bot / no ingredients / bad URL → one friendly message, never raw errors | partial in scaffold | All four failure paths show the clean message |
| **6. Email capture** | `/api/subscribe` → Loops; "You're on the list." | scaffolded; needs Loops | Email lands in Loops |
| **7. Deploy + DoD** | Connect baloo.life, test 10+ URLs across 3+ retailers, run checklist | — | Definition of Done passes |

Day 1: Phases 0–2 (and start 3). Day 2: 3–4. Day 3: 5–7 + buffer.

---

## 4. Claude Code prompts (run from the repo root, in order)

The scaffold compiles and the UI runs on fixtures before any key exists. These prompts wire the
live pipeline and finish each phase. Approve a plan before letting it write, and commit per phase.

**Prompt 0 — orient**
```
Read CLAUDE.md and the Baloo landing-page brief. This is a Next.js App Router app whose pipeline is
URL -> Firecrawl -> Claude extract -> Claude analyse -> stream cards. Walk the existing code in
app/, lib/, and components/ and summarise what's already wired and what's stubbed. Don't change code
yet — just give me the map and flag anything that looks wrong or version-sensitive.
```

**Prompt 1 — verify the pipeline end to end (non-streamed first)**
```
With the keys set in .env.local, make /api/extract work on this URL: <paste an Oatly-on-Ocado URL>.
Confirm Firecrawl returns markdown, Claude extract returns the right product name + ordered
ingredient list + percentages. Log the intermediate markdown length and the parsed object. Fix the
extraction prompt or Zod schema if the output is wrong. Don't touch streaming yet.
```

**Prompt 2 — streaming polish**
```
Now make the full flow stream. On submit, the homepage should show "Reading ingredients…", then
switch to "Analysing with AI…" once /api/extract returns, then render ingredient cards one by one as
/api/analyze streams via useObject. Verify cards appear progressively (not all at once) on a 20+
ingredient product (Pringles). Keep label order intact — never re-sort.
```

**Prompt 3 — caching**
```
Wire Upstash Redis caching. /api/extract should return a full cached result instantly when the URL
hash is present (skipping Firecrawl + Claude); /api/analyze should write the finished analysis on
completion with a 7-day TTL. Add a small dev-only "served from cache" indicator. Confirm a second
submit of the same URL makes no Firecrawl/Claude calls.
```

**Prompt 4 — error states**
```
Make every failure show the brief's single friendly message — "We couldn't read that page. Try a
direct product link from Whole Foods, Ocado, Tesco, Target, or Kroger." — and never a raw error.
Cover: malformed URL (caught client-side before any call), Firecrawl scrape failure / anti-bot
block, login-walled page, and a page with no ingredient list (test with a kitchen-utensil URL).
Each should land cleanly with the input still usable for another try.
```

**Prompt 5 — email + deploy**
```
Wire /api/subscribe to Loops (POST the email; key in LOOPS_API_KEY), returning success even if Loops
is slow, and show "You're on the list." Then prepare for deploy: confirm all env vars are documented
in .env.example, set maxDuration on the API routes for the Firecrawl+Claude latency, and give me the
exact Vercel steps to deploy and connect baloo.life.
```

**Prompt 6 — combine calls (optional, only if latency is bad)**
```
If the two-call latency is too high, combine extract + analyse into a single streamObject call that
takes the Firecrawl markdown and streams analysed ingredient cards directly, while still surfacing
product name + retailer early. Measure before and after on the Pringles URL.
```

**Working with Claude Code well**
- Commit after each phase; the scaffold is your clean baseline.
- Use the fixtures in `fixtures/test-urls.ts` — they include the brief's products plus a "no
  ingredients" URL for the error path.
- Paste real console/Firecrawl errors back in rather than describing them.
- Keep the pipeline in `lib/` framework-agnostic (it already is) so the mobile app can reuse it.

---

## 5. Tooling

| Tool | Why |
|------|-----|
| **Next.js (App Router) + TypeScript + Tailwind**, on Vercel | Frontend + backend in one, one-click deploy, free tier is plenty at this stage. |
| **Vercel AI SDK** (`ai`, `@ai-sdk/anthropic`, `@ai-sdk/react`) | `streamObject` + `useObject` give progressive card streaming without hand-rolling SSE. The headline quality/time win. |
| **Zod** | One schema drives the extraction object *and* runtime validation; malformed output degrades gracefully. |
| **Firecrawl** (`/v2/scrape` REST) | Managed JS rendering + anti-bot + proxies; no scraping infra to own. |
| **Upstash Redis** (Vercel Marketplace) | Server-side cache by URL hash, 7-day TTL. Vercel KV is retired; Upstash is the current path. |
| **Claude Code + `CLAUDE.md`** | Build engine; the checked-in `CLAUDE.md` keeps the pipeline rules and out-of-scope list stable across sessions. |
| **Loops.so** | Email capture (shared with Noi); free plan is fine for capture-only. |
| **Stripe** | Account set up now, no code in v1. |

---

## 6. Decisions on the open questions

- **Email → Loops.so** (Sheet webhook as the trivial fallback), behind one env var.
- **API keys → both Firecrawl + Anthropic**, as server-side Vercel env vars. Set spend caps.
- **Design → neutral**: white, ink text, green pill = Natural, amber = Processed, centered URL hero.
  Confirm whether a Baloo logo exists; otherwise the wordmark is plain text.
- **Domain → preview URLs during dev, point baloo.life at it once the DoD passes.** Needs DNS access
  to baloo.life (or Jitain to add Vercel's records) for the final cutover.
- **Sequencing → confirm with Jitain.** The brief suggests he roughs a POC first, then hands you the
  hard parts (streaming, caching, errors, polish). Either way that's where your value is; repo setup
  isn't blocked.
- **Stripe → account only, no v1 code.**

---

## 7. Risks & how we de-risk

- **Anti-bot / login walls** — some retailers block even Firecrawl, or hide product detail behind
  login. Mitigation: the single friendly error state; lean on the five well-behaved retailers from
  the brief for the DoD.
- **Latency (5–15s)** — Firecrawl + two Claude calls. Mitigation: streaming (cards start appearing
  fast), caching (repeat URLs instant), and the optional single-call combine if needed.
- **AI SDK version drift** — the SDK moves quickly. The scaffold pins a known-good major; if you
  upgrade, Claude Code can migrate the few import/function changes.
- **Cost** — Firecrawl free tier (1,000 pages/mo) + cache covers early traffic at ~zero; Claude
  usage is small per analysis. Set caps anyway.

---

## 8. Definition of Done

- [ ] Paste a Whole Foods / Ocado / Tesco / Target / Kroger product URL → full breakdown
- [ ] Cards stream progressively — no blank wait
- [ ] Same URL twice → instant from cache
- [ ] Errors handled cleanly — no raw messages
- [ ] Email capture works and emails land in Loops
- [ ] Deployed live on baloo.life via Vercel
- [ ] Tested on 10+ URLs across 3+ retailers
