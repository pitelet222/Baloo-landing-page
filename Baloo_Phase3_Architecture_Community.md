# Baloo — Phase 3 Architecture: Community Food-Discovery Platform

**For:** Claude Code (build) + Claude Design (visual) · **Owner:** Miquel · **Date:** July 2026
**Status:** PLAN — pending Jitain's go-ahead (this is a pivot decision, not an increment).

Turns Jitain's "community-led discovery" direction (see `Baloo_Benchmark_Community_Discovery.md`)
into a concrete, ordered build. Primary object = **lists**. AI becomes a layer under community
content, not the main experience. Read §0–§2 before any order.

---

## 0. The decision this encodes
- **This is a v2, not an add-on.** Today's app is a *stateless tool* (URL → AI → discard). A
  community platform needs persistent identity, a canonical product database, a social graph, and
  UGC. Almost none of that plumbing exists yet.
- **But it's not throwaway.** The hardest moat — the AI explanation engine (`lib/prompts.ts`,
  `lib/schema.ts`, `lib/nutrition.ts`) + the product/nutrition UI (B1–B4, F) — carries forward
  wholesale. And the target Postgres model is the one the mobile brief already committed to, so
  this **accelerates** that architecture rather than diverging.
- **Web-first for the community layer.** Shareable, link-previewable, SEO-indexed list pages are
  the growth engine (Letterboxd/Pinterest); the web is native to that. Mobile (Flutter) follows.
- **Thin slice first.** Ship "Boards v0" (accounts → canonical products → shareable lists →
  product page with AI) before the full social graph. Prove the loop, then layer social.

## 1. Guardrails (unchanged — they are the brand)
- **Education before persuasion. No score, no verdict, no red/green.** The Natural/Processed tag
  stays the only meaningful colour. Community opinions are clearly *opinions*; AI content stays
  neutral/factual. (Carry `CLAUDE.md` guardrails forward verbatim.)
- **Neutrality is a feature.** No pay-to-rank, no marketing bias. This is the differentiator vs
  Yuka/Vivino.
- **Privacy.** Real accounts now exist, so this is a step up from Phase 2: explicit auth, no
  selling data, country-level analytics only unless a user opts in.
- **AI arithmetic/facts in code** (nutrition %), model only phrases. Still true.

## 2. Target architecture
```
Next.js (web) ─ Postgres (Supabase) ─ Drizzle ORM
                     │
   canonical products ─ ingredient_profiles(versioned) ─ nutrition
   ingredients(shared, product-independent AI cache)     lists ─ list_items
   users/profiles ─ follows ─ votes ─ comments ─ saves ─ activity
                     │
   AI layer: existing extract→analyse pipeline becomes "ingest a product"
             (writes canonical product + profile; explanation cached at product/ingredient level)
```
**Recommended stack:** **Supabase** (Postgres + Auth + storage + row-level security in one —
collapses the DB and auth orders) + **Drizzle** (TS-first, lightweight migrations). Keep all
pipeline logic in `lib/` framework-agnostic so the Flutter app reuses it (per the brief).

### Data model (first pass — G1 finalises)
- `profiles` (id→auth.users, handle unique, display_name, avatar_url, bio, created_at)
- `products` (id, canonical_key unique, name, brand, retailer?, barcode?, image_url, source, created_at)
- `ingredient_profiles` (id, product_id, version, is_active, created_at) — versioned, never deleted
- `ingredient_profile_items` (id, profile_id, rank, name, percent?, role, tag, why_its_here, percentage_note)
- `ingredients` (id, canonical_name unique, aliases[], tag, what_it_is) — **product-independent
  explanation cached here** (brief §4.1: `what_it_is` reused across products; `why_its_here` is
  per-product on the profile item)
