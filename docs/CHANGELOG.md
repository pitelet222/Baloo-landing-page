# Baloo — Changelog

> Human-readable record of what **shipped**, newest first. Append an entry when a milestone lands
> (a phase, an order, or a notable fix) — one bullet per meaningful change, with the commit. This is
> the curated story; `git log` is the full record. Deeper "how it works" lives in
> [`ARCHITECTURE.md`](ARCHITECTURE.md); what's *planned* lives in `Baloo_Launch_Plan.md`.

## Unreleased / in progress
- **L1d-1 — V3 app shell (design port, slice 4a):** the header is now a **full-width, sticky, blurred
  bar** across every app page instead of a header hand-copied inside each 640px column. `SiteHeader`'s
  `left` variant renders `sticky top-0 w-full border-b bg-canvas/75 backdrop-blur-md` with an inner
  container width-matched to the page (`width="tool"` default, `"wide"` = 1140px on Discover), and is
  lifted out of `<main>` to sit as a sibling so it can go edge-to-edge; each page's outer wrapper became
  a `flex min-h-screen flex-col` with `main` as `flex-1` (footer stays anchored). New `HeaderNav` client
  island marks the **active section** via `usePathname()` (active = ink, inactive = muted) and folds in
  the old admin gate (`AdminNavLink` removed). Welcome keeps its centered, non-sticky onboarding header
  (deliberately outside the shell). The **header search overlay** is the next slice (L1d-2). No data
  changes, no new deps. Verified live: sticky `top:0`/`z-40`/`blur(12px)`/`canvas/75` full-bleed bar,
  per-page inner width (640/1140), active pill on `/discover`·`/lists`·`/feed`, content clears the bar,
  pinned after scroll, product AddToList + AccountMenu (dropdown above content) intact, L1c count
  unchanged, console clean, `build` green.
- **L1c — V3 analysis view (design port, slice 3):** the analysis screen Jitain singled out. The
  ingredient count is now the **hero of the screen** — a big Playfair `natural`-green number (58px) +
  "ingredients in this product" (Playfair 23px) + an "In label order — N natural, N processed"
  subline (counts computed in code, never the model). The `ReadStrip` line folds into this
  `CountLede` block; `count` comes from extract so the number is striking immediately, even mid-stream.
  Rows lose the `01` zero-pad for a plain Playfair `1, 2, 3`; the tap-expand becomes V3's **two-beat**
  labelled blocks — uppercase "What it is" / "In this product" rubrics over each text (each beat
  hides when its field is empty). Design canon gained a documented **Statement** type step (the one
  Playfair-number-as-statement exception to counts-in-Inter). Verified live on `/p/oatly-…`:
  count = Playfair 58px `rgb(46,125,82)`, plain row numbers, both beats render, Nutrition tab intact,
  console clean. The `role` microlabel was **kept** (documented F rule) — V3's row drops it; Jitain to
  confirm. L1d (sticky app shell + header search overlay) + per-screen passes still open.
- **L1b — V3 homepage (design port, slice 2):** rebuilt the homepage to the V3 layout. New
  `HomeSearch` is the locked dual-intent box — paste a URL → analyse (existing flow); type anything
  else → `/discover` search (keyword now, L3 semantic later) — with a live intent chip. V3 hero
  (eyebrow rule, Playfair h1 with the italic-green "your", lede), SiteHeader nav → pills, and a new
  `PopularLists` strip (`/api/popular`, saves-only, hides when no signal). `UrlForm` removed.
  Verified live: hero + intent detection (text→Search, URL→Product link) + Popular card renders with
  a real save + all pages 200 + clean console. Sticky full-width shell + count view are L1d/L1c.
- **L1a — the V3 world (design port, slice 1):** the whole app moved to V3 "warm boutique" via the
  token layer — cream `#F4EDE3` canvas, warm paper `#FDFAF6`, brown-black ink `#2D2417`, warm
  hairline `#E8DDD0`, **Playfair Display** display font, warm-tinted shadows. `lib/cover.ts` covers
  are now flat V3 tints (no gradients); OG route matched. Natural/Processed (green/amber) untouched —
  still the one meaningful colour. Design canon (`DESIGN.md` + `.impeccable/design.json`) updated to
  V3 so the design hook enforces the new system. `muted` darkened to `#766753` for WCAG AA on cream
  (measured 4.71:1). Verified live: bg/type/covers/tags/contrast + clean console. Layout restructures
  (hero, dual-intent search, count view) come in L1b/L1c.
