# Baloo — Phase 3 Full Build Guide (Community Platform)

**For:** Miquel + Claude Code + Claude Design · **Companion to:**
`Baloo_Phase3_Architecture_Community.md` (the summary) and
`Baloo_Benchmark_Community_Discovery.md` (the why).
**Status:** PLAN — pending Jitain's go-ahead.

This is the *complete* build handbook: every phase in order, and every element inside each phase
explained — what it is, why it exists, what it connects to, and what carries over from Phases 1–2.
Read Part I first; the rest is reference you build against, top to bottom.

---

# PART I — ORIENTATION

## I.1 What we are building
A community platform for discovering better supermarket products, where **lists are the primary
object** (like Pinterest boards / Letterboxd lists), **products are canonical entities** that lists
point to and discussions hang off, and **AI is a layer under the community** (every product and
every ingredient explained), not the main event.

One-line north star: **"Letterboxd for supermarket products, with an AI nutritionist under every
item."**

## I.2 The mental model (four layers)
Everything in this guide belongs to one of four layers. Keep them straight and the build stays clean.

1. **Data layer** — Postgres (Supabase). The single source of truth: users, canonical products,
   ingredient profiles, nutrition, lists, and all social records (follows, votes, comments,
   activity). Replaces Phase 2's URL-hash Redis cache.
2. **AI / ingestion layer** — the existing `extract → analyse` pipeline, repurposed so that
   analysing a product *writes a canonical product* into the data layer (with cached AI
   explanations), instead of returning-and-discarding. This is the moat, already built.
3. **Community layer** — the social mechanics: creating/curating lists, following, voting, saving,
   commenting, feeds, discovery. All net-new.
4. **Presentation layer** — Next.js pages + React components. Reuses the Phase-2 ingredient/
   nutrition components; adds list pages, product pages, profiles, feed, auth.

## I.3 The conceptual shift from Phase 2
| | Phase 1–2 (today) | Phase 3 (this build) |
|---|---|---|
| Nature | Stateless tool | Stateful platform |
| Identity | None (anonymous) | Real accounts |
| Product | Ephemeral (per URL, cached by hash) | **Canonical, persistent, deduplicated** |
| Store | Upstash Redis (cache/counters) | **Postgres (relational)** |
| Content | AI only | AI **+ user-generated** (lists, comments) |
| Primary object | A single analysis | **A list** |
| Growth | — | Shareable list pages (SEO, link previews) |
| Homepage | Paste-a-URL tool | Feed / discovery; the tool becomes "add a product" |

**The one hard idea to internalise:** in Phase 2 a "product" existed only for the duration of a
request. In Phase 3 a product is a **row that lives forever**, is deduplicated (two people scanning
the same Pringles hit the *same* product), is versioned (reformulations tracked), and has the AI
explanation cached on it so it's generated **once**, not per view. Everything social hangs off that
stable product identity.

---

# PART II — THE COMPLETE DATA MODEL (every element)

Postgres via Supabase. Every table below is an *element of the building*: its purpose, key columns,
relationships, and access rule. `id` = uuid primary key unless noted. All tables get
`created_at timestamptz default now()`.

## II.1 Identity
### `profiles`
- **Purpose:** the public identity of a user. Mirrors Supabase `auth.users` (which holds
  email/password/OAuth) with the public, social fields.
- **Columns:** `id` (= `auth.users.id`), `handle` (unique, e.g. `@miquel`), `display_name`,
  `avatar_url`, `bio`, `created_at`.
- **Relationships:** owns `lists`, authors `comments`, casts `votes`, has `follows` both ways.
- **RLS:** public read; a user may write only their own row.

## II.2 Products & analysis (the canonical catalog)
### `products`
- **Purpose:** the canonical, deduplicated product entity. THE most important table — lists,
  votes, comments, nutrition and profiles all reference it.
