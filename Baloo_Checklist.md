# Baloo — Master Checklist

> Living list of what's **pending** across every phase. Markdown checkboxes paste straight into
> Notion as to-do blocks. Update as orders land; the detailed reasoning lives in
> `Baloo_Phase3_ProductOffer_Reconciliation.md` (the plan) and `Baloo_Phase3_Build_Orders.md` (the spec).
>
> **Owners:** **M** = Miquel · **J** = Jitain · **CC** = Claude Code · **CD** = Claude Design
> **Last updated:** after `58ad98a` (org pass) — **launch pivot: see `Baloo_Launch_Plan.md`**

## 🚀 Launch track (beta) — the new top priority
> Jitain wants a beta out **soon**. Full ordering + locked decisions in `Baloo_Launch_Plan.md`.
> ✅ **Design direction chosen: V3** (warm boutique) — the old blocker is resolved.

**Tier A — beta-blocking:**
- [ ] **L1 — V3 design port** (starts with Mobbin refs + app shell; PART C ritual; design the dual-intent search box) — **CC/CD/M**
- [ ] **L4 — Seed supply**: official accounts (@baloo/@balooteam/@proteinpicks/@kidslunchbox) + genuinely good starter lists — **M/CC**
- [ ] **L5c — Visibility auto-public**: profile public only when ≥1 public list, else private — **CC**
- [ ] **L2 — Social sharing** (= P8, pulled forward): IG card via `navigator.share` + WhatsApp/Telegram/FB intents + sharing-card template — **CC**

