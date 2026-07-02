# Baloo — Order F: Progressive ingredient list ("read at a glance, unfold to learn")

**For:** Claude Design (F-design) + Claude Code (F1 data, F2 UI) · **Owner:** Miquel · **Date:** July 2026
**Reference:** Juka's checker list (screenshots in the thread) — borrow the *structure*, never the verdicts.

## 0. Why
The Order-A deep descriptions are excellent but land as a wall of text with no user action —
every card arrives fully expanded. Juka's pattern fixes the reading model: a compact row per
ingredient (name + a few-word functional label + chevron), and the full explanation only when
the user taps. Our depth becomes the reward for curiosity instead of the obstacle to scanning.
The product also gets a one-glance "read" strip above the list.

## 1. What we borrow from Juka — and what we refuse
**Borrow (structure):**
- Collapsed rows, one per ingredient, tap/click to unfold. Caps microcopy under the name with
  the ingredient's *function* ("SWEETENER", "THICKENER / STABILISER", "CULTURE / FERMENT").
- A compact product strip above the list: counts + one plain sentence about the formulation.
- A short "what this is/isn't" line (Juka: "…not a health verdict") — ours already exists in tone.

**Refuse (verdicts — these violate CLAUDE.md guardrails):**
- ❌ The score dial (7/10). No score of any kind — that decision belongs to Jitain (§8).
- ❌ "WORTH A LOOK" flags, bullet-dot warnings, red/alarm text, "additives: N" framing.
- ❌ Judgment colour-coding. If the design uses per-category accent colours (Juka's left bars),
  they must read as neutral filing labels — muted, decorative, never traffic-light semantics.
  The ONLY tag that carries meaning stays the existing green/amber Natural·Processed pill.

## 2. Sequencing
- **F-design** can join the next Claude Design pass (ideally alongside any D/B4 refinements so
  the Ingredients and Nutrition tabs feel like one product).
- **F1 (data)** is independent of design — can be built any time; it only touches schema/prompt.
- **F2 (UI)** builds after **B4** lands (both rework `ResultsView`; F2 replaces the card list
  *inside* B4's Ingredients tab) and after the F-design handoff exists.

## 3. Order F1 — Claude Code: role + product summary (data only, no UI)
```
Read CLAUDE.md and Baloo_Order_F_Progressive_Ingredients.md. In lib/schema.ts, extend
ingredientSchema with `role`: a 2–4 word functional label for what the ingredient does in this
product, written in plain words. Guide the model (in lib/prompts.ts analysisPrompt) with a
suggested set — Base, Sweetener, Thickener / stabiliser, Emulsifier, Preservative, Colour,
Flavour, Culture / ferment, Fortification, Oil / fat, Raising agent — but allow other concise
labels when none fits. The role is purely functional and neutral: never a judgment, never a
warning. Also add `product_summary` to analysisSchema: ONE calm, neutral sentence about the
formulation as a whole (e.g. "Built mostly on recognisable kitchen ingredients, with two
additives doing texture work.") — no advice, no verdict, no "good/bad". All counts shown in the
UI (ingredients, natural, processed) are computed in code, never by the model. Keep the JSON
shape otherwise unchanged and the label order absolute. Old cached results won't have role or
product_summary — treat both as optional when reading (CachedResult), and make the UI-facing
types tolerate their absence. Update lib/mock.ts with roles + a summary so the keyless preview
exercises the new fields. Verify on a real 15+ ingredient product (Pringles on Ocado) that
roles stream in with the cards, in label order, and show me the output.
```
Commit: `Order F1: ingredient roles + neutral product summary`.

## 4. Order F-design — Claude Design: the progressive list + product read strip
```
Read Baloo_Order_F_Progressive_Ingredients.md (esp. §1 borrow/refuse) and the existing token
set from Baloo_Design_Handoff_D_B4.md (ink/muted/line/paper/canvas/natural/processed,
shadow-card, rounded-2xl, Fraunces display, max-w-tool 640px). Design, desktop + mobile:

1. COLLAPSED ROW — one per ingredient, streaming in one by one in label order: rank number,
   ingredient name, a caps role microlabel ("SWEETENER", "CULTURE / FERMENT"), the existing
   Natural/Processed pill, listed % when present, a chevron affordance. Decide: left accent
   bars per functional category (muted, neutral filing-label palette — never red/green
   semantics) or no accents at all. Rows must feel calm and scannable at 20+ ingredients.
2. EXPANDED STATE — tap/click unfolds the full depth we already generate: what_it_is (2–3
   sentences), "In this product:" why_its_here, percentage_note. Design the unfold (single or
   multi-open accordion, motion ≤ 250ms, prefers-reduced-motion honoured) and the collapse
   affordance.
3. PRODUCT READ STRIP — sits between the results header and the list: counts computed in code
   ("14 ingredients · 9 natural · 5 processed"), the one-sentence neutral product_summary, and
   a small reassurance line in our voice ("An explanation, not a verdict — tap any ingredient
   for the full story."). HARD CONSTRAINTS: no score, no dial, no "worth a look", no additive
   count, no red. It should feel like a calm table of contents, not a report card.
4. STATES — streaming (rows appearing progressively, summary may arrive last), cached (all at
   once), and a row whose role is missing (old cached results — row renders without microlabel).

Deliverable: frames + a handoff section in the same format as Baloo_Design_Handoff_D_B4.md
(exact spacing/type/colour mapped to existing Tailwind tokens, motion notes, empty/edge states)
so Claude Code can build F2 without guessing.
```

## 5. Order F2 — Claude Code: build the progressive list (after B4 + F-design)
```
Read Baloo_Order_F_Progressive_Ingredients.md and the F-design handoff. Rebuild the ingredient
list inside the Ingredients tab per the handoff: IngredientCard becomes a collapsed row
(name, caps role microlabel, Natural/Processed pill, %, chevron) that expands on tap/click to
the full what_it_is / why_its_here / percentage_note content we already stream. Accordion
behaviour per the handoff; aria-expanded on the trigger, full keyboard support, animations
honour prefers-reduced-motion. Add the product read strip above the list: counts computed in
code from the streamed array, plus product_summary once it arrives — no score, no flags, no
red, nothing judgmental. Rows must stream in collapsed, in label order, exactly as cards do
today; expanding a row must not disturb the stream. Old cached results without role /
product_summary render gracefully (no microlabel, no summary sentence). Verify in the browser
on the mock pipeline AND on a real 15+ ingredient product: progressive appearance, expand/
collapse during streaming, reduced-motion, mobile at 390px.
```
Commit: `Order F2: progressive ingredient list + product read strip`.

## 6. CLAUDE.md additions (add when F2 ships, not before)
- Ingredient list is progressive: collapsed rows by default, full explanation on expand.
- `role` is a neutral functional label and `product_summary` one neutral sentence — never
  judgments; counts in the read strip are computed in code.
- Still no score, no "worth a look"-style flags, no judgment colours anywhere.
