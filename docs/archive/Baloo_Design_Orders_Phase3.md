# Baloo — Phase 3 Design Orders (for Claude Design)

**How to use this file (Miquel):** attach THIS file to a Claude Design session and paste ONE
prompt from below per session. Each prompt tells Claude Design what to read, what to produce, and
the deliverable format. Run them in the listed order — each design leads its build order by one
step. The repo (github.com/pitelet222/Baloo-landing-page) holds the references named below.

**Standing rules for every order (Claude Design must follow):**
- Deliverable = an interactive HTML mockup + a handoff markdown in the exact format of
  `Baloo_Design_Handoff_D_B4.md` / `Baloo_Design_Handoff_F2.md`: every measurement mapped to the
  existing Tailwind tokens (`ink, muted, line, paper, canvas, natural, processed, shadow-card,
  shadow-hero, rounded-2xl, max-w-tool 640px, Fraunces via font-display, animate-rise/fade-in`),
  all states (empty/loading/error/edge), motion notes honouring `prefers-reduced-motion`, and
  mobile (390px) frames.
- **No new colours. No score, no dial, no red/green judgment. The Natural/Processed pill stays
  the only meaningful colour.** Calm, editorial, "education before persuasion."
- Reuse the shipped components as-is where they appear: the F2 progressive ingredient list, the
  B4 nutrition table + profile selector, the D board patterns.

---

## D-G4 — The list page, list card, and list editor (RUN FIRST — the hero surface)

```
Read Baloo_Design_Orders_Phase3.md (standing rules), Baloo_Phase3_Full_Build_Guide.md Part V,
and the token references Baloo_Design_Handoff_D_B4.md + Baloo_Design_Handoff_F2.md. Design
Phase 3's hero surface — LISTS, the primary object of the community platform ("Letterboxd for
supermarket products"). Three artefacts, desktop + mobile:

1. PUBLIC LIST PAGE (/list/[slug]) — the shareable growth surface. Cover treatment, title,
   description, curator (avatar + handle + follow affordance placeholder), item rows (product
   name, brand, the Natural/Processed pill, the curator's note, position number), save/share
   actions, and a calm footer ("Every product explained — tap any item"). Design the Open Graph
   card too (1200×630) — how a shared link looks on WhatsApp/X.
2. LIST CARD — the compact representation used in profiles, feeds and discovery grids: cover,
   title, curator, item count, save count.
3. LIST EDITOR — create/edit flow: title, description, public toggle, cover; adding products
   (from a product page and via search), drag-reorder with a per-item note field.

States: empty list (just created), 1-item, 30-item (scannability), private vs public. No votes/
comments yet (later orders reserve slots). Deliver the handoff as
Baloo_Design_Handoff_G4_Lists.md in the standing format.
```

## D-G3 — The canonical product page (RUN SECOND)

```
Read Baloo_Design_Orders_Phase3.md (standing rules), Baloo_Phase3_Full_Build_Guide.md Part V, and
the shipped-component references Baloo_Design_Handoff_F2.md (progressive ingredient list) +
Baloo_Design_Handoff_D_B4.md (nutrition tab). Design the CANONICAL PRODUCT PAGE (/p/[slug]) —
today's inline analysis becomes a permanent, linkable page. Compose, desktop + mobile:

- Header: product name, brand, image slot, source attribution line, "in N lists" hint.
- Body: the EXISTING F2 progressive ingredient list and B4 Ingredients/Nutrition tabs reused
  verbatim — design the assembly, not new internals.
- "Add to list" — the key action (button + the picker that appears: choose existing list or
  create inline).
- Reserved slots (visually designed, marked future): vote control, comment thread entry point.
- States: freshly ingested (AI text present), seeded-from-catalog (no AI yet — calm "explanation
  coming" treatment, no spinner theatre), reformulated (version note).

Deliver as Baloo_Design_Handoff_G3_Product.md in the standing format.
```

## D-G2 — Auth + account (run before/with the G2 build; SMALL)

```
Read Baloo_Design_Orders_Phase3.md (standing rules) + token references. Design the minimal auth
surfaces: sign-in/sign-up (email + Google) as a calm modal, the handle-setup step (one field,
availability hint), the signed-in account menu, and the "continue without an account" path with
its gentle upgrade nudge ("save your lists — create an account"). Warm, low-friction, zero dark
patterns. Deliver as Baloo_Design_Handoff_G2_Auth.md in the standing format.
```

## D-G5 — Browse / search / category landings (before the G5 build)

```
Read Baloo_Design_Orders_Phase3.md (standing rules) + Baloo_Design_Handoff_G4_Lists.md (reuse the
list card). Design discovery: the browse page (recent + popular lists, featured categories), the
search experience (mixed product + list results), a category landing ("Cereals" — top lists, top
products), and the public profile page (/u/[handle]: identity + their public lists). Deliver as
Baloo_Design_Handoff_G5_Discovery.md.
```

## D-G6 — Home feed (before the G6 build)

```
Read Baloo_Design_Orders_Phase3.md (standing rules) + Baloo_Design_Handoff_G4_Lists.md. Design
the signed-in home feed from follow activity (created a list / added items / voted), reusing the
list card; quiet grouping, load-more pagination, an empty state that teaches following. Calm — a
morning paper, not a slot machine. Deliver as Baloo_Design_Handoff_G6_Feed.md.
```

## D-G7/G8 — Vote, save, and discussion components (before the G7/G8 builds)

```
Read Baloo_Design_Orders_Phase3.md (standing rules) + Baloo_Design_Handoff_G3_Product.md. Design
the engagement primitives: upvote control (neutral, ink-tinted, never traffic-light), save
control, and the threaded product discussion (comment composer, one-level replies, top/newest
sort) INCLUDING the "explain this" affordance that summons Baloo's AI inside a thread. Community
voice must read as opinion; Baloo's AI voice stays visually distinct and neutral. Deliver as
Baloo_Design_Handoff_G78_Engagement.md.
```
