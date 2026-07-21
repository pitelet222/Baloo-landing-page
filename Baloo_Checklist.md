# Baloo — Master Checklist

> Living list of what's **pending** across every phase. Markdown checkboxes paste straight into
> Notion as to-do blocks. Update as orders land; the detailed reasoning lives in
> `Baloo_Phase3_ProductOffer_Reconciliation.md` (the plan) and `Baloo_Phase3_Build_Orders.md` (the spec).
>
> **Owners:** **M** = Miquel · **J** = Jitain · **CC** = Claude Code · **CD** = Claude Design
> **Last updated:** after `58ad98a` (org pass) — **launch pivot: see `Baloo_Launch_Plan.md`**

## 🚀 Launch track (beta) — the new top priority
> Jitain wants a beta out **soon**. Full ordering + locked decisions in `Baloo_Launch_Plan.md`.
> ✅ **Design direction chosen: V3** (warm boutique) — the old blocker is resolved.

**Tier A — beta-blocking:**
- [~] **L1 — V3 design port** *(in progress)* — **CC/CD/M**
  - [x] **L1a — the V3 world** ✅ shipped: cream + Playfair tokens (tailwind + layout), flat cover
        tints, warm shadows, OG route, design canon (DESIGN.md + design.json). muted darkened to AA
        (`#766753`, 4.71:1). Whole app recoloured at once; verified live. — **CC**
  - [ ] **L1b — homepage**: hero copy/layout, dual-intent search box (URL vs question chip), full-width
        sticky shell + pill nav, "Popular lists" strip — **CC** *(Mobbin: Julienne/Contra)*
  - [ ] **L1c — analysis view**: striking count + numbered rows (drawer variant rides with P5) — **CC** *(Mobbin: Julienne)*
  - [ ] Per-screen passes: lists, discover, profile, modals — **CC**
- [ ] **L4 — Seed supply**: official accounts (@baloo/@balooteam/@proteinpicks/@kidslunchbox) + genuinely good starter lists — **M/CC**
- [x] **L5c — Visibility auto-public** ✅ shipped: `/u/[handle]` 404s for non-owners of a 0-public-list
      profile + generic metadata; owner sees own + a "publish to go public" nudge (Share hidden).
      Discovery surfaces already compliant. Verified (non-owner 404 / owner nudge / public unaffected). — **CC**
- [ ] **L2 — Social sharing** (= P8, pulled forward): IG card via `navigator.share` + WhatsApp/Telegram/FB intents + sharing-card template — **CC**

**Tier A — security (17 July audit; a beta with real users needs these):**
> Auth verdict: **we already use a third-party provider — Supabase Auth.** Not rolling our own; no
> migration to Clerk/Auth0 (it would split auth from our Postgres and break `auth.uid()` RLS). The
> work is hardening, not migrating. Full reasoning in the Notion hub.
- [x] **S1 — Rate-limit the expensive routes** ✅ shipped `9eaf514` (`lib/ratelimit.ts`; extract/
      analyze/nutrition-context by IP, explain/products-analyze by user; friendly 429). ⚠️ **INERT
      until the Upstash REST vars are set** — empty locally, unset on Vercel (see Ops). — **CC done / M owes env**
