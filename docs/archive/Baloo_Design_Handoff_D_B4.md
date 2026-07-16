# Baloo — Design handoff for Orders D + B4

**Source of truth:** `Baloo Board + Nutrition.dc.html` (interactive mockup — board Layout A "Ledger" is the chosen direction; Layout B in the file is archive only).
**For:** Claude Code, building into `Baloo-landing-page`. Everything below maps to existing Tailwind tokens (`ink`, `muted`, `line`, `paper`, `canvas`, `natural`, `processed`, `shadow-card`, `shadow-hero`, `rounded-2xl`, `max-w-tool`, `animate-rise`, `tabular-nums`). **No new colours. No red/green anywhere in these features.**

---

## Order D — homepage board ("On Baloo right now")

### Placement

- Idle homepage only, below `<HowItWorks/>`: `mt-14` (56px). Hidden the moment an analysis starts (same rule as HowItWorks).
- Fades in with the existing `animate-fade-in`.
- Data: `getBoard()` from `lib/stats.ts` on load; brief cache is fine.

### Section header (outside the card)

- Live dot: 8px circle, `bg-natural`, ring `0 0 0 4px` `natural-soft`, gentle pulse — keyframe `opacity 1→.45, scale 1→.7`, 2.6s ease-in-out infinite. **Respect `prefers-reduced-motion`** (no pulse, no feed animation).
- H2: Fraunces 400, 24px, ink — **"On Baloo right now"**. Dot and H2 in a flex row, gap 10px.
- Sub (mt-2, 14px, muted): **"What people are scanning — every scan quietly adds to the board."**

### The card (one card, Ledger layout)

`bg-paper` · `border border-line` · `rounded-2xl` (16px) · `shadow-card` · `p-6` (24px).

Panel labels throughout: 12px, weight 600, uppercase, `tracking-[0.12em]`, ink.

**1. Recently scanned**

- Label row: "Recently scanned" left, "last 30" right (12px muted).
- Rows (`<ul>`, mt-2): `py-2.5`, `border-t border-line`, flex, justify-between, gap 12px.
  - Left (truncate): product name 14px medium ink, then ` · Retailer` in muted.
  - Right (shrink-0): `GB · just now` — country code + relative time, 12px muted, tabular-nums.
- Show max 7. New entries prepend with `animate-rise`. Time labels: `just now` (<45s), `Nm ago`, `Nh ago`.

**2. Divider** — 1px `line`, `my-5`.

**3. Two-column grid** — `grid-cols-2 gap-7` (stacks to 1 col on mobile):

- "Top supermarkets" and "Top countries", top 5 each. Row anatomy (`py-2`, flex, gap 12px):
  - Rank: 12px muted tabular, 12px wide.
  - Name: 14px ink, flex-1, truncate.
  - Proportion bar: 56×4px track, `bg-line`, full-round; fill = ink at **30% opacity**, width = `count / max(count) * 100%`. (Neutral ink — never green/amber.)
  - Count: 13px muted tabular, right-aligned, 44px, en-GB thousands separators.

**4. Top scanners strip** — `border-t border-line pt-4`, flex, justify-between:

- Left: 30px square, `bg-canvas`, 8px radius, containing a 15px thin-stroke lock (1.6px stroke, muted). Then: "Top scanners" 14px ink; "Arrives with Baloo accounts — scan history and streaks." 12px muted.
- Right pill: **"Coming soon"** — 11px, 600, uppercase, `tracking-[0.09em]`, muted on `bg-line`, full-round, `px-2.5 py-1`.
- Gated by `SHOW_TOP_SCANNERS=false`.

### Empty state (fresh deploy — `getBoard()` returns empty)

- Recently scanned → "Nothing scanned yet. Paste a link above and you'll be first on the board." (14px muted)
- Top supermarkets / Top countries → "No scans yet."
- Top scanners strip unchanged. Card and headers stay — never a blank grid.

### Foot note (below the card)

mt-3.5, 12px, `muted/80`: **"Recorded at country level only — no personal data, no exact location."**

---

## Order B4 — results tabs + Nutrition tab

### Tabs (directly under the results header)