- `nutrition` (product_id, serving_size, per, nutrients jsonb) — from B1
- `lists` (id, owner_id, title, slug unique, description, is_public, cover_url, created_at, updated_at)
- `list_items` (id, list_id, product_id, position, note?, created_at)
- `follows` (follower_id, following_id, created_at) · `saves` (user_id, list_id, created_at)
- `votes` (id, user_id, target_type[list|product|comment], target_id, value, created_at)
- `comments` (id, user_id, product_id, parent_id?, body, created_at)
- `activity` (id, actor_id, verb[created_list|added_item|voted|commented|followed], object refs, created_at) — powers feed; the Phase-2 board graduates into this.

---

## 3. Build orders — Claude Code

Run per order; plan before writing; `npm run build` before push; commit per order — same loop as
Phase 2. **Slice A = G1–G4** (thin slice, demoable). **Slice B = G5–G9** (the network). **H1** runs
in parallel.

### Slice A — "Boards v0"

**G1 — Postgres foundation + data model**
```
Stand up Supabase (Postgres) and wire Drizzle ORM with migrations. Implement the schema in
Baloo_Phase3_Architecture_Community.md §2 (profiles, products, ingredient_profiles,
ingredient_profile_items, ingredients, nutrition, lists, list_items, follows, saves, votes,
comments, activity). Add row-level security: public read for public lists/products, writes scoped
to the owner. Provide a lib/db.ts client and typed query helpers. No UI. Seed a couple of rows to
prove reads/writes. Keep everything in lib/ framework-agnostic.
```

**G2 — Auth + profiles**
```
Add Supabase Auth: email + Google, plus anonymous session that can upgrade to an account (keep the
"try before signup" flow — anonymous first scan). On signup, create a profiles row (unique handle).
Session persists across reloads. Add sign-in/up UI and an account menu. Protect list-create and
write actions behind auth; reads stay public. No social features yet.
```

**G3 — Canonical products + product page (reuse the AI)**
```
Turn the existing extract→analyse pipeline into product INGESTION: on analysis, upsert a canonical
product (dedupe by canonical_key — barcode when available, else normalised brand+name+size),
write a versioned ingredient_profile + items (role, tag, why_its_here, percentage_note from Order
A/F1), cache what_it_is at the ingredient level (shared across products, brief §4.1), and store the
nutrition panel (B1). Build the canonical product page at /p/[slug] that renders the progressive
ingredient list (Order F2), the Nutrition tab (B4), and the product_summary — reading from
Postgres, not the URL cache. This page is what lists link to and discussions hang off.
```

**G4 — Lists (the primary object)**
```
Build lists end to end: create/edit/delete, add/remove/reorder products (from a product page or
search), title + description + cover. Public list page at /list/[slug] with Open Graph image for
rich link previews (this is the growth surface — make it beautiful and shareable). A "my lists"
area. Adding a product to a list from its product page. No follow/feed yet. Everything reads/writes
Postgres via G1.
```
→ **End of Slice A: accounts + AI-rich product pages + shareable lists. Demo to Jitain.**

### Slice B — the network

**G5 — Public profiles + browse/discovery**
```
Public profile at /u/[handle] showing a user's public lists. A browse/discovery surface: recent
and popular lists, search across products and lists. Category landing pages ("cereals",
"toddler snacks") assembled from lists + products.
```

**G6 — Follow + home feed**
```
Follow/unfollow users. A home feed from the activity table: lists your follows create, items they
add, products they vote on. Load-time + pagination, no aggressive polling.
```

**G7 — Votes / saves + community ranking**
```
Upvote products and lists; save a list to your profile. Community-ranked surfaces ("Top toddler
snacks this week") computed from votes over a window. Keep it neutral — ranking is community
signal, never a Baloo "score". (Stretch, flagged: Beli-style pairwise product ranking +
taste-compatibility % between users — the benchmark's highest-leverage idea.)
```

**G8 — Comments / discussions per product**
```
Threaded comments on product pages (and optionally lists). Sort by top/newest. Tie into the AI
layer: an "explain this" affordance in a thread invokes the existing ingredient/product AI.
```