- [x] **S2 (code) — Guest-publish wall** ✅ shipped: `requireVerifiedUser()` on every community write
      (lists/comments/follows/votes/saves/reports/products-analyze); guests analyse-only; client
      `useAuthGate()` prompts sign-in/upgrade. Verified: 401 signed-out (7 routes) + real account
      passes. *(Note: anonymous sign-in is currently DISABLED on the Supabase project, so the guest
      vector isn't live there today — the code guards it regardless.)*
- [ ] **S2 (captcha) — DEFERRED**: Cloudflare Turnstile on signup + anonymous (Supabase-native).
      Needs a Cloudflare account + the secret in the Supabase dashboard + `NEXT_PUBLIC_TURNSTILE_SITE_KEY`;
      then wire the widget into the auth modal. — **M sets up infra / CC wires**
- [ ] **S3 — Custom SMTP** (Resend; Loops stays marketing) + SPF/DKIM/DMARC on baloo.life.
      Supabase's built-in mailer is dev-only + rate-limited → **confirmation emails silently stop
      arriving at launch**. — **M/CC**
- [ ] **S4 — Write rate limits + volume caps** (lists/day, items/list, comments/min, follows/min) — **CC**
- [x] **S5 (headers) — Security headers** ✅ shipped (`next.config.mjs`): HSTS · X-Frame-Options DENY
      · nosniff · Referrer-Policy · Permissions-Policy (enforcing) + **report-only CSP** (Supabase
      origin in `connect-src`). Verified: present + zero CSP violations + sign-in works. — **CC done**
  - [ ] **M toggles:** enable **leaked-password protection** (Supabase → Auth → Passwords; clears the
        advisor WARN) + **Vercel WAF / Attack Challenge Mode** (Vercel → Firewall) — **M**
  - [ ] *(later)* flip CSP to **enforcing** once report-only is clean in prod (pairs with S6's report
        endpoint) — **CC**
  - [ ] *(dropped from S5)* "zod on every body" — free-text routes already cap server-side; fold any
        standardization into S4 — **CC**
- [ ] **S6 — Error monitoring** (Sentry) — "stable from the get-go" = knowing prod broke first — **CC**
- [ ] **S7 — "Dar de baja"**: email unsubscribe (GDPR + Gmail/Yahoo one-click header) **and**
      account deletion (right to erasure — **we have no delete flow at all**; EU launch) — **CC**
- [ ] **S8 — Privacy policy + terms** on baloo.life *(no cookie banner needed while analytics-free)* — **J**

**Tier B — fast-follow (days after beta):**
- [ ] **N1 — In-app notifications** — a bell + unread count over the existing `activity` table (G6) — **CC**
- [ ] **N2 — Email notifications** *(needs S3)* — same events, **digest-batched**, prefs + opt-out;
      default digest-only, never per-event blasting — **CC**
- [ ] **L3 — AI semantic search over public lists** (search-as-homepage; pgvector vs LLM-rerank TBD) — **CC**
- [x] **L6 (upvote removal) — Save-only** ✅ shipped: votes API = comments only (product/list → 400),
      UpvotePill mounts gone from list + product pages, Popular = saves alone, feed drops "upvoted"
      stories. Comment upvotes kept (Top sort). Non-destructive, no migration. Verified E2E. — **CC**
- [ ] **L6 (remainder) — scanned-product organisation**: save product as favourite ·
      add-to-multiple-lists · keep-for-later. Needs schema (saves are list-scoped today); rides with
      P3 / the V3 port. — **CC**
- [ ] **L5a/b — Identity**: `baloo.life/@username` URL + username change with permanent redirect — **CC**
- [x] **L7 — Region prioritisation** ✅ shipped: retailer→region map (`lib/config.ts`/`retailers.ts`),
      availability math (`lib/region.ts`), `getListsRetailers` + `withRegionAvailability`, the "Shopping
      in US/UK" toggle (SSR, default geo), and a neutral `ListCard` availability line. No migration;
      soft-rank only. Verified (math + live query). *Note: current seed lists hold two retailer-less
      products, so region reordering shows only once lists contain retailer'd products (real scans do).* — **CC**

**V3 design review — ✅ resolved 21 Jul; the port (L1) is unblocked** *(detail in `Baloo_Launch_Plan.md`)*:
- [x] **DEC-1** Upvote → Save-only — reflected in the updated V3 (upvote gone, `saves` used). Code side = L6.
- [x] **DEC-2** Auth flow — updated V3 modal now shows email+password + Google + guest, matching shipped code.
- [x] **FIX-1** Share cards — gradients removed, flat V3 tints applied. — **CD done**
- [ ] Still open (non-blocking): list-image direction (upload/auto-gen/shrink) · board real imagery · 2nd "create list with THIS product" CTA

**Decisions still owed from Jitain** (in `Baloo_Launch_Plan.md`): Upvote→Save removal (DEC-1) · auth flow (DEC-2) · comments/feed/moderation
at launch · semantic-search infra · `/@username` URL cutover timing · keep guest mode (rec: yes, but
guests can't publish) · email default (rec: digest-only) · deleted accounts — keep public lists with the
curator anonymised (rec) or delete · who owns privacy policy + terms.

## Phase 3 — Product/Offer (P-series)  *(Tier C / interleaves after beta)*

**Shipped:** ✅ **P1** (offers table, `analysis_status`, pg_trgm) · ✅ **P2** (pipeline lib, background
analyse engine, identity short-circuit, offers RLS, and the `maxTokens` prod-bug fix)

- [ ] **P3 — Two-mode add-product** *(next up; the P2 engine is ready to call)* — **CC**
  - [ ] Catalogue search in the list-builder: **own products first**, recents shown before typing
  - [ ] Detect a pasted URL → **"Analyse & add"** → background via `runAnalysisForProduct()` in `after()`
  - [ ] Migration: `list_items` allows **unresolved items** (nullable `product_id` + `free_text` + resolved flag)
  - [ ] "Unresolved — no analysis" row state + a visible "add link" affordance
  - [ ] Status surfacing: `pending → analysing → done | failed` (Supabase Realtime, fallback poll) + retry
- [ ] **P4 — "Also available at A, B, C"** *(pure frontend — `getOffersForProduct` already exists)* — **CC**
  - [ ] Product page + list rows: "scanned from X · also at A, B, C"
- [ ] **P5 — Quick-view** *(needs the design pick)* — **CC**
  - [ ] One `<IngredientAnalysis productId>` in two containers: full page + drawer (desktop) / sheet (mobile)
  - [ ] Close returns to the exact scroll position; loading / analysing / failed states
- [ ] **P6 — Open Food Facts enrichment layer** *(gated on J's legal posture)* — **CC**
  - [ ] `off_*` namespace, **physically separate** from the proprietary tables
  - [ ] Barcode → on-demand lookup, cache what we touch, **no bulk mirror**
  - [ ] ODbL attribution surfaced
- [ ] **P7 — Nav + scope reconciliation** *(needs the design pick)* — **CC**
  - [ ] Align main nav → **Discover · My Lists · @username**
  - [ ] Decide exposure of the already-built Feed / Comments / Moderation (recommend: keep, de-emphasise) — **J**
  - [ ] Update `CLAUDE.md` to the reconciled rules
- [ ] **P8 — One-click social share** *(self-contained; pull early if distribution matters)* — **CC**
  - [ ] Mobile: `navigator.share({ files: [OG card] })` → OS sheet **with Instagram in it** (~2 taps)
  - [ ] Desktop: intent URLs — WhatsApp · Telegram · X · Facebook + Copy link + Save image
  - [ ] Mount on the list page → then product + profile
  - [ ] ⚠️ **Never promise one-tap Instagram Stories on web** — impossible from a browser (see M1)

## Design (CD + the PART C ritual)
- [ ] Send **B2** — seamless create-a-list — **M→CD**
- [ ] Send **B3** — list detail (view-analysis icon, also-available-at, unresolved item) — **M→CD**
- [ ] Send **B4** — two-mode search (recents / catalogue / paste / "Analysing…") — **M→CD**
- [ ] Send **B5** — analysis in two containers + the quick-view drawer/sheet — **M→CD**
- [ ] Port the chosen direction **per screen**: three approaches → critique ritual → build — **CC**
- [ ] Collect Mobbin references + align with J before building — **M/J**
- [ ] *(Optional)* D-G9 restyle of the moderation surfaces — **CD**

## Ops / pre-launch
- [ ] **Enable Auth leaked-password protection** in the Supabase dashboard *(advisor WARN)* — **M**
- [ ] *(Low priority)* Move `pg_trgm` out of the `public` schema *(advisor WARN)* — **M**
- [ ] Verify **Vercel prod env vars**: `DATABASE_URL`, Supabase keys, `ANTHROPIC_API_KEY`, `FIRECRAWL_API_KEY` — **M**
- [ ] **Upstash REST vars** (`UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`) — the Vercel Redis
      integration exposed `REDIS_URL`, which our code doesn't read. The homepage board and the caches
      stay empty until this is fixed. *Small fix, visible payoff.* — **M**
- [ ] Run `npx tsx scripts/make-admin.ts <jitain-handle>` once he has an account — **M**
- [ ] Decide: promote `/feed` to the **signed-in homepage**? (one-line change) — **J**
- [ ] Decide: commit or gitignore the untracked `.agents/`, `.claude/skills/`, `skills-lock.json`,
      `Baloo_FigmaMake_Brief.md` — **M**

## Decisions needed from Jitain
- [ ] Confirm **analysis stays normalised** (shared `what_it_is` cache) rather than a JSONB blob — *recommended; he can veto*
- [ ] Confirm the **OFF stance**: on-demand + walled-off now; **legal advice before any B2B/paid use**
- [ ] Confirm **no pricing in v1**, with the plumbing ready for a future affiliate layer (visible disclosure)
- [ ] **Legal review of the OFF (ODbL) licence** before OFF data touches anything sold — **J**

## Backlog (recorded, not scheduled)
- [ ] **M1 — True one-tap "Share list to Instagram Stories"** → **mobile app only** (Meta Sharing-to-Stories
      SDK + a registered Facebook App ID). Groundwork already done: the OG card image exists at
      `/api/og/list/[slug]`. *The strongest concrete argument for building the app.*
- [ ] **H1 — Bulk catalogue seed** (makes discovery feel full on day one)
- [ ] Discovery-list → **shopping-list conversion** *(the recurring gap across the benchmark)*
- [ ] Availability / locality signals (`offers.available`)
- [ ] Category taxonomy + `/c/[category]` landing pages (`products.category` column is ready)
- [ ] OFF-for-B2B (post-legal)
- [ ] Affiliate layer (behind visible disclosure)
- [ ] Price snapshots (`offers.price` / `currency` / `price_at` exist, deliberately NULL in v1)

## Known-good state (context, not tasks)
- Catalog: 4 products, **all canonical** — a real scan now resolves by identity instead of duplicating.
- Demo data kept on purpose: `@baloo-dev` (admin), `@baloo-friend`, "Dev: first board", "Friend's cupboard",
  and the Oatly discussion thread.
- Phases 1–2 and Orders G1–G9 are complete and verified.
