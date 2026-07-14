# Baloo — Phase 3 (Product/Offer): Reconciliation & Build Plan

**Companion to** `Baloo_Phase3_Build_Orders.md` (the canonical spec). This doc reconciles that spec
against what's already shipped (Orders **G1–G9**) and against two product decisions taken this
session, then sequences only the **net-new** work. Read §0–§2 before building.

## Decisions locked this session
- **Catalogue / Open Food Facts:** on-demand OFF lookup **by barcode**, cache what we touch, keep
  OFF-derived data in a **layer physically separate** from our own scans/analysis/lists. **No bulk
  mirror.** Legal review before any OFF data feeds a paid/B2B product (ODbL share-alike vs the
  proprietary endgame).
- **List items:** **resolved-first** (smart selector over the existing catalogue) + **link-paste
  fallback** (which enriches the catalogue) + an explicit, clearly-labelled **"unresolved — no
  analysis"** escape hatch. Lists display their own quality; users self-police.

---

## 0. Where we already are (G1–G9 shipped) vs the spec's Orders 1–9

| Spec order | Status | Notes |
|---|---|---|
| **1** Auth + profiles + RLS | ✅ Done | G1/G2: Supabase auth, `profiles`, RLS (`0001_rls`), sign-in modal, anon browsing. |
| **2** Schema (products/**offers**/lists/social) | ⚠️ Partial | products/lists/list_items/votes/saves/follows ✅. **Missing: `offers` table, `products.analysis_status`, `category`, pg_trgm on name.** |
| **3** Analysis as a stored product | ⚠️ Partial | G3 ingest persists a canonical product + analysis on paste (in `after()`). **Missing: identity-keyed short-circuit** ("done → return, no Firecrawl/Claude") and a framework-agnostic `lib/analysis/*` split. Redis cache is still **URL-hash keyed**. |
| **4** Background analysis on list-add | ❌ Net-new | Today you can only add **already-catalogued** products to a list. |
| **5** Two-mode search | ⚠️ Partial | Catalogue search ✅ (G5). **Missing: own-first ranking, recents-before-typing, and the paste-URL "Analyse & add" mode.** |
| **6** Lists create/view/add | ✅ Mostly (G4) | **Missing: "also available at A,B,C"** (needs offers) and **add-new-via-paste**. |
| **7** One analysis, two containers | ⚠️ Partial | Full-page product page ✅ (reuses `ResultsView`). **Missing: quick-view drawer (desktop) / sheet (mobile) with scroll-return.** |
| **8** Crossover "Add to list" | ✅ Mostly | `AddToList` on the product page ✅. Confirm it's also on the **paste-flow result**. |
| **9** Social + nav | ✅ Mostly | votes/saves/follow, Discover, profile ✅. **Nav differs** (we ship Following·Discover·Lists·Admin; spec wants Discover·My Lists·@username, no "Following" in nav). |

**Already built but OUT of this spec's scope:** the G6 **feed**, G8 **comments + "Explain this"**,
G9 **moderation**. They're shipped and working. Recommendation: **keep them** (they add real value
and were verified), but treat their nav exposure as a §P7 reconciliation decision for Jitain — not a
rollback.

## 1. The one architecture call to confirm — analysis storage
The spec's Order 3 says "store `analysis` JSONB". We instead built a **normalized** model:
`ingredient_profiles` + `ingredient_profile_items` **+ a product-INDEPENDENT `ingredients.what_it_is`
cache** + `nutrition`. **Recommendation: keep the normalized model; do NOT migrate to a JSONB blob.**
It *is* the spec's own §1 principle ("one canonical analysis per product, reused everywhere") plus
the shared-ingredient cost strategy, and it's exactly what B2B ingredient-intelligence will
monetize. The only net-new columns needed are **`analysis_status` enum(pending|analysing|done|failed)**
and **`analysed_at`** on `products`; the existing active profile *is* the "analysis" the status
refers to. (Flagged so Jitain can veto — but a blob would throw away the global cache.)

## 2. Net-new build — the actual remaining work (P-orders)
Sequenced; one order per session, plan-first, commit per order (same rhythm as G1–G9).

- **P1 — Offers + product identity/status (migration).** Add `offers(id, product_id, retailer, url,
  available, price NULL, currency NULL, price_at NULL, created_at, UNIQUE(product_id,retailer,url))`;
  add `products.analysis_status` + `analysed_at` (+ `category` NULL); **graduate the Redis
  extract/analyze cache from URL-hash → identity (barcode-first) key**; backfill one offer per
  existing product from its `retailer`+source URL. Add `pg_trgm` index on `products.name`.
- **P2 — Analysis pipeline as a lib + background job.** **Carried fix (fold in first): migration
  `0007_offers_rls` — enable RLS on `public.offers` with policies matching `0001_rls.sql` (public
  read, server-side writes only).** The Supabase security advisor flagged `offers` (added in P1)
  as `rls_disabled_in_public`; server-side Drizzle bypasses RLS so the app works, but our
  defence-in-depth rule requires every public table to have it. (Also, dashboard-only, before
  launch: enable Auth leaked-password protection; optionally move `pg_trgm` out of `public`.)
  Then the pipeline work: extract the Firecrawl→extract→analyse
  pipeline into framework-agnostic `lib/analysis/*`; `POST /api/products/analyze` (by product id);
  new-product-add path inserts `pending` → `after()`/`waitUntil` → `analysing` → `done|failed`;
  surface status via Supabase Realtime on the product row (fallback: poll). Retry from the viewer.
  Paste-flow keeps foreground streaming; identity short-circuit returns a done product instantly.
