# Baloo — Design Handoff · G6 Feed

**Order:** D-G6 — Signed-in home feed from follow activity
**Mockup:** `Baloo_Feed.dc.html` (interactive; Feed / Empty / Loading states + Desktop/Mobile toggle in the floating review dock)
**Reused component:** `ListCard.dc.html` (the G4 / G5 list card)
**Follows:** standing rules in `Baloo_Design_Orders_Phase3.md` and the G4 lists handoff. No new colours; the Natural/Processed dot stays the only meaningful colour. The brief in one line: **a morning paper, not a slot machine** — calm, chronological, skimmable; zero engagement-bait.

---

## 0 · Design intent

The feed is the signed-in home (`/` when authenticated). It answers one question — *"what have the people I follow done lately?"* — and then gets out of the way. Concretely that means:

- **Chronological, not ranked.** Newest first, grouped by day. No "top", no algorithm, no re-ordering by heat. What happened, in the order it happened.
- **Quiet grouping.** Small uppercase date rubrics ("Today", "Yesterday", "Earlier this week") — like a paper's section heads — instead of loud cards or unread badges.
- **One reading column** (max 640px), left-aligned, generous line-height. You read it top to bottom.
- **No dopamine mechanics.** No counters ticking, no "🔥 trending", no red dots, no infinite scroll. Pagination is a deliberate button.
- **Activity is factual.** "created a list", "added 3 products to", "upvoted" — verbs, not exclamations.

---

## 1 · Token map (everything → existing token)

| Role | Token / value |
|---|---|
| Page background | `canvas` `#FBFBF8` |
| Card / panel surface | `paper` `#FFFFFF` |
| Primary text, actor names, list titles | `ink` `#1A1A18` |
| Byline / meta / verbs / date rubrics | `muted` `#6F756E` |
| Body-in-card | `ink/70` |
| Hairlines, dividers, borders | `line` `#ECEBE5` |
| Hover border (load-more, cards) | `#dedcd2` |
| Natural dot | `natural` `#2E7D52` |
| Processed dot | `processed` `#B5701F` |
| Display type (masthead, actor list names, empty H2) | Fraunces via `font-display`, weight 400 |
| Functional type (byline, meta, buttons) | Inter via `font-sans`, 400 / 500 / 600 |
| Reading column | `max-w-tool` **640px** |
| List card radius | `rounded-2xl` 16px |
| Inline activity panel radius (added-items, suggested-curators) | 12–16px |
| Avatar / control radius | `rounded-full` |
| Card elevation | `shadow-card` |
| Entrance motion | `animate-fade-in` (state) · `animate-rise` (each article) |
| Spinner | 2px `line` track, `natural` top, 0.8s |

**Type scale:** masthead H1 30px · empty-state H2 24px · date rubric 11px uppercase `.13em` · actor name / verb line 14px · list-card title 19px (inherited) · added-item name 15px · meta / timestamps 12–13px. All counts & timestamps use `tabular-nums`.

---

## 2 · Shared chrome

**Header (signed-in variant):** wordmark → left; full-round `canvas` search field → centre; **account chip** (32px round avatar initial + caret) → right, replacing G5's "Sign in" (this is the `AccountMenu` from G2, now populated). Wraps at 390px the same way as G5.

**Masthead:** H1 **"Following"** (Fraunces 30) + one muted subhead ("The lists and picks from the people you follow.") + today's date right-aligned, over a `border-b line`. This is the paper's nameplate — it orients without shouting.

**Footer:** unchanged from G5 (sign-off + About / How it works / Privacy), constrained to the 640px column.

---

## 3 · The feed (populated)

A single column of **date groups**. Each group = a small uppercase rubric + its activity articles. Each **article** is a hairline-separated row (`border-b line`, no card, no shadow — the paper feel) with three parts:

### 3a · Byline (always)
`[26px avatar] @handle {verb} {target} · · · {relative time}`
- Avatar = `canvas` circle, Fraunces initial (no photos — on-brand).
- Handle is `ink` weight-500 link → profile (`/u/[handle]`, G5).
- Verb is muted running text. Target (list title in quotes, or product) is an `ink` weight-500 link where one exists.
- Timestamp is muted, `tabular-nums`, right-aligned ("2h", "1d", "3d").

### 3b · Body (varies by activity type)
Three activity types, each with a distinct but calm body:

1. **Created a list** → the full **`ListCard`** (reused verbatim), indented under the byline (36px, aligned to the handle). This is the richest event and earns the card.
2. **Added items to a list** → a compact **inline panel** (`rounded-xl paper`, `line`-divided rows): each added product as a 36px thumbnail + name (Fraunces 15) + "brand · retailer" + the factual `N natural · N processed` dot readout, capped, with a "View the list →" footer link. Not a card — a receipt of what changed.
3. **Voted** → usually **byline only** (an upvote is a light event; a caret-in-a-ring glyph sits inline in the sentence). When several products were upvoted at once, an optional muted **names line** lists them, comma-separated. Never a card — votes must stay quiet or the feed becomes a scoreboard.

