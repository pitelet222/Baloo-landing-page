# Baloo — Phase 3 Build Orders: Lists, Accounts & Canonical Analysis

**For:** Claude Code (build) + Claude Design (UX/visual)
**Owner:** Miquel  ·  **Repo:** github.com/pitelet222/Baloo-landing-page  ·  **Live:** baloo-web-sand.vercel.app
**Builds on:** the Product/Offer architecture agreed previously.

This phase turns Baloo from a single-product analyser into a **product-discovery + list-creation**
tool with a thin social layer. Read sections 0–2 before building — they set the scope fences and the
data model everything else depends on.

---

## 0. What this phase is (and isn't)

The MVP is: **analyse products → save them into useful lists → share those lists.** Plus the minimum
social mechanics needed to make sharing meaningful:
- **Lists:** Save + Upvote
- **Users:** Follow (so lists from people you follow can surface on Discover)

**Explicitly NOT in this phase** (do not build): comments, activity feeds, messaging/DMs,
notifications. Also no list descriptions, cover images, tags, privacy settings beyond a single
public/private toggle, and **no templates**. Reason: those create moderation, notification and
cold-start problems before we've validated that people even want to analyse, save and share. We get
users *active* first. Note these as future expansions; don't build them.

## 1. The core principle to protect

**One canonical ingredient analysis per product, generated once, reused everywhere.** A product is a
reusable object; its analysis is computed the first time the product enters Baloo and then attached
wherever that product appears (lists, search, Discover). Never regenerate analysis per view. This is
both the cost strategy and the product's soul — Baloo is not "find and share products," it's "find
products we break down into ingredient intelligence for you, and share those."

**When analysis runs:**
- **Paste URL in "Know what's in your food":** analyse immediately (foreground) → store canonical
  product + source ingredient list + analysis.
- **Add product to a list, already in Baloo:** attach the existing product + analysis instantly.
- **Add product to a list, new to Baloo:** add to the list immediately → mark the product
  `analysing` → run analysis in the **background** → attach the completed analysis everywhere that
  product appears. Not foreground, because analysis isn't the user's intent when list-building.
- **"View ingredient analysis" icon:** a viewer. If analysis is done, show it; if `analysing`, show
  that state; only if it's missing/failed does clicking trigger a fresh run.

No artificial friction before the API call — cost is capped by analyse-once-per-product; add a
per-user rate limit later only if abuse appears.

---

## PART A — Claude Code orders

Run from the repo root, one order per session, approve a plan first, commit after each.

### Order 1 — Foundation: accounts + relational data (Supabase)
```
Add Supabase to the project for auth + Postgres (we already use it as a connector). Set up:
- Supabase Auth with email magic-link sign-in. Public browsing/analysis stays anonymous; creating
  lists, upvoting, saving and following require login. Add a lightweight auth context + a sign-in
  modal, not a separate auth page.
- A `profiles` table (id = auth user id, unique username, display_name, created_at) with a username
  chosen on first sign-in.
Keep Upstash Redis only as an optional hot cache; canonical data now lives in Postgres. Put all DB
access behind lib/db/*.ts helpers, and enable Row Level Security with sensible policies (a user can
write only their own profiles/lists/items/votes/follows; public lists are world-readable).
```

### Order 2 — The data model (canonical products, offers, lists, social)
```
Create the Postgres schema (SQL migration + typed lib/db helpers):

products(id, identity_key UNIQUE, barcode NULL, name, brand NULL, retailer_primary, category NULL,
         ingredients_raw, analysis_status ENUM(pending,analysing,done,failed),
         analysis JSONB NULL, analysed_at NULL, created_at)
offers(id, product_id FK, retailer, url, available BOOL, price NUMERIC NULL, currency NULL,
       price_at NULL, created_at, UNIQUE(product_id, retailer, url))
lists(id, owner_id FK, title, is_public BOOL DEFAULT false, upvote_count INT DEFAULT 0,
      save_count INT DEFAULT 0, created_at, updated_at)
list_items(id, list_id FK, product_id FK, position INT, added_at, UNIQUE(list_id, product_id))
list_upvotes(list_id, user_id, PRIMARY KEY(list_id,user_id))
list_saves(list_id, user_id, PRIMARY KEY(list_id,user_id))
user_follows(follower_id, followee_id, PRIMARY KEY(follower_id,followee_id))

identity_key = the product's barcode when we have one, else a normalized-URL hash (see hashUrl).
Two retailer listings of the same barcode = ONE product with TWO offers. Keep upvote_count/save_count
denormalized via triggers or on write. Add pg_trgm on products.name for search.
```