- **Columns:** `id`, `canonical_key` (unique — the dedup key, see II.6), `name`, `brand`,
  `retailer` (nullable — a product isn't tied to one shop), `barcode` (nullable), `image_url`,
  `source` (`user_scan` | `open_food_facts` | `go_upc`), `created_by` (nullable profile id),
  `created_at`.
- **RLS:** public read; writes via the ingestion service (service role), not arbitrary users.

### `ingredient_profiles`
- **Purpose:** a *versioned* snapshot of a product's ingredient list. Reformulations create a new
  version; old ones are marked inactive, never deleted (audit trail — straight from the brief).
- **Columns:** `id`, `product_id` → products, `version` (int), `is_active` (bool), `created_at`.
- **Rule:** exactly one `is_active = true` per product at a time.

### `ingredient_profile_items`
- **Purpose:** one row per ingredient *within a product* — the product-SPECIFIC analysis.
- **Columns:** `id`, `profile_id` → ingredient_profiles, `rank` (label order, absolute),
  `name`, `percent` (nullable), `role` (Order F1), `tag` (Natural|Processed), `why_its_here`
  (product-specific), `percentage_note`.
- **Note:** `what_it_is` is deliberately NOT here — it lives on `ingredients` because it's
  product-independent and reusable (II.6).

### `ingredients`
- **Purpose:** the canonical ingredient dictionary + the **product-independent AI explanation
  cache**. "Water", "Maltodextrin" etc. exist once; their `what_it_is` is generated once and
  reused across every product that contains them (brief §4.1 — huge cost saving).
- **Columns:** `id`, `canonical_name` (unique), `aliases` (text[]), `tag`, `what_it_is`.

### `nutrition`
- **Purpose:** the nutrition panel per product (Order B1 output), stored for the Nutrition tab.
- **Columns:** `product_id` (PK/unique) → products, `serving_size`, `per` (100g|serving|both),
  `nutrients` (jsonb — the B1 array).

## II.3 Lists (the primary object)
### `lists`
- **Purpose:** the atom of the network — a curated, shareable collection of products.
- **Columns:** `id`, `owner_id` → profiles, `title`, `slug` (unique — for `/list/[slug]`),
  `description`, `is_public` (bool), `cover_url`, `created_at`, `updated_at`.
- **RLS:** public read when `is_public`; owner-only write.

### `list_items`
- **Purpose:** the join between a list and the products in it, with order and an optional note
  ("great for lunchboxes").
- **Columns:** `id`, `list_id` → lists, `product_id` → products, `position` (int, for reorder),
  `note` (nullable), `created_at`.
- **Key idea:** the SAME product lives in many lists (the Pinterest repin effect → network value).

## II.4 Social graph & engagement
### `follows`
- **Purpose:** the social graph. Powers the home feed.
- **Columns:** `follower_id` → profiles, `following_id` → profiles, `created_at`. PK = the pair.

### `saves`
- **Purpose:** bookmark someone else's list to your profile.
- **Columns:** `user_id` → profiles, `list_id` → lists, `created_at`. PK = the pair.

### `votes`
- **Purpose:** community signal (upvotes) on lists, products, or comments. Polymorphic.
- **Columns:** `id`, `user_id` → profiles, `target_type` (list|product|comment), `target_id`
  (uuid), `value` (int; +1), `created_at`. Unique on (user, target_type, target_id) — one vote
  each. **Never a Baloo "score" — this is community signal only.**

### `comments`
- **Purpose:** discussion threads on products (and optionally lists).
- **Columns:** `id`, `user_id` → profiles, `product_id` → products, `parent_id` (nullable →
  comments, for threading), `body`, `created_at`.

### `activity`
- **Purpose:** the event log that powers the home feed and (graduated from Phase 2) the "on Baloo
  right now" board.
- **Columns:** `id`, `actor_id` → profiles, `verb` (created_list|added_item|voted|commented|
  followed|scanned), `object_type`, `object_id`, `created_at`.

## II.5 Trust & safety
### `reports`
- **Purpose:** user reports of lists/comments/products for the moderation queue (G9).
- **Columns:** `id`, `reporter_id` → profiles, `target_type`, `target_id`, `reason`, `status`
  (open|reviewed|actioned), `created_at`.

## II.6 Two data rules that make or break this
1. **Canonical key / dedup (`products.canonical_key`).** When anyone ingests a product, compute a
   stable key: **barcode if present**, else a normalised hash of `brand + name + size`. Upsert on
   this key so two people scanning the same product converge on ONE `products` row. Without this,
   lists point at duplicates and the network fragments. This is the single most important
   invariant in the build.
2. **Product-independent vs product-specific AI (already designed in Order F1 / brief §4.1).**
   - `what_it_is` → generic, on `ingredients`, generated **once per ingredient**, reused
     everywhere. (Cache hit rate climbs fast; most cost disappears.)
   - `why_its_here` + `percent` + `percentage_note` + `role` → on `ingredient_profile_items`,
     regenerated per product because they depend on the formulation.

---

# PART III — THE STACK (every tool, what it does, why)

- **Next.js (App Router) on Vercel** — same as today. Frontend + API routes + SSR for shareable,
  SEO-indexed list pages (the growth engine). Keep pipeline logic in `lib/` framework-agnostic so
  the future Flutter app reuses it.
- **Supabase** — Postgres **+ Auth (email + Google + anonymous) + Storage (covers/avatars) + Row-
  Level Security**, in one product. Chosen because it collapses the database *and* auth orders
  (G1+G2) and gives RLS for free. (Alternative: Neon Postgres + NextAuth — more wiring.)
- **Drizzle ORM** — TS-first schema + typed queries + migrations. Lightweight; the schema *is*
  TypeScript, so types flow end-to-end. (Alternative: Prisma — heavier, also fine.)
- **The existing AI pipeline** — Vercel AI SDK + Claude (`generateObject`/`streamObject`), Firecrawl
  for retailer pages. Unchanged; repurposed as ingestion. `lib/prompts.ts`, `lib/schema.ts`,
  `lib/nutrition.ts`, `lib/profile.ts` carry over verbatim.
- **Open Food Facts + Go-UPC** — the product catalog sources (barcode/photo identity + ingredient
  data) for cold-start seeding and future mobile scanning. The brief's committed data layer.
- **`@vercel/og`** — generate Open Graph images for list pages so shared links look great.

---

# PART IV — BUILD PHASES IN ORDER (every order, every element)

Two slices. **Slice A (G1–G4)** is the thin, demoable core: accounts → AI product pages →
shareable lists. **Slice B (G5–G9)** is the network. **H1** (catalog seed) runs in parallel.
Same working loop as Phase 2: plan → build against fixtures → `npm run build` → commit per order.

For each order: **Goal · Elements built · Depends on · Reuses · Done when · Claude Code prompt.**

## SLICE A — "Boards v0"

### G1 — Postgres foundation + data model
- **Goal:** a live database with the full schema and safe access rules; nothing user-facing yet.
- **Elements built:**
  - Supabase project + connection.
  - `lib/db.ts` — Drizzle client (server-only) + a service-role client for ingestion.
  - `lib/schema/*.ts` — Drizzle table definitions for every table in Part II.
  - `drizzle/` migrations + a `db:migrate` script.
  - RLS policies (Part II per-table rules).
  - Typed query helpers (`lib/queries/*.ts`): `getProduct`, `upsertProduct`, `createList`,
    `addListItem`, etc. — the app never writes raw SQL.
- **Depends on:** nothing (foundation).
- **Reuses:** the `Nutrition`/`Ingredient` TypeScript types from `lib/schema.ts` (shape the jsonb).
- **Done when:** migrations apply; a seed script writes + reads one product, one list; RLS blocks a
  cross-user write in a test.
- **Prompt:** *"Stand up Supabase + Drizzle. Implement the Part II schema with migrations and RLS
  (public read for public rows, owner-scoped writes, ingestion via service role). Add lib/db.ts and
  typed query helpers. Seed + read one product and one list to prove it. No UI. Keep it in lib/."*

### G2 — Auth + profiles
- **Goal:** users can sign up, sign in, and have a public identity; writes are gated.
- **Elements built:**
  - Supabase Auth wiring: email/password, Google OAuth, **anonymous sessions** (try-before-signup)
    that **upgrade** to a real account without losing state.
  - `profiles` row auto-created on signup (unique handle picker).
  - `lib/auth.ts` — server helpers: `getSession`, `requireUser`.
  - UI: `SignIn`/`SignUp` modal, `AccountMenu`, handle-setup step.
  - Middleware/guards: list-create and all writes require a user; reads stay public.
- **Depends on:** G1 (`profiles` table).
- **Reuses:** the calm design tokens/components.
- **Done when:** sign up with Google + email works; anonymous → account upgrade preserves state;
  session persists across reloads; an unauthenticated write is refused.
- **Prompt:** *"Add Supabase Auth (email + Google + anonymous-that-upgrades). Create a profiles row
  with a unique handle on signup. Add lib/auth.ts (getSession/requireUser), sign-in/up UI, account
  menu. Gate writes behind auth; keep reads public."*

### G3 — Canonical products + product page (reuse the AI)
- **Goal:** analysing a product *persists a canonical product*, and there's a permanent page for it.
- **Elements built:**
  - `lib/ingest.ts` — the ingestion service: takes an analysis result → computes `canonical_key`
    → upserts `products` → writes a versioned `ingredient_profiles` + `ingredient_profile_items`
    → upserts `ingredients` (caching `what_it_is`) → writes `nutrition`.
  - Rewire `/api/analyze` (and extract) to call `lib/ingest.ts` instead of the Redis cache write.
  - `app/p/[slug]/page.tsx` — the canonical **product page** (SSR): renders the F2 progressive
    ingredient list + B4 nutrition tab + `product_summary`, reading from Postgres.
  - `lib/queries/product.ts` — `getProductBySlug`, `getActiveProfile`.
- **Depends on:** G1.
- **Reuses:** ✅ the whole analysis pipeline, `IngredientCard`/`IngredientRow` (F2), `NutritionPanel`
  (B4), `computeNutrition`, `ProfileSelector`. This is where Phase 2 pays off.
- **Done when:** analysing the same product twice hits one `products` row (dedup works); `/p/[slug]`
  renders ingredients + nutrition from the DB; `what_it_is` is reused for a shared ingredient.
- **Prompt:** *"Turn extract→analyse into ingestion (lib/ingest.ts): upsert canonical product by
  canonical_key, write a versioned ingredient_profile + items (role/tag/why_its_here/percentage_note
  from Order A/F1), cache what_it_is on ingredients, store the B1 nutrition. Build /p/[slug]
  rendering the F2 list + B4 nutrition tab from Postgres. Dedup on repeat analysis."*

### G4 — Lists (the primary object)
- **Goal:** the core loop — create a list, add products, share a public page.
- **Elements built:**
  - CRUD: `createList`, `updateList`, `deleteList`; `addListItem`/`removeListItem`/`reorderItems`.
  - `app/list/[slug]/page.tsx` — public **list page** (SSR, OG image via `@vercel/og`).
  - `app/lists/page.tsx` — "my lists".
  - `components/ListEditor.tsx` — add/reorder/note UI; `components/ListCard.tsx` (used later in
    feeds/profiles); an **"Add to list"** control on the product page.
  - `app/api/og/list/[slug]/route.tsx` — dynamic OG image.
- **Depends on:** G1, G2, G3.
- **Reuses:** `ListCard` pattern echoes the Phase-2 board card; product page from G3.
- **Done when:** a signed-in user creates a list, adds products from a product page, reorders them,
  makes it public, and the `/list/[slug]` URL renders with a rich link preview.
- **Prompt:** *"Build lists end-to-end: create/edit/delete, add/remove/reorder products, cover +
  description. Public /list/[slug] with an @vercel/og preview image. 'My lists' area and an 'Add to
  list' control on the product page. Reads/writes via the G1 helpers."*

> **End of Slice A — demo to Jitain: accounts + AI product pages + shareable lists.**

## SLICE B — the network

### G5 — Public profiles + browse/discovery
- **Goal:** somewhere to *find* lists and people.
- **Elements built:** `app/u/[handle]/page.tsx` (public profile → a user's public lists);
  `app/discover/page.tsx` (recent + popular lists, search); `lib/search.ts` (Postgres full-text
  over products + lists); category landing pages (`/c/[category]`).
- **Depends on:** G4. **Done when:** a profile shows its lists; search returns products + lists.

### G6 — Follow + home feed
- **Goal:** turn boards into a network.
- **Elements built:** `follows` write/read; `app/(home)/feed` from the `activity` table (lists your
  follows create, items they add, votes); pagination; `components/FollowButton.tsx`.
- **Depends on:** G4, G5. **Done when:** following a user surfaces their new lists/items in your feed.

### G7 — Votes / saves + community ranking
- **Goal:** community signal and "best of" surfaces.
- **Elements built:** `votes` + `saves` writes; `components/VoteButton.tsx`, `SaveButton.tsx`;
  ranked surfaces ("Top toddler snacks this week") computed over a time window; the home board
  ("On Baloo right now") re-sourced from `activity`.
- **Stretch (flagged, highest-leverage from the benchmark):** Beli-style **pairwise product
  ranking** + a **taste-compatibility %** between users ("you and Ana agree 84% on snacks").
- **Depends on:** G6. **Done when:** votes rank a category surface; a save appears on your profile.

### G8 — Comments / discussions per product
- **Goal:** discussion hangs off every product ("every product links to discussions").
- **Elements built:** `comments` (threaded via `parent_id`); `components/CommentThread.tsx`; sort
  top/newest; an **"explain this"** affordance that invokes the existing ingredient/product AI
  inside a thread (AI layered on community content — the novel bit).
- **Depends on:** G3, G6. **Done when:** users comment/reply on a product; AI can be summoned in-thread.

### G9 — Moderation, safety, rate-limiting
- **Goal:** make UGC safe to ship publicly — non-negotiable before launch.
- **Elements built:** `reports` + an admin review queue (`/admin`); write rate-limits;
  spam/abuse heuristics; health-claim safety (community text is clearly user opinion; AI stays
  neutral/no medical advice); block/hide flows.
- **Depends on:** all UGC orders. **Done when:** a reported item enters the queue; an admin can
  hide it; rate limits stop a flood.

## PARALLEL

### H1 — Catalog seed (solve cold start)
- **Goal:** the network isn't empty on day one.
- **Elements built:** an Open Food Facts import job (+ Go-UPC for gaps) → `products` +
  `ingredient_profiles` + `nutrition`, each fact source-attributed (license compliance); a handful
  of **founding lists** ("Best supermarket cereals", "Toddler snacks I trust"); a backfill that
  runs the AI explanation over seeded products lazily.
- **Depends on:** G1 (schema), G3 (ingestion shape). **Done when:** browse/search returns hundreds
  of real products and several curated lists before any user signs up.

---

# PART V — DESIGN SURFACES (Claude Design; every screen + its elements)

Deliver as handoffs in the `Baloo_Design_Handoff_D_B4.md` format (tokens mapped, all states,
motion, mobile). Sequence each design ONE step ahead of its build order. Calm/editorial voice
throughout; the Natural/Processed pill stays the only meaningful colour.

- **D-G4 · Lists (the hero design)** — the public **list page** (cover, title, curator, items with
  N/P pills + notes, save/follow, OG preview), the **list card** (feeds/profiles), and the
  **create/edit editor** (add, reorder, note). *Most important design in Phase 3.*
- **D-G3 · Product page** — assembles the F2 ingredient list + B4 nutrition tab + summary into a
  standalone linkable page, with **"Add to list"** and (later) vote/comment slots.
- **D-G2 · Auth + profile** — sign-in/up, handle setup, account menu, public profile (`/u/[handle]`).
  Warm, low-friction, "try before signup".
- **D-G5 · Browse / search / category** — discovery of good lists and products; category landings.
- **D-G6 · Home feed** — calm activity feed of lists/adds/votes from follows (not a shouty leaderboard).
- **D-G7 / D-G8 · Vote + comment components** — neutral upvote/save controls and threaded
  discussion; must read as community opinion, never a verdict.

---

# PART VI — CROSS-CUTTING SYSTEMS (each explained in full)

These aren't single orders — they thread through several. Understand each as its own "element."

- **Auth & anonymous upgrade.** Anonymous sessions let someone use the tool and even build a
  draft before signing up; on signup the anonymous data reassigns to the new account. Reduces the
  #1 drop-off (forced signup).
- **Row-Level Security (RLS).** Every table's access is enforced in Postgres, not just the app:
  public rows readable by all, writes scoped to `owner_id = auth.uid()`, ingestion via a service
  role. This is your safety net against a bug exposing/allowing the wrong thing.
- **Product ingestion & AI caching.** The pipeline's job changes from "answer a request" to
  "populate the catalog." Dedup (canonical_key) + the ingredient-level `what_it_is` cache mean the
  Nth person to scan a product pays ~zero AI cost. This is what makes a growing catalog affordable.
- **Search & discovery.** Postgres full-text over product names/brands and list titles/descriptions;
  category landing pages assembled from lists; "popular this week" from votes/activity.
- **Feed & ranking.** The `activity` log is the spine: the home feed is a filtered, paginated view
  of it for people you follow; ranked surfaces are aggregations over a window. Load-time fetch,
  no aggressive polling (same discipline as the Phase-2 board).
- **Voting & saves.** One vote per user per target (DB-enforced). Votes are *community signal*,
  surfaced as "top", never fused into a Baloo score — the brand guardrail.
- **Comments & threading.** `parent_id` self-reference gives one level (or N) of replies; the AI
  "explain this" hook is what differentiates our discussions from a generic comment box.
- **Moderation & safety.** Reports → queue → admin action; rate limits; and the health-claim rule:
  users may share opinions, but Baloo's own AI output stays neutral and never gives medical advice.
- **SEO / OG / shareability.** List pages are SSR'd, indexable, and generate OG images. This is the
  growth loop — a great shared list pulls in new users the way Letterboxd lists do. It's *why*
  web-first.
- **Catalog seeding.** OFF/Go-UPC import so lists have products to hold from day one. A social app
  with an empty catalog is dead on arrival.

---

# PART VII — SEQUENCING, CRITICAL PATH, ESTIMATES

- **Critical path:** G1 → G2 → G3 → G4 (nothing social works without the DB, auth, canonical
  products, and lists in that order). G5–G9 layer on top and can partly parallelise. H1 runs
  alongside from the moment G1+G3 exist.
- **Design leads build by one step:** D-G4 and D-G3 must be ready before/with G3–G4.
- **Estimates (focused solo + Claude Code):** Slice A (G1–G4) ≈ **2–3 weeks** → demoable. Slice B
  (G5–G9) ≈ **2–3 weeks**. H1 ≈ 1 week parallel. **Community MVP ≈ 4–6 focused weeks** (6–10
  calendar). The parts that resist speed: **auth, moderation (G9), feed ranking** — don't compress.

---

# PART VIII — WHAT CARRIES FORWARD / WHAT'S RETIRED

**Carries forward (reuse, don't rebuild):**
- `lib/prompts.ts`, `lib/schema.ts` (analysis + role + summary), `lib/nutrition.ts`, `lib/profile.ts`
- `components/IngredientCard` (F2 row), `NutritionPanel` (B4), `ProfileSelector`, all design tokens
- the extract→analyse pipeline (becomes ingestion), the `CLAUDE.md` guardrails

**Retired / relegated:**
- the URL-hash **Redis cache** → superseded by Postgres `products` (Redis may stay only for rate-
  limits / ephemeral counters)
- the **paste-a-URL homepage** → becomes the "add a product" utility inside the platform
- the **Phase-2 board** (`lib/stats.ts`) → graduates into the `activity` feed

**Net:** the differentiation (AI explanation + nutrition + calm design) is done and portable; Phase
3 is the *network* built around it, on the Postgres foundation the brief already committed to.