**Tier B — fast-follow (days after beta):**
- [ ] **L3 — AI semantic search over public lists** (search-as-homepage; pgvector vs LLM-rerank TBD) — **CC**
- [ ] **L6 — Save-only reconciliation** (remove list Upvote, Popular = saves) + scanned-product organisation (favourite / add-to-multiple-lists) — **CC** *(needs J's confirm)*
- [ ] **L5a/b — Identity**: `baloo.life/@username` URL + username change with permanent redirect — **CC**

**Decisions still owed from Jitain** (in `Baloo_Launch_Plan.md`): Upvote→Save removal · comments/feed/moderation at launch · semantic-search infra · `/@username` URL cutover timing.

## Phase 3 — Product/Offer (P-series)  *(Tier C / interleaves after beta)*

**Shipped:** ✅ **P1** (offers table, `analysis_status`, pg_trgm) · ✅ **P2** (pipeline lib, background
analyse engine, identity short-circuit, offers RLS, and the `maxTokens` prod-bug fix)

- [ ] **P3 — Two-mode add-product** *(next up; the P2 engine is ready to call)* — **CC**
  - [ ] Catalogue search in the list-builder: **own products first**, recents shown before typing
  - [ ] Detect a pasted URL → **"Analyse & add"** → background via `runAnalysisForProduct()` in `after()`
  - [ ] Migration: `list_items` allows **unresolved items** (nullable `product_id` + `free_text` + resolved flag)
  - [ ] "Unresolved — no analysis" row state + a visible "add link" affordance
  - [ ] Status surfacing: `pending → analysing → done | failed` (Supabase Realtime, fallback poll) + retry
- [ ] **P4 — "Also available at A, B, C"** *(pure frontend — `getOffersForProduct` already exists)* — **CC**
  - [ ] Product page + list rows: "scanned from X · also at A, B, C"
- [ ] **P5 — Quick-view** *(needs the design pick)* — **CC**
  - [ ] One `<IngredientAnalysis productId>` in two containers: full page + drawer (desktop) / sheet (mobile)
  - [ ] Close returns to the exact scroll position; loading / analysing / failed states
- [ ] **P6 — Open Food Facts enrichment layer** *(gated on J's legal posture)* — **CC**
  - [ ] `off_*` namespace, **physically separate** from the proprietary tables
  - [ ] Barcode → on-demand lookup, cache what we touch, **no bulk mirror**
  - [ ] ODbL attribution surfaced
- [ ] **P7 — Nav + scope reconciliation** *(needs the design pick)* — **CC**
  - [ ] Align main nav → **Discover · My Lists · @username**
  - [ ] Decide exposure of the already-built Feed / Comments / Moderation (recommend: keep, de-emphasise) — **J**
  - [ ] Update `CLAUDE.md` to the reconciled rules
- [ ] **P8 — One-click social share** *(self-contained; pull early if distribution matters)* — **CC**
  - [ ] Mobile: `navigator.share({ files: [OG card] })` → OS sheet **with Instagram in it** (~2 taps)
  - [ ] Desktop: intent URLs — WhatsApp · Telegram · X · Facebook + Copy link + Save image
  - [ ] Mount on the list page → then product + profile
  - [ ] ⚠️ **Never promise one-tap Instagram Stories on web** — impossible from a browser (see M1)

## Design (CD + the PART C ritual)
- [ ] Send **B2** — seamless create-a-list — **M→CD**
- [ ] Send **B3** — list detail (view-analysis icon, also-available-at, unresolved item) — **M→CD**
- [ ] Send **B4** — two-mode search (recents / catalogue / paste / "Analysing…") — **M→CD**
- [ ] Send **B5** — analysis in two containers + the quick-view drawer/sheet — **M→CD**
- [ ] Port the chosen direction **per screen**: three approaches → critique ritual → build — **CC**
- [ ] Collect Mobbin references + align with J before building — **M/J**
- [ ] *(Optional)* D-G9 restyle of the moderation surfaces — **CD**

## Ops / pre-launch
- [ ] **Enable Auth leaked-password protection** in the Supabase dashboard *(advisor WARN)* — **M**
- [ ] *(Low priority)* Move `pg_trgm` out of the `public` schema *(advisor WARN)* — **M**
- [ ] Verify **Vercel prod env vars**: `DATABASE_URL`, Supabase keys, `ANTHROPIC_API_KEY`, `FIRECRAWL_API_KEY` — **M**
- [ ] **Upstash REST vars** (`UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`) — the Vercel Redis
      integration exposed `REDIS_URL`, which our code doesn't read. The homepage board and the caches
      stay empty until this is fixed. *Small fix, visible payoff.* — **M**
- [ ] Run `npx tsx scripts/make-admin.ts <jitain-handle>` once he has an account — **M**
- [ ] Decide: promote `/feed` to the **signed-in homepage**? (one-line change) — **J**
- [ ] Decide: commit or gitignore the untracked `.agents/`, `.claude/skills/`, `skills-lock.json`,
      `Baloo_FigmaMake_Brief.md` — **M**

## Decisions needed from Jitain
- [ ] Confirm **analysis stays normalised** (shared `what_it_is` cache) rather than a JSONB blob — *recommended; he can veto*
- [ ] Confirm the **OFF stance**: on-demand + walled-off now; **legal advice before any B2B/paid use**
- [ ] Confirm **no pricing in v1**, with the plumbing ready for a future affiliate layer (visible disclosure)
- [ ] **Legal review of the OFF (ODbL) licence** before OFF data touches anything sold — **J**

## Backlog (recorded, not scheduled)
- [ ] **M1 — True one-tap "Share list to Instagram Stories"** → **mobile app only** (Meta Sharing-to-Stories
      SDK + a registered Facebook App ID). Groundwork already done: the OG card image exists at
      `/api/og/list/[slug]`. *The strongest concrete argument for building the app.*
- [ ] **H1 — Bulk catalogue seed** (makes discovery feel full on day one)
- [ ] Discovery-list → **shopping-list conversion** *(the recurring gap across the benchmark)*
- [ ] Availability / locality signals (`offers.available`)
- [ ] Category taxonomy + `/c/[category]` landing pages (`products.category` column is ready)
- [ ] OFF-for-B2B (post-legal)
- [ ] Affiliate layer (behind visible disclosure)
- [ ] Price snapshots (`offers.price` / `currency` / `price_at` exist, deliberately NULL in v1)

## Known-good state (context, not tasks)
- Catalog: 4 products, **all canonical** — a real scan now resolves by identity instead of duplicating.
- Demo data kept on purpose: `@baloo-dev` (admin), `@baloo-friend`, "Dev: first board", "Friend's cupboard",
  and the Oatly discussion thread.
- Phases 1–2 and Orders G1–G9 are complete and verified.