**G9 — Moderation, safety, rate-limiting**
```
Reporting on lists/comments/products, an admin review queue, rate limits on writes, spam/abuse
heuristics, and health-claim safety (keep community claims clearly user opinion, AI stays neutral,
no medical advice). Do not ship UGC to the public without this.
```

### Parallel

**H1 — Catalog seed (solve cold start)**
```
Import a curated slice of Open Food Facts (+ Go-UPC for gaps) into canonical products so lists
aren't empty at launch, and seed a handful of founding lists ("Best supermarket cereals",
"Toddler snacks I trust"). Attribute every fact to its source (license compliance). Runs alongside
Slice A; a dead network with no products is DOA.
```

---

## 4. Design orders — Claude Design

Deliver as handoffs in the same format as `Baloo_Design_Handoff_D_B4.md` (tokens mapped, states,
motion, mobile), keeping Baloo's calm/editorial voice. Reuse the existing token set + ingredient/
nutrition components.

- **F-design is still pending? No — done (F2 shipped).** New surfaces to design:
- **D-G4 · List page + list card + create/edit-list flow** — the hero surface. The public list
  page (shareable, OG image), the list card used in feeds/profiles, and the add/reorder editor.
  This is the most important design in Phase 3.
- **D-G3 · Canonical product page** — assembles the F2 ingredient list + B4 nutrition tab + summary
  into a standalone, linkable page (vs today's inline results), plus "add to list" and (later)
  vote/comment affordances.
- **D-G2 · Auth + profile** — sign-in/up, account menu, public profile (`/u/[handle]`) with the
  user's lists. Warm, low-friction, "try before signup".
- **D-G6 · Home feed** — activity feed of lists/adds/votes from follows; calm, not a noisy
  leaderboard.
- **D-G5 · Browse / category / search** — discovery of good lists and products; category landing
  pages.
- **D-G7/8 · Vote + comment components** — neutral upvote/save controls and threaded discussion,
  designed to read as community opinion, never a verdict.

Sequence design to lead each code order by one step: **D-G4 and D-G3 first** (they gate the demo).

---

## 5. What carries forward (reuse, don't rebuild)
- `lib/prompts.ts`, `lib/schema.ts` (analysis + role + summary), `lib/nutrition.ts`, `lib/profile.ts`
- `components/IngredientCard` (F2 row), `NutritionPanel` (B4), `ProfileSelector`, design tokens
- The extract→analyse pipeline (becomes ingestion)
- `CLAUDE.md` guardrails
Retired/relegated: the URL-hash Redis cache (superseded by Postgres products), the stateless
"paste a URL" homepage (becomes the "add a product" utility inside the platform), the Phase-2
board (graduates into the activity feed).

## 6. Decisions to confirm with Jitain (each moves the estimate)
1. **Go / no-go on the pivot** — this is a new product; scope + resource it as such.
2. **Web-first (recommended) or straight to Flutter mobile?** Shareable lists favour web.
3. **Supabase vs separate Postgres (Neon) + NextAuth?** Supabase collapses G1+G2.
4. **Cold-start plan** — commit to H1 (OFF seed + founding lists) before any public launch.
5. **Moderation appetite** — UGC liability is real; G9 is non-negotiable pre-launch.
6. **Score question (again):** stays score-free per the brand. Confirm.

## 7. Rough estimate (focused build, solo + Claude Code)
- Slice A (G1–G4): **~2–3 weeks** → demoable "boards + AI product pages".
- Slice B (G5–G9): **~2–3 weeks** → the network.
- H1 seed: ~1 week, parallel.
- **Community MVP ≈ 4–6 focused weeks** (6–10 calendar weeks solo with testing/iteration).
  Auth, UGC moderation, and feed ranking are the parts that resist speed — don't compress them.

**Positioning we're building toward:** *Letterboxd for supermarket products, with an AI
nutritionist under every item.*