- Row: flex, gap 24px, `border-b border-line`, mt-1.5.
- Tab button: `py-3`, 15px, no background. Active: ink, weight 600, 2px `natural` underline sitting on the row border (`-mb-px`). Inactive: muted, weight 500.
- **"Processing"**: disabled, 50% opacity, `cursor-not-allowed`, with a "Soon" pill (10px, 600, uppercase, muted on `bg-line`, full-round). Not clickable.
- "Ingredients" tab = the existing streamed cards, unchanged.

### Nutrition tab

**Top row** (flex, wrap, justify-between, gap 12px, mt-6):

- Profile selector (left): pill button — `border-line`, `bg-paper`, full-round, `px-3.5 py-2`, 13px. Content: `Showing context for` (muted) + profile label (medium ink) + 12px chevron-down (2px stroke).
  - Dropdown: 230px min, `bg-paper`, `border-line`, 12px radius, `shadow-hero`, 6px padding. Item: label 14px medium ink over detail `2,000 kcal reference` 12px muted tabular; selected item `bg-canvas`; 8px radius, `px-2.5 py-2`. Persist choice in localStorage (Order B2).
- Right: "Per serving · 30 g (about 13 crisps)" — 13px muted (serving size from extraction).

**Table card:** `bg-paper`, `border-line`, `rounded-2xl`, `shadow-card`, `overflow-hidden`, mt-4.

- Head row: `bg-canvas`, `border-b border-line`, grid `1.6fr 0.9fr 0.9fr 1.15fr`, gap 12px, `px-5 py-3`. Labels 12px, 600, uppercase, `tracking-[0.06em]`, muted: **Nutrient / Per serving / Per 100 g / % of daily intake**.
- Body rows: same grid, `px-5 py-3`, `border-t border-line`, items centred.
  - Nutrient: 14px ink. "of which saturates/sugars" rows: muted + 16px left indent.
  - Per serving: 14px ink, tabular, right-aligned. Per 100 g: 14px muted, tabular, right-aligned.
  - % cell: number (14px ink tabular) above a 120×4px track (`bg-line`, full-round) with an ink fill at **24% opacity**, width `min(pct, 100)%`. Value missing → "—", no bar.
- **All arithmetic in code** (`lib/nutrition.ts`): `round(per_serving / profile_reference × 100)`. The model never calculates.

**Context line** (mt-4, 14px, `ink/80`, leading 1.6) — Claude writes the words, code supplies the numbers. Pattern from the mock:

> "A 30 g serving is about 15% of the reference daily fat and 7% of the daily salt for an average adult. A whole tube works out closer to 98% of the day's fat — a sense of how a portion adds up, not a verdict."

**Disclaimer** (mt-3, `pt-3 border-t border-line`, 12px muted):

> "General estimate from public UK reference values (FSA/NHS) — not personalised medical or dietary advice."
> When a child profile is selected, append: "Children's needs vary with age and activity; for anything specific, check with a health professional."

**Hard rules:** no nutrient colour-coding, no good/bad wording, bars are ink-tinted only.

---

## Order B2 — profile presets used in the mock (UK)


| Profile            | kcal | fat g | satfat g | carb g | sugars g | fibre g | protein g | salt g |
| ------------------ | ---- | ----- | -------- | ------ | -------- | ------- | --------- | ------ |
| Adult (average)    | 2000 | 70    | 20       | 260    | 90       | 30      | 50        | 6      |
| Child · 7–10 yrs | 1850 | 70    | 20       | 240    | 85       | 20      | 28        | 5      |
| Child · 4–6 yrs  | 1650 | 64    | 18       | 210    | 75       | 20      | 20        | 3      |
| Child · 1–3 yrs  | 1230 | 48    | 15       | 160    | 55       | 15      | 15        | 2      |

Adult row = FSA/NHS front-of-pack reference intakes. Child rows were assembled for the mock from NHS salt/fibre guidance + SACN energy estimates — **verify each value and cite the exact source in a comment in `lib/profile.ts`** before shipping. Default: Adult (average). Selector label: "Showing context for: [profile]".

---

## Motion & responsive notes

- New: one `pulse` keyframe (above) for the live dot. Everything else reuses `rise` / `fade-in` / the spinner. All motion honours `prefers-reduced-motion`.
- Mobile (< sm): board two-column grid → single column; everything else inherits the existing single-column behaviour. Nutrition table keeps 4 columns (grid `1.4fr 0.8fr 0.8fr 1fr`, 13px values fit at 390px).
- Board polls nothing — load-time fetch only. A short-lived cache on `getBoard()` (~30–60s) is enough.