**Why the hierarchy:** the amount of surface an event gets is proportional to how much new *reading material* it introduces — a new list (a lot) > items added (some) > a vote (a signal). That keeps the feed informative without every row screaming for equal attention.

### 3c · Motion
Each article fades+rises in once (`animate-rise`, 0.35s) as the group renders; nothing re-animates on scroll. State switches fade (`animate-fade-in`). Load-more and card hovers use the shipped 0.2s border/shadow transitions. All collapse under `prefers-reduced-motion`.

---

## 4 · Pagination — load-more, never infinite

At the end of the loaded range, a single centred **"Load earlier activity"** button (`paper`, `line` border, hover → `canvas` + `#dedcd2`). Clicking appends the next batch of date groups in place. When nothing older remains, the button is replaced by a quiet, centred line: **"You're all caught up."**

Deliberate, finite, and honest — the opposite of a bottomless scroll. It also means the page has a bottom (footer is reachable), reinforcing "paper you finish", not "feed you fall into".

**Batch behaviour:** load ~15–20 activity items per batch; preserve scroll position (append below, never jump). No auto-load on scroll. No spinner on the button itself unless the fetch exceeds ~400ms, in which case swap the label for the inline spinner.

---

## 5 · Empty state — teaches following

Shown when the user follows no one (or follows people with no recent activity). Goal: explain the mechanic *and* remove the friction in the same breath.

- **H2** (Fraunces 24): "Your feed is quiet."
- **Body** (muted, ≤520px): "Follow a few curators and their lists, picks and updates collect here — **like a morning paper you skim with coffee**. Start with these:" — the metaphor is stated to set the expectation.
- **Suggested curators panel** (`rounded-2xl paper shadow-card`, `line`-divided rows): each = 42px avatar + name (Fraunces 16) + "@handle · N lists · N followers" + a **ghost Follow button** (shipped `Button`). Following one row is the single action that turns the empty state into a populated feed, so it lives right here.
- **Secondary exit:** "Or browse all lists →" link into G5 discovery, for users who'd rather explore than commit to follows.

**Two empty flavours to build:**
- *No follows yet* (above) — suggestions are editorially seeded / popular curators.
- *Follows exist but no recent activity* — same layout, copy shifts to "Nothing new from the people you follow. Here's who's been active lately:" and suggestions bias to under-followed active curators.

---

## 6 · Loading state

Fades in immediately so the masthead never sits alone:
- One "Today" rubric + **3 skeleton articles** — a `line` avatar circle, a `line` byline bar, and a `paper`/`line` body block (≈120px, standing in for a list card).
- A centred **inline spinner** (16px, 2px `line` track, `natural` top) + "Reading your feed…".
- **No shimmer sweep** — off-brand. Skeletons are static; only the small spinner moves.

Skeletons are replaced by real articles (`animate-rise`) as data resolves.

**Error state** (fetch failed, not mocked): reuse the shipped friendly-error card — "We couldn't load your feed right now." + "Refresh to try again." No stack traces, no blame.

---

## 7 · Mobile (390px)

Authored responsive; the dock's **Mobile** toggle renders the exact 390px frame. Reflow is automatic, no media queries:
- Header wraps (wordmark + account chip line 1, search line 2).
- Reading column is already ≤ frame width; articles, list cards and inline panels fill it.
- Byline: handle + verb wrap naturally; timestamp stays top-right of the row.
- Added-item rows keep shape; long product names truncate (`min-width:0`).
- Load-more button spans comfortably; touch targets (Follow, load-more, links, account chip) all ≥ 44px.

---

## 8 · Component reuse ledger

| Feed element | Source |
|---|---|
| Wordmark, search field | shipped `Wordmark` + input treatment (as G5) |
| Account chip | `AccountMenu` (G2) populated |
| List card (create events) | `ListCard.dc.html` (G4 / G5) — reused verbatim |
| Added-items panel rows | structure from the shipped ingredient list (thumbnail + name + dot readout) |
| Natural/Processed dots | shipped ReadStrip dot motif (factual counts) |
| Follow button (empty state) | shipped `Button` (ghost) |
| Friendly error card | shipped error pattern |
| Colours / type / spacing / motion | tokens verbatim — nothing new |

---

## 9 · Open questions for the build

1. **Activity aggregation** — should N adds to the same list within a short window collapse into one "added N products" article (as mocked), and over what window? Same question for burst upvotes.
2. **Vote visibility** — confirm upvotes belong in the feed at all, or only creates + adds. Design keeps votes deliberately minimal so they can be dropped with no layout change.
3. **Suggested-curator source** — editorial list, popularity, or category affinity? Empty state is source-agnostic.
4. **Feed window** — how far back does "Load earlier activity" go before "all caught up" (30 days? 90?).
5. **Real-time** — is the feed static-on-load (refresh to update, paper-like — recommended) or does it live-append? Recommendation: static, with a subtle "N new — refresh" pill only if strongly desired later.
6. **Muting / unfollow from feed** — do we want a per-article overflow (mute this person, hide this type)? Out of scope here; flag for G7+.