### Order 3 — Refactor analysis into a stored product object
```
Rework the current /api/extract + /api/analyze flow so the OUTPUT is a persisted canonical product,
not an ephemeral response. On paste-URL analysis:
1. Resolve identity_key; if a product with that key exists and analysis_status='done', return it
   immediately (no Firecrawl/Claude).
2. Otherwise create/get the product, create the offer for this URL+retailer, run Firecrawl → Claude
   extract → Claude analyse (streaming to the client as today), and on finish store analysis JSONB +
   set status='done' + analysed_at.
Keep the existing streaming UX for the paste flow. Move the Firecrawl→extract→analyse pipeline into
lib/analysis/*.ts as framework-agnostic functions so it can be called from both the streamed route
and the background job. Retire the old URL-hash-only cache in favour of product identity.
```

### Order 4 — Background analysis for products added to lists
```
Add POST /api/products/analyze that takes a product id, runs the lib/analysis pipeline, and updates
the product's analysis + status. When a NEW product is added to a list (Order 6), insert the product
as status='pending', return the list item immediately, then trigger this route as background work
(use Next.js `after()` / Vercel waitUntil; fall back to a fire-and-forget fetch). Set status
'analysing' while it runs, 'done' or 'failed' at the end. Surface status changes to the UI via
Supabase Realtime subscription on the product row (preferred) or polling. A 'failed' product can be
retried from the View-analysis icon.
```

### Order 5 — Two-mode search (used when adding products to a list)
```
Build the search behind one input with two modes:
1. Search Baloo's catalogue: query products by name (pg_trgm), ranked so the current user's own
   previously-added/analysed products rank first, then products from other users' lists/analyses.
   Before the user types, show their recent products. Return product id, name, brand, retailer,
   analysis_status, and a thumbnail if we have one.
2. Paste a product URL: detect a URL in the input and offer "Analyse & add this product" — this runs
   the add-new-product path (Order 4).
Expose GET /api/search?q= for mode 1. Keep the ranking signals (own vs others', recency) in one
place so they can become a real algorithm later.
```

### Order 6 — Lists: create, view, add products
```
Implement lists end to end:
- Create: a minimal inline create (title only) that, on save, drops the user STRAIGHT into the new
  list with a prominent "Add your first product" action — no screen reset, no separate config step.
  The public/private toggle is a small, secondary control, NOT a header-dominating element.
- List detail: title, owner, item count, upvote + save actions, and the ordered items. Each item row
  shows product name/brand/retailer, a "View ingredient analysis" icon (tooltip), and — using the
  offers table — an "also available at A, B, C" affordance.
- Add product: opens the Order-5 search. Selecting a cached product attaches it instantly; pasting a
  new URL adds it immediately with an "Analysing…" state (Order 4).
No descriptions, cover images, tags, privacy beyond the toggle, or templates.
```

### Order 7 — One analysis component, two containers
```
Extract the ingredient analysis UI into a single <IngredientAnalysis productId> component (same
cards, terminology, tags, nutrition, data everywhere). Render it in two containers by CONTEXT, not by
duplicating the design:
- Full page / main result: the paste-URL flow and any deliberate click on a product's name or image
  (route /product/[id]).
- Quick-view: the "View ingredient analysis" icon opens a right-side DRAWER on desktop and a
  FULL-SCREEN SHEET on mobile, with an easy close/back that returns the user to their exact scroll
  position in the list. Pick drawer vs sheet by breakpoint.
Same underlying product object in all cases. Add loading/analysing/failed states to the component so
it works whether analysis is done or still running.
```

### Order 8 — Crossover actions (close the loop)
```
Wire the two loop-closing actions:
- On any analysis result (paste flow AND quick-view), add a clear "Add to list" action (choose an
  existing list or create one inline).
- Tapping/clicking a product inside a list opens its analysis (icon = quick-view; name/image =
  full page, per Order 7).
Target flows: Analyse → Add to list → Share list;  Discover list → Open product → See analysis →
(optional) Add to own list.
```

### Order 9 — Minimal social + navigation
```
- Lists: Upvote (public count, one per user) and Save (private bookmark). Optimistic UI.
- Users: Follow (one-directional). No comments, no feeds, no messaging.
- Main navigation is exactly: Discover · My Lists · @username. Do NOT put "Following" in the main
  nav — surface followed content inside Discover ("New from people you follow") and keep the
  Following/followers + saved lists in the body of the @username profile.
- Discover: public lists, with a "New from people you follow" section that appears once the user
  follows anyone. @username profile: the user's public lists (My Lists), saved lists, and
  follow counts.
Share a list = a public URL to /list/[id]; add basic OG tags so shared links look good.
```

---

## PART B — Claude Design orders