- **L6 — Save-only (upvote removal):** the product/list Upvote is gone — Save is the one social
  signal. Votes API narrowed to comments (product/list → 400), the UpvotePill mounts removed from
  the list + product pages, "Popular this week" ranks by saves alone, and the feed no longer shows
  "upvoted" stories. Comment upvotes stay (they drive the thread's Top sort). Non-destructive — no
  migration, historical vote rows kept. Verified: API matrix (400/400/200-toggle), all pages, no
  console errors. *Remainder still open: product-favouriting + add-to-multiple-lists (needs schema).*
- **L5c — visibility auto-public:** a profile is private until it has ≥1 public list. `/u/[handle]`
  now `notFound()`s for non-owners of a 0-public-list profile, `generateMetadata` goes generic when
  private (no name/bio leak), and the owner gets a "publish a list to go public" nudge (Share hidden).
  Discovery surfaces were already compliant (search returns no profiles; suggested-curators inner-joins
  public lists). Verified: non-owner 404, owner nudge, public profiles unaffected.
- **L7 — region prioritisation:** Discover's "Recently added" grid soft-ranks by "% of a list's
  products purchasable in the viewer's region" — a retailer→region map (`lib/config.ts` +
  `lib/retailers.ts`), availability math (`lib/region.ts`), a batch composition query
  (`getListsRetailers`) + `withRegionAvailability`, a server-side "Shopping in US/UK" toggle, and a
  neutral availability line on `ListCard`. No migration (derived from `products`/`offers.retailer`);
  never a hard filter. Region math + the live query verified.
- **V3 design review (21 Jul):** 3 decisions logged (Upvote→Save, auth flow, share-card gradients) +
  L7 added as a build order. (`53633c4`)
- **Security S5 — response headers:** `next.config.mjs` now sends HSTS, X-Frame-Options DENY,
  nosniff, Referrer-Policy and Permissions-Policy (enforcing) plus a **report-only** CSP whose
  `connect-src` includes the Supabase origin. Verified: headers present, sign-in works through the
  CSP, zero violations. Two dashboard toggles left for M (leaked-password protection, Vercel WAF).
- **Security S1 — rate limiting:** `lib/ratelimit.ts` (sliding-window, Upstash, fail-open) on the
  paid routes — extract/analyze/nutrition-context by IP, explain/products-analyze by user — with a
  friendly 429. Inert until the Upstash REST vars are set. (`9eaf514`)
- **Security S2 — guest-publish wall:** `requireVerifiedUser()` — guests may analyse but every
  community write (lists/comments/follows/votes/saves/reports) needs a real account; client controls
  get a shared `useAuthGate()` that prompts sign-in/upgrade. Captcha deferred.
- **Docs:** rewrote the README for the current (Phase 3) product; added this changelog and
  `ARCHITECTURE.md` as the living technical reference.
- **Security plan (S-series):** audited shipped auth; recorded the hardening plan (rate limits,
  captcha + no-publish-for-guests, custom SMTP, account deletion). Not yet implemented — see
  `Baloo_Launch_Plan.md`. (`9eb4c97`)
- **Org pass:** archived 12 historical docs to `docs/archive/`, added CI (typecheck + build),
  allowlisted read-only MCP tools. (`58ad98a`, `0c2c837`)
- **Launch plan (beta):** V3 design direction chosen; save-only, search-as-homepage, seed-supply
  decisions locked. (`efeda08`)

## Phase 3 — Community platform (shipped)
- **P1–P2 — Product/Offer + analysis engine:** `offers` table, `analysis_status`, pg_trgm; a
  framework-agnostic pipeline (`lib/analysis/`), a resumable background analyse engine
  (`runAnalysisForProduct`), the identity short-circuit (known product → skip analysis, add an
  offer), offers RLS, and the `ANALYSIS_MAX_TOKENS` fix for silently-truncated long analyses.
- **G9 — Moderation:** reports, admin queue (`/admin`), soft-hide tombstones, self-delete,
  `requireAdmin`.
- **G8 — Comments + "Explain this":** threaded comments; an AI explanation card (`/api/explain`).
- **G7 — Signals:** saves + votes with a popularity ranking.
- **G6 — Follows + feed:** the social graph, `/feed`, and the `activity` event log.
- **G5 — Discovery + profiles:** `/discover`, public `/u/[handle]` profiles, cross-entity search.
- **G4 — Lists:** create/edit, public list pages, covers, OG share images, add-to-list.
- **G3 — Canonical catalog:** dedupe on `canonical_key`, product pages (`/p/[slug]`), shared
  ingredient cache, ingest into Postgres.
- **G2 — Accounts:** Supabase Auth (email/Google/guest), `requireUser`, `/welcome` handle setup.
- **G1 — Foundation:** Drizzle schema, lazy DB client (optional-infra), RLS policies, seed/check
  scripts.

## Phase 2 — Nutrition + richer analysis (shipped)
- **Order D — Homepage board:** live "recent scans / top retailers" board over Redis, load-time only.
- **Order F — Progressive ingredient list:** collapsed rows (rank, name, %, role, N/P) unfolding to
  the full explanation; neutral `role` + one-sentence `product_summary`.
- **B1–B4 — Nutrition:** verbatim panel extraction, UK reference intakes (presets), all maths in
  code (`lib/nutrition.ts`), a neutral nutrition tab with the always-on disclaimer — no scores.
- **Order C — Scan logging:** fire-and-forget `recordScan` (no PII) powering the board.
- **Order A — Richer descriptions:** rewritten nutritionist prompt.

## Phase 1 — The tool (shipped)
- URL → Firecrawl scrape → Claude extract → streamed per-ingredient analysis, with a 7-day Redis
  URL cache, optional Loops email capture, and the single friendly-error contract. Runs with no keys
  via the mock pipeline.
