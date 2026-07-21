# Baloo — Launch Plan (beta)

**Context.** Jitain wants a **beta launched soon**, rough edges acceptable. This is the re-prioritised
"next days" track, synthesising his ASAP asks + the 16 July meeting + the community-strategy
discussion. It runs alongside the P-series data plan (`Baloo_Phase3_ProductOffer_Reconciliation.md`);
where they overlap, **this ordering wins for launch**. Working board: the `Baloo_Project_Hub` Notion page.

## Decisions locked this session (Jitain + strategy discussion)
- **Design direction: V3** (warm boutique — cream + Playfair Display). Resolves the V1/V2/V3 blocker.
  The port starts with Mobbin references + the app shell.
- **Save, not Like.** A list carries ONE social signal: **Save**. "Saved by N people" is the
  popularity + trust metric (a save = "I'll keep this", stronger than a casual heart). Products are
  **saved as favourites** too. No upvote/like. → this contradicts shipped code (see Open decisions).
- **Real numbers only.** Solve cold-start by seeding **supply** (great lists + official accounts),
  never by faking demand — 3 saves shows "3".
- **Search is the homepage.** One box, two intents: a URL → ingredient analysis; natural language
  ("kids cereals without junk") → **AI semantic search over PUBLIC lists**. People arrive with a
  *need*, not a person in mind — search solves cold-start better than browsing strangers. This is
  the #1 community feature.
- **Public profile = distribution.** `baloo.life/@username` is a shareable landing page (flyers,
  IG/TikTok bio, WhatsApp, Reddit). Every curator is an acquisition channel.
- **Usernames:** one unique handle, changeable (**90-day cooldown**); old handles **permanently
  redirect and are never reused**; reserve the new handle on change. (GitHub/X model, not aliases.)
- **Visibility (MVP = list-level only):** lists are public/private; a **profile is public
  automatically when it has ≥1 public list**, otherwise fully private/undiscoverable. No separate
  account-discoverability toggle in v1 — "publish a list → you join the community."
- **Positioning:** *"Helping each other eat better"* / *"Discover better food choices, together."* —
  "better" is deliberately subjective (fewer additives / more protein / cheaper / kids will eat it).

## The launch track (ordered)

### Tier A — beta-blocking (a credible beta needs these)
- **L1 — V3 design port.** Adopt V3 across the app, screen-by-screen per PART C (three approaches →
  Rams/Ive/Linear/Duolingo critique → build), starting with the app shell + homepage. Design the
  **dual-intent search box** now (URL + "ask anything…"), even if L3's semantic backend lands after.
- **L4 — Seed supply.** Official accounts (**@baloo, @balooteam, @proteinpicks, @kidslunchbox**) + a
  set of genuinely good curated lists (Best protein yogurts · Cereals I'd buy again · Ice creams
  under 5 ingredients · Best snacks for kids · Mercadona essentials). An empty community is a dead one.
- **L5c — Visibility auto-public.** Profile public only when ≥1 public list; else private/undiscoverable.
  A privacy must before real users touch it.
- **L2 — Social sharing (= P8, pulled forward).** IG card via `navigator.share({files})` + WhatsApp
  / Telegram / Facebook intent URLs + the sharing-card template (the OG image at `/api/og/list/[slug]`
  already exists). Jitain's #1 ASAP; the growth loop.

### Tier A — security (added 17 July, from Jitain's questions + a code audit)
**Auth is settled: we already use a third-party provider — Supabase Auth** (GoTrue), the same
category as Clerk. We never store or see passwords. Jitain's instinct that Clerk is B2B-shaped is
right, but the answer isn't another third party: our `profiles.id` is a FK to `auth.users.id` and
every RLS policy uses `auth.uid()`, which only works while auth lives in our own Postgres. Clerk/Auth0
would split them → sync webhooks + broken RLS + more cost, for no user-visible gain. **Harden, don't
migrate.** (Add Apple sign-in later — a checkbox.)

Three holes the audit found in shipped code:
- **Anonymous sign-in = free bot users.** `signInAnonymously()` is on and no write route checks
  `is_anonymous`: one HTTP call per user, no email, no captcha → unlimited users and lists.
- **`/api/analyze` + `/api/extract` are unauthenticated and unlimited**, and each call costs
  Firecrawl + Claude money. A for-loop is a financial DoS.
- **No custom SMTP.** Supabase's built-in mailer is dev-only and rate-limited — confirmation emails
  would silently stop arriving at launch.

- **S1 — rate-limit the expensive routes** ✅ shipped `9eaf514` (fail-open; inert until the Upstash
  REST vars are set on Vercel — the one remaining ops step for S1).
- **S2 — guest-publish wall** ✅ shipped (code): `requireVerifiedUser()` on every community write;
  guests analyse-only; `useAuthGate()` on the client. **Captcha deferred** (Turnstile — needs your
  Cloudflare + Supabase setup). Note: anonymous sign-in is currently disabled on the Supabase project.