Design these before/alongside the matching Code orders. Keep the existing Baloo visual language
(calm, editorial; white/paper, ink text, serif display, green/amber only as ingredient tags). The
list/social surfaces should feel like the SAME product as the analyser, not a bolted-on social app.

1. **Global navigation** — a simple top nav: Discover · My Lists · @username, plus a sign-in entry.
   Show the signed-out vs signed-in states.
2. **Create-a-list, seamless** — the moment after "New list": the user types a title and lands
   directly inside the empty list with a strong "Add your first product" call to action. No jarring
   screen reset between naming and adding (this fixes the 00:50–00:51 transition in the video). The
   public/private toggle is a small, quiet control — not a header hero.
3. **List detail** — title, owner, counts, Upvote + Save, and item rows. Design the item row:
   product name/brand/retailer, the "View ingredient analysis" icon with tooltip, and the "also
   available at A, B, C" affordance. Include the empty state (the add-first-product moment).
4. **Two-mode search** — one input that (a) shows recent products before typing and searches Baloo's
   catalogue as you type, and (b) recognises a pasted URL and offers "Analyse & add." Show how cached
   results vs the paste option are visually distinguished, and the "Analysing…" state for a
   just-added new product.
5. **Ingredient analysis — two containers, one design.** Specify: the full-page result (unchanged
   from today) AND the quick-view — a right-side drawer on desktop, a full-screen sheet on mobile —
   using the identical ingredient cards. Show open/close and how the user returns to their place in
   the list. Include loading/analysing and failed states.
6. **Crossover affordances** — the "Add to list" action on an analysis result, and the list-picker
   (pick existing / create inline).
7. **Discover + profile** — Discover with a "New from people you follow" section; the @username
   profile holding My Lists, Saved, and follow counts. Design Upvote / Save / Follow controls and
   their active states.

Deliverable: desktop + mobile frames for each, plus updated design tokens so the Code build matches.
If Jitain's Figma covers any of these, match it — export those frames into Claude Design rather than
designing from scratch.

---

## PART C — Design workflow (apply to every new screen)

Standing rules for how we design each surface, per Jitain's tooling notes. These are process, not
one-off orders — run them on the analysis result, list detail, two-mode search, quick-view, and
Discover.

1. **Three approaches first.** Before committing to a layout, have the tool produce THREE genuinely
   different UX directions — different information hierarchy and interaction model, not colour
   swaps. In Figma Make, use Jitain's trick: ask it to include **v1 / v2 / v3 links in the header**
   so all three are browsable from one build. In Claude Code, prompt "show me three completely
   different UX approaches" and pick before building.
2. **Ritual review on every meaningful screen**, then apply the best fixes:
   > "You're Dieter Rams, Jony Ive, the Linear design team, and the Duolingo product team. Critique
   > this screen. Ignore implementation complexity. Focus purely on clarity, cognitive load,
   > information hierarchy, and delight. Give me 20 concrete improvements."
3. **Guardrail as design tools enter: gamified/animated ≠ scored.** The tooling references keep using
   a "72/100" score example — that is NOT Baloo. Keep it score-free: no number, no traffic lights,
   no verdict. Animation and delight (later, via Rive — loading states, empty states, the card
   reveal) are welcome; a health score is not.
4. **Mobbin references to pull (align with Jitain before building), mapped to our surfaces:**
   - *Lists as the core object:* Letterboxd (profile + lists + item page), Goodreads (Listopia
     community-ranked lists), Pinterest (boards, save, quick-view), Are.na (channels).
   - *Discovery + light social:* Vivino (product page + scan + community), Untappd (logging + friends),
     Beli (ranked lists + following), Thingtesting (discovery + reviews).
   - *Add-to-collection search flow:* Spotify (search → add to playlist), Pinterest (save to board).
   - *Product / analysis detail:* Vivino product page; Yuka's ingredient screen (borrow the clarity,
     drop the score).
   - *Quick-view drawer / sheet:* Pinterest pin quick-view and common mobile bottom-sheets.

## Suggested build sequence

1 (auth + Supabase) → 2 (schema) → 3 (analysis as stored product) → 4 (background analysis) →
6 (lists) + 5 (search) → 7 (one analysis, two containers) → 8 (crossover) → 9 (social + nav).
Design orders B2–B5 should be done before Code orders 6–7.

## Add to the repo's CLAUDE.md
- One canonical analysis per product, generated once on first persist, reused everywhere. Never
  regenerate per view.
- Product identity = barcode else normalized-URL hash; Tesco+Ocado of one barcode = one product,
  two offers.
- Analysis triggers: paste-URL = foreground; add-new-to-list = background; icon = viewer (+retry).
- Phase-3 scope fence: NO comments, feeds, messaging, notifications, list descriptions, cover
  images, tags, templates. Main nav is only Discover · My Lists · @username.
