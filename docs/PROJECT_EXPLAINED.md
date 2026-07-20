# Baloo — The Project Explained

> **Who this is for.** Anyone who wants to understand Baloo — including someone new to development.
> It explains **what** the project is, **how** it's built, and most importantly **why** each choice
> was made. Plain language first; jargon is defined the first time it appears and collected in the
> Glossary at the end.
>
> Its sibling docs: [`ARCHITECTURE.md`](ARCHITECTURE.md) is the short technical reference (the *what*,
> for people already fluent); this doc is the *why*, told as a story. If you only read one before
> explaining Baloo to someone, read this one.

## Contents
1. [What Baloo is (and the one rule that shapes everything)](#1-what-baloo-is)
2. [The whole system in one picture](#2-the-whole-system-in-one-picture)
3. [The technology choices, and why each one](#3-the-technology-choices)
4. [The analysis pipeline, step by step](#4-the-analysis-pipeline-step-by-step)
5. [The database and its two big ideas](#5-the-database-and-its-two-big-ideas)
6. [Speed and money: the two caches](#6-speed-and-money-the-two-caches)
7. [Accounts and security (and why not Clerk)](#7-accounts-and-security)
8. [The "it runs with nothing" principle](#8-the-it-runs-with-nothing-principle)
9. [The decisions log](#9-the-decisions-log)
10. [Glossary](#10-glossary)
11. [How to explain Baloo to a developer](#11-how-to-explain-baloo-to-a-developer)

---

## 1. What Baloo is

**In one sentence:** you paste the link to a supermarket product, and Baloo tells you — in calm,
plain language — what every ingredient is and why it's in that product.

Then, on top of that tool, there's a **community layer**: you can save products into shareable lists,
follow other people, and discover food through the people who curate it. Think "Letterboxd for
supermarket products, with a friendly nutritionist under every item."

### The one rule that shapes everything: no score

Most competitors (Yuka is the famous one) give food a **score** — a number from 0 to 100, or a
red/amber/green traffic light. Baloo deliberately **never** does this. No score, no rating, no
traffic lights, ever. The only colour that carries meaning is a small **Natural / Processed** tag on
each ingredient.

Why? Because a single number pretends nutrition is simpler than it is, it scares people, and it's the
thing that gets scoring apps sued and distrusted. Baloo's bet is the opposite: **explain, don't
judge.** Educate people and let them decide. This isn't just a design preference — it's written into
the project's rulebooks (`PRODUCT.md`, `DESIGN.md`, `CLAUDE.md`) as an *unbreakable* rule, so nobody
can accidentally add a score later. **When you explain Baloo, lead with this.** It's the identity.

---

## 2. The whole system in one picture

Here's what happens when someone uses Baloo, in everyday terms.

```
   You paste a URL
        │
        ▼
   [ Baloo's server ]  ── "Have I seen this exact link before?" ──► (yes) show the saved answer instantly
        │  no
        ▼
   [ Firecrawl ]  reads the messy supermarket webpage and returns clean text
        │
        ▼
   [ Claude ]  reads the text and pulls out the product name + the ingredient list
        │
        ▼
   "Do I already know this product from another shop?" ──► (yes) reuse the saved analysis, skip ahead
        │  no
        ▼
   [ Claude ]  writes an explanation for each ingredient, one at a time
        │
        ▼
   The explanations stream onto your screen as they're written, card by card
        │
        ▼
   Baloo saves the finished analysis so nobody ever has to pay to analyse this product again
```

Two ideas to hold onto, because they explain a lot of the design:

1. **Every call to Firecrawl and Claude costs real money.** So the whole system is obsessed with
   *not doing the same expensive work twice*. That's what the "have I seen this before?" checks are.
2. **The answer appears gradually** ("streaming"), rather than making you stare at a blank screen for
   20 seconds. That's a deliberate user-experience choice we'll come back to.

### Frontend vs backend (a quick foundation)

Every web app has two halves:

- The **frontend** (also "client") is what runs *in your browser* — the buttons, the text, the
  layout. Anyone can see it.
- The **backend** (also "server") is the code that runs *on our computers in the cloud* — the part
  that talks to Claude, the database, etc. Users never see it.

This split matters constantly in Baloo because our **secret keys** (the passwords that let us use
Claude, Firecrawl, the database) must live **only on the backend**. If they leaked into the frontend,
anyone could read them and run up our bills. Keeping that line clean is a recurring theme below.

---

## 3. The technology choices

Baloo is built from a handful of services and tools. Here's each one — what it is, and *why* it was
chosen over the alternatives. You don't need to memorise these; you need to be able to say "we use X
to do Y, because Z."

| Tool | What it is (plain language) | Why we chose it |
|---|---|---|
| **Next.js** | A popular framework for building websites with JavaScript. Gives us both the frontend and the backend in one project. | Industry standard, huge community, and it runs the frontend and backend together so we don't manage two codebases. Made by the same company as our host (Vercel), so they fit perfectly. |
| **TypeScript** | JavaScript with a spell-checker for data. It catches mistakes *before* the code runs. | Fewer bugs. When a beginner or an AI changes code, TypeScript loudly complains if something doesn't fit, instead of failing silently for a user. |
| **Vercel** | The company that hosts (runs) our website on the internet. | Zero-config deploys — we push code, it goes live automatically. Built for Next.js. |
| **Claude** (Anthropic) | The AI model that reads pages and writes the ingredient explanations. | It's genuinely good at careful, calm, factual writing — exactly the tone Baloo needs. Model: `claude-sonnet-4-6`. |
| **The "AI SDK"** (`ai`) | A helper library that makes talking to Claude easy and reliable. | It can force the AI to return **structured** data (a clean list of ingredients) instead of free-form text, and it handles the "streaming" (words appearing live). |
| **Firecrawl** | A service that visits a webpage and returns clean, readable text. | Supermarket pages are a mess of ads, popups, and code. Firecrawl handles the hard parts (bot-blocking, cookie banners) and hands us tidy text Claude can read. |
| **Supabase** | A ready-made backend: a database **plus** a login/accounts system, managed for us. | Two critical things in one place: our database *and* our user accounts. Keeping them together is what makes our security model work (explained in §7). Generous free tier. |
| **Postgres** | The database itself — where products, lists, users, and comments are stored. | The most trusted, capable open-source database. Supabase runs it for us. |
| **Drizzle** | A translator between our TypeScript code and the Postgres database. | Lets us write database queries in TypeScript (with the spell-checker helping), instead of hand-writing raw database language and hoping it's right. |
| **Upstash Redis** | A tiny, ultra-fast memory store used for caching (remembering recent answers). | Instant lookups to avoid re-doing expensive work. "Serverless," so we pay per use, not for an always-on machine. |
| **Zod** | A gatekeeper that checks incoming data is the right shape. | Safety. It refuses malformed data at the door, so bad input can't sneak deep into the app. |
| **Loops** | An email service for the newsletter/waitlist. | Simple, and it fails gracefully — if it's not set up, the app just skips it. |

### The single most important technical decision: Claude *is* the parser

A normal person might build this by writing custom code for each supermarket — "on Tesco, the
ingredients are in *this* box; on Ocado, they're in *that* box." That's called a **scraper per
retailer**, and it's a nightmare: every site is different, and the moment a supermarket redesigns its
page, your code breaks.

Baloo does something smarter: **it lets the AI read the page like a human would.** Firecrawl turns any
page into plain text, and Claude figures out "here's the product name, here's the ingredient list" no
matter which shop it came from. **One approach works for every supermarket, present and future.** This
is the core insight that makes Baloo maintainable by a small team. (It's written as a hard rule: *"NO
per-retailer parsers."*)

---

## 4. The analysis pipeline, step by step

"Pipeline" just means the assembly line a product URL travels down. It has two main stops, which are
two **API endpoints** — an endpoint is simply a specific address on our backend that does one job.

**Stop 1 — `/api/extract` ("Reading ingredients…")**
Its job: turn a URL into *"here's the product name and the list of ingredients."*
1. Check the fast cache: have we seen this *exact link* before? If yes, return the saved answer and
   we're done — no cost.
2. If not, ask Firecrawl to fetch the page as clean text.
3. Ask Claude to extract the product name + ingredient list from that text.
4. Check the catalog: do we already know this *product* (maybe from a different shop)? If yes, we can
   skip the expensive next step entirely.

**Stop 2 — `/api/analyze` ("Analysing with AI…")**
Its job: for each ingredient, write *what it is* and *why it's in this product*.
- Claude writes these explanations, and they **stream** to the screen — each ingredient "card"
  appears the moment it's ready, instead of making you wait for the whole list.
- When it finishes, Baloo **saves** the result into the database (the catalog), so this product never
  needs analysing again.

### Two details worth understanding

**Why streaming?** Claude writes word by word, and a full analysis can take many seconds. Instead of a
blank loading screen, we show each explanation as it lands. It feels alive and fast, and the user
starts reading the first ingredient while the rest are still being written. This is a deliberate
experience choice, not an accident of the technology.

**A real bug we fixed (good story for developers).** AI models have a limit on how much they can write
in one go. The default was too small (4,096 units of text). For a product with a long ingredient
list, Claude would hit the ceiling mid-sentence, the result would be considered "invalid," and —
because the *saving* step happens quietly in the background — **the whole analysis would silently
vanish.** No error, nothing. We found it, raised the limit to 16,000, and now there's a permanent rule
never to remove that setting. It's a perfect example of how the scariest bugs are the *silent* ones.

**The failure rule.** If anything goes wrong at any step, the user sees **one** friendly sentence —
*"We couldn't read that page. Try a direct product link from Whole Foods, Ocado, Tesco, Target, or
Kroger."* — never a scary technical error. Errors are for the developers' logs, not the user's face.

---

## 5. The database and its two big ideas

The database stores everything permanent: products, ingredients, users, lists, comments, and so on.
Its design is defined once in one file (`lib/db/schema.ts`), which is the single source of truth. When
we change the shape of the database, we create a **migration** — a small, numbered instruction file
("add this column," "create this table") that gets applied in order. It's like version control for the
database's structure.

Two design ideas do a lot of heavy lifting. Both exist to **save money and keep answers consistent.**

### Big idea #1: one row per *real* product ("dedup on a canonical key")

The same yogurt might be sold on Tesco, Ocado, *and* Whole Foods — three different links, one real
product. If we treated each link as a separate product, we'd pay to analyse the same yogurt three
times, and we might get three slightly different answers.

So Baloo computes a **canonical key** for each product — a normalised fingerprint. If the product has a
**barcode**, that's the fingerprint (barcodes are globally unique). If not, we build one from the
brand + name + size, tidied into a standard form. Every link that resolves to the same fingerprint
collapses into **one** product row. ("Canonical" just means "the one official version." "Dedup" is
short for de-duplicate.)

The payoff: the second and third shop selling that yogurt cost us *almost nothing* — we recognise the
product and reuse the analysis, just noting "also available at Ocado, Whole Foods." Those shop listings
are stored separately as **offers** (many offers → one product).

### Big idea #2: explain each ingredient once, for everyone ("product-independent ingredient cache")

"Sugar" means the same thing whether it's in a cereal or a sauce. So Baloo stores the general
explanation of an ingredient (*what it is*) **once**, shared across every product that contains it.

But *why* an ingredient is in a product **does** depend on the product (lecithin is an emulsifier in
chocolate, but plays a different role elsewhere). So that part — *why it's here* — is stored
**per product**.

This split (general knowledge shared, specific knowledge per-product) means the more products Baloo
sees, the cheaper and more consistent it gets. These explanations are also **versioned** — when we
improve one, we keep the old version rather than deleting it, and just mark the new one as active.

---

## 6. Speed and money: the two caches

A **cache** is a memory of recent work so you don't repeat it. Baloo has two, and they catch different
situations. (A **TTL** — "time to live" — is just an expiry date on a cached item.)

| | What it remembers | When it helps | What it saves |
|---|---|---|---|
| **Cache 1 (Redis)** | Answers keyed by the *exact URL* | Someone pastes a link we've seen recently (7-day expiry) | *Everything* — no Firecrawl, no Claude. Instant. |
| **Cache 2 (the catalog)** | Products keyed by their *fingerprint* (canonical key) | Someone pastes a *different link* for a product we already know | The expensive analysis step. We still fetch the page, but skip re-analysing. |

Why two? Because they answer two different questions. Cache 1 asks *"same link?"* Cache 2 asks *"same
product, different shop?"* You need both. (There's a subtle reason they can't be merged: we only learn
a product's fingerprint *after* fetching the page, so the fingerprint can't help us skip the fetch —
that's Cache 1's job.)

---

## 7. Accounts and security

### How login works, and the Clerk question

People kept asking: "shouldn't we use Clerk?" (Clerk is a popular company that provides ready-made
login systems.) The honest answer: **we already use a third-party login system — it's Supabase Auth**,
which is the same *category* of product as Clerk. We do **not** build our own password handling;
Supabase does the hard, dangerous parts (safely storing passwords, sending confirmation emails,
Google sign-in).

So why not switch to Clerk? Because of one elegant fact: **our accounts and our data live in the same
database.** A user's profile is directly linked to their login record. This lets the database itself
enforce rules like "you can only edit *your own* lists" — a feature called **Row-Level Security
(RLS)**, which acts like a security guard *inside* the database.

If we moved login to Clerk, accounts would live in Clerk and data in Supabase — two separate places
that must be constantly synced, and that security-guard feature would break and need rebuilding. More
work, more fragility, more cost, for **zero** benefit a user would notice. Clerk is also really built
for *business* software (teams, seats, admin roles), which isn't what Baloo is. So the decision is:
**harden what we have, don't migrate.**

### How we protect actions

The rule is simple: **reading is public, but *doing* things requires being logged in.** Anyone can
browse and analyse products. But saving a list, following someone, or commenting first passes through
a gate in the code (`requireUser`) that checks you're signed in, and returns a polite "please log in"
if not. Admin-only actions (like moderation) pass through a stricter gate (`requireAdmin`).

### Being honest about what's *not* done yet

This is important to say plainly to developers, because pretending otherwise is how projects get
burned. Baloo's login is solid, but the surrounding **hardening isn't built yet**:

- **Anyone can create accounts in bulk right now.** There's a "guest" mode that makes a real account
  with a single automated request — no email, no captcha. A bot could create thousands. We need a
  captcha and a "guests can look but can't publish" rule.
- **The expensive endpoints have no rate limit.** Nothing stops someone from calling `/api/analyze` in
  a loop and running up our Claude/Firecrawl bill. We need **rate limiting** (a cap on how often
  someone can call something).
- **The email sender is the development one**, which stops working under real traffic. We need to
  connect a proper email service before launch, or sign-up confirmation emails will silently stop.

All of this is planned and written down (the "S-series" in `Baloo_Launch_Plan.md`). Saying "here's
what's done and here's what's next" is a strength, not a weakness — it shows the risks are *known*.

---

## 8. The "it runs with nothing" principle

Here's a design choice that surprises people: **Baloo starts up and works even with none of its keys
configured.** No Claude key, no database, no cache — the app still boots. Each service, when missing,
quietly switches off instead of crashing (the database connection simply becomes "nothing"; the cache
becomes "don't cache").

Why build it this way?

- **A new developer can clone the project and run it in one command**, with zero setup, and see the
  whole interface immediately (there's even a "pretend mode" that fakes the AI so you can click
  through the full experience for free).
- **Robustness.** If the cache service has an outage, Baloo doesn't go down — it just runs a little
  slower. No single service can take the whole site offline.

This is the kind of decision experienced developers respect, because it shows the app was built to
*degrade gracefully* rather than fall over.

---

## 9. The decisions log

A quick-reference table of the meaningful choices and the reasoning. This is the section to skim right
before you present.

| Decision | Why | The alternative we rejected |
|---|---|---|
| **Never show a score/rating** | Trust and honesty; a number oversimplifies nutrition and scares people | Being another Yuka-style scoring app |
| **Let AI read the pages** | One approach works for every supermarket, forever | Fragile custom code per retailer that breaks on every redesign |
| **Next.js + Vercel** | Frontend + backend in one project; deploys itself | Managing separate frontend, backend, and server infrastructure |
| **Supabase (data + login together)** | Enables in-database security rules; one managed service | Separate database + Clerk, which must be synced and breaks the security model |
| **Drizzle + TypeScript** | The computer catches data-shape mistakes before users do | Hand-written database queries with no safety net |
| **Two caches** | Never pay twice for the same work; instant repeat answers | Re-scraping and re-analysing every single time (slow and expensive) |
| **One product row per real product** | Analyse a product once even if it's sold in five shops | Paying five times and getting five inconsistent answers |
| **Stream the results** | Feels fast and alive; users read while the rest is written | A long blank loading screen |
| **Runs with no keys** | One-command onboarding; no single point of failure | An app that won't start unless everything is perfectly configured |
| **One friendly error message** | Users should never see scary technical text | Leaking raw errors to users |
| **Harden Supabase, don't move to Clerk** | Keeps the security model intact; no user-visible gain from switching | A costly migration that breaks in-database security |

---

## 10. Glossary

Plain definitions for the words that come up. Point developers here if they're new too.

- **Frontend / client** — the part of the app running in your browser; everyone can see it.
- **Backend / server** — the part running on our cloud computers; users never see it. Holds the secrets.
- **API / endpoint** — a specific address on the backend that does one job (e.g. `/api/analyze`).
  "API" is the general idea of programs talking to each other; an "endpoint" is one such address.
- **Environment variable / key / secret** — a setting (often a password) given to the app from
  outside the code, so secrets aren't written into the code itself.
- **Database** — the permanent, organised store of all our data (products, users, lists…).
- **Schema** — the blueprint of the database: what tables exist and what columns they have.
- **Migration** — a numbered change to the schema, applied in order. Version control for the database's shape.
- **ORM** (what Drizzle is) — a translator that lets you talk to the database in your normal
  programming language instead of raw database commands.
- **Query** — a request to the database ("give me this user's public lists").
- **Cache** — a short-term memory of recent results, to avoid repeating expensive work.
- **TTL (time to live)** — how long a cached item stays before it expires.
- **Scraping** — automatically reading the contents of a webpage.
- **Streaming** — sending a response piece by piece as it's produced, instead of all at once at the end.
- **Structured output** — forcing the AI to answer in a strict, predictable format (a clean list)
  rather than free-form paragraphs.
- **Row-Level Security (RLS)** — a rule enforced *inside* the database itself about which rows a given
  user is allowed to see or change.
- **Authentication** — proving who you are (logging in). **Authorization** — what you're allowed to do
  once logged in.
- **Rate limiting** — capping how often someone can perform an action, to prevent abuse.
- **Deploy** — publish the latest code so it's live on the internet.
- **Deduplication ("dedup")** — collapsing things that are really the same into one.
- **Canonical** — the one official/standard version of something.

---

## 11. How to explain Baloo to a developer

A short cheat sheet for your conversation.

**The 20-second version:**
> "Baloo turns a supermarket product link into a calm, plain-language explanation of every ingredient
> — what it is and why it's there — and never gives a score, on purpose. On top of that there's a
> community layer: save products into shareable lists and discover food through the people who curate
> it. It's a Next.js app on Vercel, using Claude to read the pages and Supabase (Postgres) to store
> everything."

**The three things that make it interesting, technically:**
1. **The AI is the parser.** No per-supermarket code — Firecrawl cleans the page, Claude reads it, so
   one pipeline works everywhere.
2. **It never analyses the same product twice.** Two caches and a "one row per real product" design
   keep costs down and answers consistent — because every AI call costs money.
3. **Accounts and data share one database**, which lets the database enforce security rules directly
   (RLS). That's also why we're *not* switching to Clerk.

**If a developer asks… say:**
- *"Why not just scrape each site?"* → "Sites differ and change constantly; letting Claude read the
  page means one approach that never breaks on a redesign."
- *"Is it secure?"* → "Login is handled by Supabase Auth, and every write action is gated in code.
  The hardening — rate limits, captcha, proper email — is the next planned block of work, and it's all
  written down. We know exactly what's left."
- *"Why no score like Yuka?"* → "That's the whole point of Baloo. A score oversimplifies and scares;
  we explain instead. It's an unbreakable product rule."
- *"What happens when you get more users/traffic?"* → "The caching design means popular products get
  cheaper over time, not more expensive. The main pre-launch work is rate limiting and bot protection."

**Be honest about the stage.** Baloo's core tool and community features are built and working; the
security hardening and the polished new design are the active work before a public beta. Framing it as
"here's what works, here's what's next, and it's all planned" is the most credible thing you can say.
