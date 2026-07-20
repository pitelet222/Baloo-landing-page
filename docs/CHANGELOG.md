# Baloo — Changelog

> Human-readable record of what **shipped**, newest first. Append an entry when a milestone lands
> (a phase, an order, or a notable fix) — one bullet per meaningful change, with the commit. This is
> the curated story; `git log` is the full record. Deeper "how it works" lives in
> [`ARCHITECTURE.md`](ARCHITECTURE.md); what's *planned* lives in `Baloo_Launch_Plan.md`.

## Unreleased / in progress
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