- **S3 — custom SMTP** (Resend) + SPF/DKIM/DMARC. *Signup breaks at launch without it.*
- **S4** write rate limits/caps · **S5** ✅ security headers shipped (enforcing safe set + report-only
  CSP); remaining: M flips leaked-password + Vercel WAF toggles, later flip CSP to enforcing · **S6**
  error monitoring (Sentry) · **S7** unsubscribe **and** account deletion (GDPR; no delete flow
  exists) · **S8** privacy policy + terms (**J**).

### Tier B — high-value fast-follow (can ship days after beta)
- **N1/N2 — Notifications.** In-app first (a bell over the existing `activity` table from G6), then
  **digest-batched** email once S3 lands — per-event email trains people to mute us, and a calm brand
  shouldn't blast. Default digest-only; prefs + one-click unsubscribe (S7).
- **L3 — AI semantic search over public lists.** The search-as-homepage bet; the single biggest
  community lever. Approach decided at plan time (pgvector embeddings on Supabase vs LLM-rerank over
  pg_trgm candidates). Semantic, not keyword — "cereals my 5-year-old can eat" must match
  "low-sugar kids cereals".
- **L6 — Save-only reconciliation + scanned-product organisation.** Remove the list Upvote
  (Popular = saves); "save product as favourite"; "add to multiple lists"; from another user's list,
  save/add an individual product to your own (keep-for-later).
- **L5a/b — Identity for distribution.** `baloo.life/@username` URL (profile at `/@handle`, redirect
  the current `/u/[handle]`); username change + permanent redirect.
- **L7 — Region prioritisation** ✅ **shipped.** Discover's "Recently added" grid soft-ranks by "% of a
  list's products purchasable in the viewer's region" (never a hard filter). Retailer→region map in
  `lib/config.ts`/`retailers.ts`, math in `lib/region.ts`, `getListsRetailers`/`withRegionAvailability`,
  an SSR "Shopping in US/UK" toggle (default Vercel geo), a neutral `ListCard` availability line. No
  migration — derived from `products`/`offers.retailer`. (Region reordering surfaces once lists hold
  retailer'd products; real scans set the retailer.) — **CC**

### Tier C — after beta
P3 two-mode add + unresolved items · P4 "also available at" · P6 OFF enrichment · more scrape sites
(gradually) · M1 native IG Stories · discovery feed de-emphasis.

## V3 design review (21 July) — resolve before the port
V3 is past wireframe (real cream + Playfair look) and lands most of Jitain's notes: ingredient view is
back to the count + numbered rows + tap-to-expand two-box, empty-state leads with **Add product**,
new-list dialog is centred, own-list header is cleaned up (no handle/Save, 0-upvotes hidden), covers
are flat tints, and Discover has the region switch. **Resolve these three before porting — porting
around them means porting twice:**
- **DEC-1 · Upvote → Save-only.** The design still shows Upvote (card counts + a list-detail button);
  the locked decision is Save-only. Confirm removing Upvote everywhere (design **and** code = L6).
  *Rec: yes.* — **J**
- **DEC-2 · Auth flow.** V3's modal shows magic-link ("no password needed") and drops Google + guest;
  we shipped **email+password + Google + guest**, and magic-link would need S3 SMTP. *Rec: keep the
  built methods for launch; correct the design's auth modal to match.* — **J**
- **FIX-1 · Share cards still use gradients** (contradicts the global no-gradient rule) → apply the V3
  flat-tint palette. Straight back to Claude Design. — **CD**
- Open threads (non-blocking): list-image direction (upload / auto-generate / shrink — Jitain leans
  shrink); the board's real-imagery treatment; the 2nd "create a list with THIS product" CTA.

## Open decisions still owed (recorded for Jitain)
- **Upvote vs Save.** Shipped code (G7) has BOTH an Upvote and a Save. "Save-only" implies
  **removing the Upvote entirely** and ranking Popular by saves. *Recommend: yes — Save-only
  everywhere, products are "favourited" (= saved).* Confirm before L6.
- **Comments / feed / moderation at launch?** Built (G8/G6/G9) but beyond the stated community
  priority ranking. *Recommend: keep comments + moderation ON (safety net); keep the feed but
  de-emphasise it — search is the front door.* Confirm.
- **Semantic-search infra:** pgvector vs LLM-rerank — decide at L3 plan time.
- **URL cutover to `/@username`:** do it in L5, or defer with P7's nav reconciliation.

## Checkpoints from the 16 July meeting (answered / to define in L1)
- **Homepage vs user page:** homepage = the dual-intent search + discovery; user page =
  `baloo.life/@handle`, a curator's profile/landing. Nail the distinction in L1's design.
- **Where search sits:** it IS the homepage (see decisions).
- Flyer strategy note: the profile URL doesn't change legal responsibility for posting flyers —
  use permitted spots (noticeboards, cafés, campuses). (Product-strategy takeaway kept; legal detail
  is Jitain's to own.)
