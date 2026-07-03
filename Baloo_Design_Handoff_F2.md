# Baloo — Design handoff for Order F2 (progressive ingredient list)

**Source of truth:** `Baloo Ingredients F2.dc.html` (interactive mockup — use the Preview bar: Data Streaming/Cached/Old cache, Accents None/Filing, View Desktop/Mobile).
**For:** Claude Code, Order F2, building inside B4's Ingredients tab. Maps to existing Tailwind tokens (`ink`, `muted`, `line`, `paper`, `canvas`, `natural`, `processed`, `shadow-card`, `rounded-2xl`, `animate-rise`, `tabular-nums`, Fraunces via `font-display`). **No score, no dial, no flags, no additive count, no red. The Natural/Processed pill stays the only meaningful colour.**

---

## Design decision — accents

**Ship WITHOUT left accent bars.** The caps role microlabel does the filing; colour adds noise at 20+ rows and risks reading as semantics. The mock includes an optional "filing" treatment (3×20px rounded tick, desaturated warm palette `#A79E8E #C4AC7F #B99589 #9C8FA6 #8C99A6 #A0A08B`, assigned per role, decorative only) — build it **only if Jitain asks**; if built, it must never map hue to judgment.

**Accordion: multi-open.** Rows toggle independently; opening one never closes another (no surprise motion, comparison-friendly).

---

## Product read strip

Sits inside the Ingredients tab, above the list, `mt-5` (20px) below the tab row. **No card, no tiles, no banner** — plain typography on canvas, a table of contents, not a report card.

1. **Counts line** (13px, muted, tabular-nums, flex baseline):
   `**15 ingredients** · ●4 natural · ●11 processed`
   - "N ingredients": weight 500, ink. Separators: middots in `line`.
   - "natural"/"processed" groups: 6px dot (`bg-natural` / `bg-processed`) + count + word, muted text. The dots echo the pills — legend, not verdict.
   - **Computed in code from the streamed array** — counts tick up live during streaming.
2. **product_summary** (mt-2.5, 15px, `ink/80`, leading 1.6). Arrives last during streaming → enters with `animate-rise`. While pending: 13px spinner (existing 2px line/natural style) + "Reading the formulation…" muted. **Absent for old cached results — omit the line entirely, no placeholder.**
3. **Reassurance line** (mt-2.5, 12px, muted): **"An explanation, not a verdict — tap any ingredient for the full story."** Always shown.

---

## The list container

One card: `bg-paper` · `border border-line` · `rounded-2xl` · `shadow-card` · `overflow-hidden` · `mt-4`. Rows divided by `border-t border-line` (first row none). **Not** one card per ingredient — 20+ separate cards is too heavy; one container reads as an index.

### Collapsed row (a `<button>`, full row is the trigger)
Flex, items-center, gap 12px, `py-3.5 px-5` (13px / 20px; mobile `px-4`). Background transparent; **open row group gets `bg-canvas`** (quiet "this one is open" marker). Streams in with `animate-rise`, collapsed, label order — expanding must not disturb the stream.

Left → right:
- **Rank**: 13px, `muted/70`, tabular, 24px fixed width, zero-padded ("01").
- **Name block** (flex-1, min-w-0, column, gap 3px):
  - Name: Fraunces 400, **16px**, lh 1.25, ink. (18px is the expanded-card size; 16px keeps rows scannable at 20+.) Inline after it, when present: the existing **% chip** (12px medium muted on `bg-canvas`, 6px radius, tabular).
  - **Role microlabel**: 11px, 600, uppercase, `tracking-[0.1em]`, muted. Text = `role` verbatim, uppercased ("CULTURE / FERMENT"). **`role` missing (old cache) → omit the line; row collapses to single-line height. Never show a placeholder.**
- **Natural/Processed pill**: existing component, unchanged, shrink-0.
- **Chevron**: 16px, 1.8px stroke, muted, chevron-down. Rotates 180° when open, `transform .2s ease-out`.

### Expanded content (unfolds below the row header, same container)
- Padding: `pt-0.5 pb-4`, left inset **56px** (aligns with name: 20 + 24 + 12; mobile 52px), right 20px.
- Content, in order (existing card typography, unchanged):
  - `what_it_is`: 14px, `ink/80`, leading 1.6.
  - `why_its_here`: mt-2, 14px, muted, prefixed **"In this product: "** in 500 `ink/70`.
  - `percentage_note` (when present): mt-2.5, `pt-2.5 border-t border-line`, 12px, muted.
- **Unfold motion (200ms, ≤250ms)**: CSS grid trick — wrapper `display:grid`, `grid-template-rows: 0fr → 1fr`, `transition: grid-template-rows .2s cubic-bezier(0,0,0.2,1)`; inner div `min-height:0; overflow:hidden`. Chevron rotates in the same 200ms. **`prefers-reduced-motion`: both collapse to instant** (transition-duration ~0).

### Accessibility
- Trigger is a real `<button>` with `aria-expanded`, full keyboard support (Enter/Space toggle, natural tab order). Expanded region follows the trigger in DOM order.

---

## States

| State | Behaviour |
|---|---|
| **Streaming** | Rows appear one by one (`animate-rise`), collapsed, label order. Counts line ticks up. "Analysing the rest…" row (existing spinner + 14px muted, `py-3.5 px-5 border-t`) sits at the container bottom while streaming. Summary arrives last with `rise`. |
| **Cached** | Everything at once; container fades in with existing `animate-fade-in`; no per-row stagger needed. |
| **Old cache** (no `role`/`product_summary`) | Rows render single-line (no microlabel), no summary sentence, no placeholder for either. Counts + reassurance line still show. Nothing else changes. |
| **Empty/edge** | 1-ingredient product: strip reads "1 ingredient · …" (singular, code-side). Very long names wrap; pill and chevron stay top-right aligned (items-center holds). % chip wraps with the name, never truncates the pill. |

---

## Mobile (< sm, mock at 400px)
- Row padding `px-4`; expanded inset 52px; results H2 24px. Everything else stacks naturally in the 640px column behaviour that already exists. Hit target: full-width row, ≥48px tall — comfortably above 44px.

## What changes vs today
- `IngredientCard` becomes the collapsed row + expandable body described above (the expanded typography is today's card content verbatim — Order A's depth is untouched, just behind a tap).
- Read strip is new, above the list, inside the Ingredients tab (B4).
- No other results-view changes; header, tabs, Nutrition tab per `Baloo_Design_Handoff_D_B4.md`.
