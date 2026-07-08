# Baloo — Design Handoff · G7 + G8 Engagement

**Order:** D-G7/G8 — Engagement primitives + threaded product discussion + "Explain this" AI affordance
**Mockup:** `Baloo_Engagement.dc.html` (interactive — Thread / Empty states, Desktop/Mobile toggle; upvote, save, reply, sort, and "Explain this" are all live)
**Follows:** standing rules in `Baloo_Design_Orders_Phase3.md` and the G3 product handoff. No new colours; hairlines not shadows; British spelling, sentence case, no emoji.

> **The governing tension (and how it's resolved).** Two voices share one thread and must never be confused:
> - **Community = opinion.** Card-less, hairline-separated rows with a person avatar, `@handle`, casual first-person copy, and opinion controls (upvote, reply). It reads like a letters page.
> - **Baloo AI = neutral reference.** The *one paper card* in an otherwise card-less thread, headed by the **Baloo wordmark** (no avatar, so it's never mistaken for a person), written in Baloo's signature **"What it is." / "In this product."** two-beat, and carrying a factual disclaimer. It has **no upvote, no reply, no opinion affordances** — you can't "agree" with a fact.
>
> The distinction is carried by *structure and format*, not by a new colour — fully within the brand.

> **G3 dependency note.** `Baloo_Design_Handoff_G3_Product.md` was not in the session, so the product-context header (name, retailer, natural/processed dot readout, "in N lists") is **derived** to the standing tokens to give the engagement bar something to sit under. If G3 shipped a product header, treat it as canonical and mount these primitives beneath it — the primitives themselves don't change.

---

## 0 · Why these rules

- **Upvote is agreement, not a rating.** A single upward control, never an up/down pair. There is **no downvote** — a red/green up-down duel would turn the page into a verdict machine, which fights Baloo's "education over alarm" north star. The one-line helper under the product bar says so out loud: *"Upvotes rank this in lists & search. They aren't a verdict."*
- **Never traffic-light.** Green (`natural`) and amber (`processed`) are **reserved exclusively for the ingredient classification**. Engagement controls must never borrow them, or a saved/upvoted state would read as a health judgement. All engagement affordances are therefore **neutral, ink-tinted** — grey at rest, ink when active.
- **Discussion is opinion; facts come from Baloo.** The composer placeholder and helper both frame comments as opinion ("This reads as your opinion, not a fact"), and "Explain this" is the sanctioned bridge to a fact.

---

## 1 · Token map (everything → existing token)

| Role | Token / value |
|---|---|
| Page / control-at-rest text | `muted` `#6F756E` |
| Active control text + border, names, lead-ins | `ink` `#1A1A18` |
| Comment & reply body | `ink/70` |
| Hairlines, borders, dividers, reply rail | `line` `#ECEBE5` |
| Card / composer / AI-answer surface | `paper` `#FFFFFF` |
| Page + AI-card header strip + sort track | `canvas` `#FBFBF8` |
| Active-control tint fill | `rgba(26,26,24,0.05)` — ink at 5% (the only "fill", derived from ink, not a new hue) |
| Natural / Processed dots | `natural` / `processed` — **classification readout only, never on controls** |
| Composer focus ring | 2px `natural/20` + `natural` border (the shipped focus treatment) |
| Display type (product H1, Discussion, Baloo wordmark) | Fraunces 400 (wordmark 600) |
| Functional type (bodies, controls, meta) | Inter 400/500/600 |
| Control radius | `rounded-lg` 8px (buttons/inputs) · `rounded-full` (pills, avatars, upvote) |
| Card / AI-answer radius | `rounded-xl` 12px |
| Elevation | **none** — hairline borders + paper-on-canvas only |
| Motion | `rise` 0.35s (AI card in) · `fade` 0.2s (composer/reply reveal) · spinner 0.8s (`natural` top on `line` track) |

All counts and timestamps use `tabular-nums`.

---

## 2 · Upvote control (primitive)

A single full-round pill: **thin upward chevron + count** (product bar adds the word "Upvote").
- **At rest:** `paper` fill, 1px `line` border, `muted` text/glyph.
- **Active (you upvoted):** 1px `ink` border, `ink` text/glyph, `ink/5%` tint fill, count +1. ~0.2s transition, no transform, no bounce.
- **Never** green/amber, never a downstroke twin. Sizes: 14px glyph on the product bar, 13px on comments, 12px on replies — same shape throughout.
- `aria-pressed` reflects state.

**Usage:** product level (with the word + count, larger) and per comment/reply (glyph + count). Sorting "Top" reads live upvote totals.

## 3 · Save control (primitive)

Full-round pill: **bookmark glyph + label**, same neutral/ink-tinted system as upvote.
- **At rest:** `paper`, `line` border, `muted`, outline bookmark, label "Save".
- **Saved:** `ink` border/text, `ink/5%` fill, **filled** bookmark, label "Saved".
- Product-level in this mock; the same primitive is what "save to list" (G4/G5) uses. Never colour-coded.

---

## 4 · Threaded discussion

Single 640px reading column (brand's one column), sitting under the product engagement bar.

**Header:** "Discussion · N" (Fraunces + muted count) with a right-aligned **Top / Newest** segmented control (a `canvas` track, active segment = `paper` pill + `ink` text). A one-line subhead frames the section as opinion and points to "Explain this" for facts.

**Composer:** account avatar + a `paper` textarea ("Share what you think about this product…"). On focus it grows a row and gains the green focus ring; the **Post** button (shipped `Button`, primary) and the opinion-reminder microcopy fade in. Empty-blur collapses it back — quiet by default.

**Comment (community / opinion):** card-less row — 34px avatar (canvas, Fraunces initial), `@handle` (ink 600) + timestamp, body in Inter 15px/1.6 `ink/70`, separated from the next by a 1px `line`. Footer controls: **[upvote]  Reply  ✦ Explain this**.

**Replies — one level only.** Replies render indented behind a single 1px `line` **left rail**, with smaller avatars (28px) and type (14px). Replies have an upvote but **no reply-to-reply and no nested "Explain this"** — depth is capped at one to keep the column readable (a paper, not a forum). The inline reply composer opens under the comment on "Reply" and closes on Cancel/Post.

**Sort:** *Top* orders by live upvote count (desc); *Newest* by recency. Switching re-orders in place with a fade.

---

## 5 · "Explain this" — the AI affordance

The feature the order centres on: summon Baloo's AI to explain a claim **inside the thread**, so a factual answer lands exactly where the question was asked.

**Trigger:** a quiet `muted` text button with a small thin-stroke **spark** glyph (Lucide-weight, the brand's rare-icon exception) in each comment's footer. It is deliberately understated — it's a utility, not a call to action.

**Loading:** a slim `paper` strip with the shipped spinner + *"Baloo is reading the label…"* (ellipsis = work in progress, per voice rules). ~0.75s in the mock.

**Answer — the one card in the thread, visually distinct + neutral:**
- A `paper` card, 12px radius, 1px `line` — the only card among card-less comments, so it reads as elevated *reference*, not chatter.
- **Header strip** (`canvas` fill, hairline base): a `natural` spark + the **Baloo wordmark** (Fraunces 600) + an uppercase `muted` "Explanation" label. **No avatar** — this is the single strongest signal that the speaker is not a person.
- **Body** in Baloo's signature two-beat: **"What it is."** (the ingredient in general) then **"In this product."** (why it's here / where it sits on the label) — the exact structure ingredient cards use, so the AI voice is literally the product's own explanatory voice.
- **Footer disclaimer** (muted, above a hairline): *"Generated by Baloo from the product label. A factual explanation, not a health claim or an opinion."* — neutral, non-alarmist, and explicitly *not opinion*.
- **No engagement controls.** You can't upvote or reply to it — facts aren't voted on. Re-tapping "Explain this" collapses it.

**Placement rule:** the answer attaches to the comment that summoned it (as a de-facto system response), not to the top of the thread — the question and its answer stay together.

**Empty-state variant:** when there are no comments, the empty card offers **"Explain the ingredients"** — the same affordance at product scope, so the AI is reachable before any discussion exists.

---

## 6 · States

- **Populated thread** (default) — comments + replies, any number of AI answers open at once.
- **Empty** — a calm `paper` card: "No comments yet." + invitation to be first, plus the product-scope "Explain the ingredients" button. No blame, no illustration.
- **AI loading / AI answer** — per §5, toggle live in the mock.
- **Composer idle vs active** — collapses when empty; grows + shows Post + reminder on focus.
- **Signed-out** (build note): upvote/save/compose/Explain all route to sign-in (G2); controls render but a tap opens the auth sheet. Not mocked here.
- **Error** (build note): reuse the shipped friendly-error pattern — "Baloo couldn't generate an explanation right now. Try again." in the same card frame. No stack traces.

---

## 7 · Motion

- AI answer enters with the signature **`rise`** (opacity + 6px up, 0.35s) — it "settles" like an ingredient card.
- Composer expansion, reply composer, and the opinion reminder use a 0.2s **fade**.
- Spinner: 16px, 2px `line` track, `natural` top, 0.8s.
- Upvote/save/sort transitions are ~0.2s colour/border only — **no scale, no bounce** (Baloo doesn't press-animate).
- Global `prefers-reduced-motion` collapses all durations. Honour it.

---

## 8 · Mobile (390px)

Authored responsive; the dock's **Mobile** toggle shows the exact frame. One column already fits; controls wrap; the reply rail and AI card keep their shape. Long product names and handles truncate (`min-width:0`). All tap targets — upvote, save, Reply, Explain this, sort, Post — are ≥ 44px.

---

## 9 · Component reuse ledger

| Element | Source |
|---|---|
| Post / Reply buttons | shipped `Button` (primary) |
| Composer & reply inputs, focus ring | shipped input treatment (`line` → `natural` + `natural/20` ring) |
| Baloo wordmark on the AI card | shipped `Wordmark` (Fraunces 600) |
| Natural/Processed dot readout (product header) | shipped ReadStrip dot motif — classification only |
| "What it is / In this product" structure | shipped IngredientCard explanation format |
| Spinner (AI loading) | shipped `Spinner` |
| Friendly error frame | shipped error pattern |
| Upvote / Save pills, Top-Newest, Explain-this | **new engagement primitives**, built from tokens only — no new colours |

---

## 10 · Open questions for the build

1. **Explain-this scope** — per whole comment (as mocked), or should a user be able to select a phrase/ingredient inside a comment and explain just that? The card format supports either.
2. **AI answer persistence** — is a generated explanation cached and shown to everyone who later views that comment (shared, cited once), or regenerated per viewer? Affects whether it needs its own timestamp/attribution.
3. **Reply depth** — confirm one level is the hard cap (recommended). If deeper is ever wanted, it needs a different indentation model.
4. **Sort default** — "Top" assumed. Confirm; and define the tie-break (recency).
5. **Moderation / report** — a per-comment overflow (report, hide) is out of scope here; flag for a later order.
6. **Upvote → ranking weight** — how heavily do product/comment upvotes feed list & search ranking (ties to the G5/G6 open ranking question)?
