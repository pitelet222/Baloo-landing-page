# Baloo — Design Handoff · G5 Discovery

**Order:** D-G5 — Browse / search / category landings / public profile
**Mockup:** `Baloo_Discovery.dc.html` (interactive; four surfaces + Desktop/Mobile toggle + state toggles in the floating review dock)
**Reused component:** `ListCard.dc.html` (the G4 list card — see "List card" note below)
**Follows:** standing rules in `Baloo_Design_Orders_Phase3.md`. No new colours; the Natural/Processed pill stays the only meaningful colour. Calm, editorial, education before persuasion.

> **G4 dependency note.** `Baloo_Design_Handoff_G4_Lists.md` was not present in the session, so the list card here is **derived** to the standing tokens and the G4 order's stated anatomy (cover, title, curator, item count, save count). It is authored as a standalone reusable component (`ListCard.dc.html`) so G4 can adopt or reconcile it. If G4 already shipped a card, treat that as canonical and repoint the discovery grids at it — nothing else in G5 changes.

---

## 0 · Token map (every measurement → existing token)

Discovery inherits the shipped system verbatim. Nothing new is introduced.

| Role | Token / value |
|---|---|
| Page background | `canvas` `#FBFBF8` |
| Card / panel surface | `paper` `#FFFFFF` |
| Primary text | `ink` `#1A1A18` |
| Secondary text | `muted` `#6F756E` |
| Tertiary / body-in-card | `ink/70` |
| Hairlines, dividers, input & card borders | `line` `#ECEBE5` |
| Card hover border | `#dedcd2` (line, one step darker — hover only, matches shipped card-hover treatment) |
| Natural dot / pill | `natural` `#2E7D52` on `natural-soft` `#E7F1EB` |
| Processed dot / pill | `processed` `#B5701F` on `processed-soft` `#F6ECDD` |
| Display type | Fraunces via `font-display`, weight **400** (wordmark 600) |
| Functional type | Inter via `font-sans`, 400 / 500 / 600 |
| Card radius / panel radius | `rounded-2xl` **16px** |
| Control radius (chips, pills, search, avatar) | `rounded-full` |
| Thumbnail radius | 9px (`rounded-lg` family) |
| Card elevation | `shadow-card` `0 1px 2px rgba(26,26,24,.04), 0 1px 3px rgba(26,26,24,.05)` |
| Card hover elevation | `shadow-card-hover` `0 4px 14px rgba(26,26,24,.07), 0 2px 5px rgba(26,26,24,.04)` |
| Reading column | `max-w-tool` **640px** (hero copy, empty cards, product lists) |
| Discovery grid container | **1140px** max — the one documented extension of `max-w-tool` for multi-column browse (single reading column doesn't hold a card grid) |
| Entrance motion | `animate-fade-in` (view switch) · `animate-rise` (cards streaming in) |

**Type scale used:** page H1 36–40px · category H1 38px · section headings (Fraunces) 23px · card/profile name 28px · ingredient/product/list name 17–19px · body 15–17px · meta/labels 12–14px · uppercase eyebrow 12px/`.14em`.

**Numerals:** all counts, %, follower/save figures use `tabular-nums` so lists and rows align.

---

## 1 · Shared chrome (all four surfaces)

**Header** (`paper`, `border-b line`): wordmark (Fraunces 600, 20px) → left; a full-round `canvas` search field (Lucide-weight search glyph + input, `Search products and lists…`) → flex-fill centre; ghost **Sign in** button → right. Flex row that **wraps** — at 390px the wordmark + Sign in sit on the first line and search takes its own line. Enter in the field routes to Search. `AccountMenu` placeholder (renders nothing until auth, per G2) replaces Sign in when signed in.

**Footer** (`border-t line`): "Baloo — know what's in your food." + muted links (About / How it works / Privacy). Same calm sign-off as the tool.

**Voice:** sentence case throughout; British spelling; no emoji; numbers quiet. Section headings are plain nouns ("Recently added", "Popular this week", "Top lists", "Top products", "Featured categories").

---

## 2 · List card (reused everywhere)

`ListCard.dc.html` — the compact representation used in browse, search, category and profile grids (and G6 feed). White `paper`, 1px `line`, `rounded-2xl`, `shadow-card`; hover lifts to `shadow-card-hover` + border `#dedcd2` and underlines the title.

**Anatomy (top → bottom):**
1. **Cover band** (`canvas`, `border-b line`): the brand ships **no imagery**, so the cover is typographic — an uppercase `List` label + item count, then the **first three item names** as a faint (`ink/70`, Fraunces 14px) numbered peek. The cover *is* a table of contents. This keeps the "type-and-space only" brand and adds zero colour.
2. **Title** — Fraunces 19px/400.
3. **Description** — Inter 13px `muted`, clamped to 2 lines.
4. **Footer row** (`border-t line`): curator avatar (24px round, `canvas`, initial in Fraunces) + `@handle`; save count with a thin heart glyph, right-aligned.

Grid: `repeat(auto-fill, minmax(258px, 1fr))`, 16px gap — reflows to a single column inside the 390px frame with no media query. Cards stretch to equal height per row.

**Card states:** default · hover (lift) · focus (2px `natural/20` ring — inherit control focus). Cards link to `/list/[slug]` (G4).

---

## 3 · Browse (`/` discovery home)

1. **Hero** (max 680px): `Discover` eyebrow (natural) · H1 "Lists worth trusting." (Fraunces 40) · one-sentence subhead · a row of full-round **category chips** (quick entry to landings).
2. **Recently added** — section heading + "See all" + list-card grid (4).
3. **Popular this week** — same pattern (4).
4. **Featured categories** — grid of category cards (`repeat(auto-fill, minmax(232px,1fr))`): name (Fraunces 19) + "N products · M lists" meta. Hover = card lift.

**States:**
- *Loading:* card grids show 3–4 skeleton cards — a `paper`/`line` card whose cover shows three `line`-coloured bars and whose body shows two grey title bars. **No shimmer sweep** (off-brand); a single `animate-fade-in` on the skeleton, then cards `animate-rise` in as data resolves.
- *Empty (no lists in the system yet):* keep the hero, replace the grids with one calm card — "No public lists yet. Paste a product link on the home tool to analyse a product, then save it to your first list." with an **Analyse** affordance.
- *Error (feed fetch failed):* the shipped friendly-error card pattern — "We couldn't load discovery right now." + "Refresh to try again." No technical detail.

---

## 4 · Search (`/search?q=`)

Mixed product + list results in one view.
- **Header block** (max 820px): `Search` eyebrow · H1 `Results for "{query}"` (Fraunces 29) · count line `"5 results · 2 lists, 3 products"` (`tabular-nums`).
- **Segmented filter** — full-round pills **All / Products / Lists**. Active = `ink` fill, `paper` text; inactive = `paper` + `line` border, `ink/70`.
- **Lists** section (uppercase `muted` label) → list-card grid.
- **Products** section (max 760px) → one `rounded-2xl` `paper` container, rows divided by `line` (an index, not stacked cards — same structure as the shipped ingredient list). Each row: brand-initial thumbnail (`canvas`, 42px) · product name (Fraunces 17) · "brand · retailer" · a factual `N natural · N processed` dot readout (reuses the shipped ReadStrip dot motif — a count, never a verdict/score) · "in N lists" · chevron. Row hover = `canvas` wash.

Filter toggles which sections show (`All` shows both).

**States:**
- *Results* (default) — above.
- *Empty / no matches* (toggle in dock): a max-640px `paper` card — "No matches for "{query}"." + "Try a product name or a retailer. Or paste the product link and we'll read the label for you." + an inline paste-link field and **Analyse** button. This is the key discovery→ingestion bridge: search misses route straight into the tool.
- *Loading:* header renders immediately; below it the product container shows 3 skeleton rows + the shipped `Analysing…`-style inline spinner (2px `line` track, `natural` top). List grid shows skeleton cards.
- *Edge:* one-word query, very long product names truncate with ellipsis (name column is `min-width:0`); a query that only matches lists (or only products) simply renders the one section, count line adjusts.

---

## 5 · Category landing (`/c/[slug]` — "Cereals")

- **Header** (max 720px): `Category` eyebrow · H1 "Cereals" (Fraunces 38) · one-sentence description · "128 products · 24 lists" meta · a row of **facet chips** (No added sugar / High fibre / Kids / Granola / Muesli / Porridge) — full-round, hover `canvas`.
- **Top lists** — heading + "See all" + list-card grid (3).
- **Top products** — heading + "See all" + ranked product index (max 760px). Same row as search but with a leading **rank number** (`tabular-nums`, `muted/70`) before the thumbnail.

**States:**
- *Populated* (default).
- *Sparse category* (few products / no lists yet): drop the empty section, keep the other; if no lists, show a one-line calm prompt under "Top lists" — "No lists in Cereals yet — make the first one."
- *Loading:* skeleton cards + skeleton rows as above.
- *Facet applied:* selected chip = `ink` fill / `paper` text (same as active segmented pill); results re-rank; heading count updates.

---

## 6 · Public profile (`/u/[handle]`)

- **Identity** row: 64px round avatar (`canvas`, Fraunces initial — no photo, on-brand) · display name (Fraunces 28) · `@handle` (`muted`) · one-line bio (`ink/70`, max 520px) · meta line "Joined 2025 · 2.4k followers · 180 following · 6 lists" (`tabular-nums`). Actions right: **Follow** (accent/green button) + **Share** (ghost). Follow is a placeholder affordance pending G2 auth; signed-out click routes to sign-in.
- **Tabs** (`border-b line`): **Lists** active (2px `natural` underline) · **Saved** with a `Soon` pill (reserved, matches the shipped "Processing — Soon" disabled-tab pattern). No votes/comments surfaced (later orders).
- **Lists** — public list-card grid (their public lists only).

**States:**
- *Has public lists* (default).
- *Empty* (toggle in dock): calm max-560px card — ""{handle} hasn't shared any public lists yet." + "When they make a list public, it'll show up here. Follow to be notified." No blame, no empty-illustration.
- *Own profile vs others:* own profile swaps Follow→**Edit profile** and shows private lists behind a subtle "Private" affordance (private cards carry a small `line`-pill "Private"; not shown publicly). Others see public only.
- *Loading:* identity block placeholder (avatar circle + two `line` bars) then skeleton card grid.

---

## 7 · Motion (honours `prefers-reduced-motion`)

- **View switch:** the routed surface fades in — `animate-fade-in` (opacity 0→1, 0.5s ease-out). No slide, no parallax.
- **Cards / rows on load:** `animate-rise` (opacity 0→1 + `translateY(6px→0)`, 0.35s ease-out) — the shipped signature, applied as grids/rows resolve.
- **Hover:** cards & category cards lift `shadow-card → shadow-card-hover` + border → `#dedcd2` over ~0.2s; product/list rows wash to `canvas` over ~0.15s; "See all" and footer links gain `ink` + underline. No transform on rows, no scale/bounce anywhere.
- **Spinner** (loading rows): 16px circle, 2px `line` track, `natural` top border, ~0.8s spin — the one shipped "icon".
- **Global reduced-motion rule** collapses all durations to ~0 (already in `globals.css` / `motion.css`). Honour it.

---

## 8 · Mobile (390px frames)

Every surface is authored responsive; the mockup's **Mobile** toggle renders the exact 390px frame. Because grids use `auto-fill minmax(258px,1fr)` and flex rows wrap, layout reflows with **no media queries**:

- **Header** wraps: wordmark + Sign in on line 1, full-width search on line 2.
- **All card grids** collapse to a single column.
- **Product / list rows** keep the row shape; name truncates (`min-width:0`), the dot readout + "in N lists" stack to the right and wrap under if needed.
- **Hero / category / profile** copy columns are already ≤ frame width; profile actions (Follow / Share) wrap below the identity block.
- **Segmented filter & facet chips** wrap to multiple lines.
- Touch targets: search field, chips, buttons, rows all ≥ 44px tall.

---

## 9 · Component reuse ledger

| Surface element | Source |
|---|---|
| Wordmark | shipped `Wordmark` (Fraunces 600) |
| Sign in / Analyse / Follow / Share buttons | shipped `Button` (ghost / primary / accent) |
| Search & paste-link field | shipped input treatment (`canvas`, `line`, full-round, focus `natural` + `natural/20` ring) |
| List card | `ListCard.dc.html` (G4 card — derived; see note) |
| Product row (index container + dividers) | structure lifted from the shipped ingredient list (`rounded-2xl paper shadow-card`, `li+li border-t line`) |
| Natural/Processed dot readout | shipped ReadStrip dot motif (factual counts) |
| "Soon" reserved pill | shipped disabled-tab "Soon" pill |
| Colours / type / spacing / motion | tokens verbatim — nothing new |

---

## 10 · Open questions for the build

1. **G4 card reconciliation** — adopt `ListCard.dc.html` or repoint to the shipped G4 card (see top note).
2. **Ranking inputs** — "Popular this week" and "Top products/lists" need a defined signal (saves + recency?). Design is signal-agnostic.
3. **Search scope** — does search match ingredient names too (e.g. "palm oil"), or only product/list titles + brand/retailer? Copy of the count line assumes product + list only.
4. **Category taxonomy** — facet chips are illustrative; confirm the real facet set per category.
5. **Own-profile editing** — Edit-profile and private-list affordances are sketched here but formally belong with the account work (G2).