- **P3 — Two-mode add-product (list-builder).** One input: (a) catalogue search — **own products
  first**, recents before typing; (b) detect a pasted URL → **"Analyse & add"** (P2 background).
  Extend `list_items` to allow **either** a resolved `product_id` **or** an **unresolved**
  `{ free_text, resolved:false }` item (no analysis, visible "add link" affordance). Per the locked
  decision.
- **P4 — "Also available at".** Query `offers` per product; product page + list rows show "scanned
  from X · also at A, B, C". Tesco+Ocado of one barcode = **one product, N offers** (dedup on
  identity). This is the payoff of the Product/Offer split — it falls out of the query.
- **P5 — One analysis, two containers.** `<IngredientAnalysis productId>` reused in: full page
  (`/product/[id]` or a name/image click) **and** a **quick-view drawer/sheet** (breakpoint-picked)
  with easy close returning to exact scroll position; loading/analysing/failed states.
- **P6 — OFF enrichment layer (separate).** `off_*` namespace, **never merged** into proprietary
  tables; barcode → OFF fetch on demand, cached; used to enrich identity/name/nutrition when a scan
  lacks a barcode and to help dedup; attribution surfaced; **legal-review gate before any B2B use.**
- **P7 — Nav + scope reconciliation.** Align main nav to **Discover · My Lists · @username**; decide
  the fate/exposure of the already-built Following feed / comments / moderation (recommend keep,
  de-emphasize); update `CLAUDE.md` to the reconciled rules.

**Suggested sequence:** P1 → P2 → P3 (+ P4) → P5 → P6 → P7. (P6 can slot earlier if discovery needs
to feel fuller sooner, but it's gated on the OFF/legal posture above.)

## 2b. Design workflow (spec PART C) — applies to every P-series UI order
Standing process now baked into P3/P4/P5 + list detail + the Discover/nav work:
- **Three approaches first.** For each meaningful screen, produce THREE genuinely different UX
  directions (different hierarchy/interaction, not colour swaps) and pick before committing. In
  Claude Code I'll present the three inline; in Figma Make, the v1/v2/v3-in-header trick (the
  attached `.make` prototype already does this on the home/analysis surface).
- **Critique ritual** on every meaningful screen: the "Rams / Ive / Linear / Duolingo — 20 concrete
  improvements, ignore implementation complexity" pass, then apply the best fixes.
- **Hard guardrail — score-free.** The tooling's "72/100" example is NOT Baloo: no number, no
  traffic lights, no verdict, ever. (Already true across G1–P1 — the Natural/Processed pill is the
  only meaningful colour.) Delight/animation later via **Rive** (loading, empty, card-reveal) is
  welcome; a health score is not.
- **Mobbin references** (align with Jitain before building), mapped to our surfaces: Letterboxd/
  Goodreads/Pinterest/Are.na (lists) · Vivino/Untappd/Beli/Thingtesting (discovery+social) ·
  Spotify/Pinterest (add-to-collection search) · Vivino + Yuka *minus the score* (product detail) ·
  Pinterest quick-view + mobile bottom-sheets (P5 drawer/sheet).
- **Nav signal from the `.make` prototype:** a left sidebar (Home · Discover · My Lists · @username)
  — differs from the shipped top nav (Following · Discover · Lists · Admin). Fold into **P7**;
  don't change nav mid-P-series.

## 3. Claude Design handoffs (spec Part B) — send now
The spec's **Part B (B1–B7)** is the design brief; it maps cleanly onto the P-orders. Send first,
in this order: **B2** (seamless create-a-list), **B3** (list detail: view-analysis icon +
also-available-at + the **unresolved item** state), **B4** (two-mode search: recents / catalogue /
paste "Analyse & add" / "Analysing…"), **B5** (analysis two containers + quick-view drawer/sheet).
Attach `Baloo_Phase3_Build_Orders.md`, paste the Part-B item, and add: *"Baloo already ships G1–G9;
match the existing calm/editorial tokens (white/paper, ink, serif display, green/amber = ingredient
tags only)."*

## 4. Benchmark learnings — folded in as principles
- **AI Layer (Rufus/Raindrop/Perplexity):** Baloo's AI is **asked on a product or a list**, never
  authors lists or talks at the user. (Already true of "Explain this" — hold that line.)
- **Shopping Behaviour (Basket/Instacart/Bring):** list-first is **validated** ("a basket, not one
  product"); **availability/locality** decide usefulness → the `offers.available` flag earns its
  place; **discovery-list → shopping-list conversion** is the recurring missing step → **backlog**.
- **Every scanner (Yuka/GoCoCo/CodeCheck):** utility-only, no reason to return → the whole case for
  the list/social pivot, in Jitain's own data.
- **Pricing:** `offers.price/currency/price_at` **columns exist but stay NULL in v1** (Jitain's gut
  + the benchmark's repeated affiliate-trust warnings). Affiliate / "best X on offer" lists = an
  **explicit future**, gated behind **visible disclosure**.

## 5. Backlog (noted, not now)
Shopping-list conversion · availability/locality signals · category taxonomy landing pages (spec
`category` col readies this) · OFF-for-B2B (post-legal) · affiliate layer · price snapshots.
