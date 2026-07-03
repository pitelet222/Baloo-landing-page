# Baloo — Benchmark: Community-led Food Discovery

**For:** Jitain · **By:** Miquel · **Date:** July 2026
**Brief:** benchmark products where **the community is the main value** (not ingredient scanners),
with a focus on the "lists as the primary object" thesis (Pinterest boards, Spotify playlists,
Letterboxd lists). Screenshots to be captured live from each app — this doc describes the key
screens and the mechanics behind them.

> **Headline finding.** No one owns "community-led discovery for supermarket products." The
> mechanics are proven in adjacent verticals (wine, beer, restaurants, film, books) and the
> primary-object-is-a-list pattern wins repeatedly. Grocery has huge latent demand (Reddit) but
> no product-native home. **Baloo's unfair advantage: none of the analogs have a real AI
> explanation layer under the social layer.** That's the wedge.

---

## Tier 1 — Community-as-primary + lists (the model to copy)

### Vivino — wine
**vivino.com / iOS / Android.** 70M+ users, 17M wines.
- **Community:** scan a label → rating, tasting notes, photos; follow friends; feeds with likes
  and comments (explicitly "like Instagram for wine"); trending wine lists; users upload
  restaurant wine lists.
- **Works:** the rating is the habit; "won't buy a bottle without checking Vivino" is the tell —
  community ratings became a *purchase gate*. Scan-to-buy loop is tight.
- **Weaknesses:** lists are secondary to ratings; discovery is search-first, not list-first; feed
  is shallow. Monetises marketplace, which biases neutrality.
- **Steal:** the "community rating as purchase gate" habit; label-scan as the low-friction entry.

### Untappd — beer
**untappd.com / iOS / Android.** The dominant beer social app.
- **Community:** "check in" a beer (what, where, rating, notes, photo), earn **badges**, follow
  friends, comment on check-ins, browse venue tap lists, get recommendations.
- **Works:** **gamification (badges) drives absurd retention** — people complete "styles," "count
   x unique." Location + social ("what are my friends drinking") makes it live.
- **Weaknesses:** check-in fatigue; content is ephemeral (a moment, not a durable list); little
  editorial/curation value once you've logged.
- **Steal:** badges/streaks for contribution (deferred for us until accounts — the brief's Top
  Scanners); "what people near you are scanning" (we already log country-level).

### Beli — restaurants
**beliapp.com / iOS.** Fast-growing Gen-Z restaurant app.
- **Community:** rank restaurants via **pairwise comparison** ("better than X?") → a personal
  ranked list out of 10; follow friends; **"friend rating"** (avg of your friends' scores) and a
  **taste-compatibility %** between users; want-to-try lists + maps.
- **Works:** ranking-by-comparison produces *better* data than star ratings and is addictive;
  the compatibility score makes following people meaningful; invite-only built exclusivity.
- **Weaknesses:** restaurants only; recs need many ratings to warm up (cold start per user).
- **Steal — the strongest single idea for us:** **pairwise ranking + taste compatibility.**
  "You and Ana agree 84% on snacks" is a killer reason to follow someone's grocery lists.

### Letterboxd — film
**letterboxd.com.** The reference for "lists as the primary object."
- **Community:** log films, review, and above all **make and share lists** ("Best A24 films",
  "Comfort rewatches"); follow curators; lists get liked, saved, ranked.
- **Works:** **the list is the unit of culture and virality.** Curation itself is the content;
  great lists travel on social media and pull in new users (SEO + shareability).
- **Weaknesses:** no commerce; discovery of *good* lists relies on follows + editorial.
- **Steal:** lists as first-class, shareable, followable objects; public web pages per list with
  rich link previews (this is why web-first matters for us).

### Pinterest — everything
**pinterest.com.** Boards = the original product-list network.
- **Community:** pin items to **boards**; follow boards/people; repin; boards are the shareable,
  browsable unit; strong visual discovery + search.
- **Works:** boards make saving *social and reusable*; the same pin lives in thousands of boards
  → network effects; enormous SEO/inbound.
- **Weaknesses:** shallow discussion; commerce bolted on later; low "trust" signal per pin.
- **Steal:** the board model exactly — a product can live in many lists; the list is the atom.

### Product Hunt — new products
**producthunt.com.** Community ranking of product launches.
- **Community:** post products, **upvote**, comment/discuss, "collections"; daily leaderboard;
  makers engage in comments.
- **Works:** the daily ranked leaderboard creates a reason to return; comments are high-signal;
  "collections" = curated lists.
- **Weaknesses:** launch-day spike then decay; ranking gameable; not built for evergreen catalog.
- **Steal:** upvote + daily/weekly ranked surfaces ("Top toddler snacks this week"); comment
  threads attached to a product.

### Goodreads — books
**goodreads.com.** Reviews + shelves + social at scale.
- **Community:** shelve books (custom "shelves" = lists), rate, review, follow, join groups,
  **Listopia** (community-voted lists like "Best high-protein cookbooks").
- **Works:** shelves + Listopia show how *user-generated lists* become durable discovery
  surfaces; reviews are deep.
- **Weaknesses:** dated UX; Amazon-owned neutrality questions; weak recommendations.
- **Steal:** **Listopia** = community-voted "best of" lists per category — a direct template for
  "Best supermarket cereals" as a *living, voted* page.

---

## Tier 2 — Food/grocery-specific (adjacent, weaker community)

### Open Food Facts — collaborative product database
**openfoodfacts.org.** 25k+ contributors, 4M products, fully open data.
- **Community:** contributors scan + photograph products to build an open database; a
  **folksonomy engine** lets users add free-form tags/attributes collaboratively.
- **Works:** proves people *will* crowdsource product data at scale; open catalog is a launchpad.
- **Weaknesses:** it's a *database project*, not a consumer social product — no lists, feeds,
  identity, or discovery joy. Utilitarian.
- **Steal / use directly:** **this is our catalog seed** (the brief already plans OFF + Go-UPC).
  The lesson: the data layer is necessary but not the experience — the community/lists are.

### Fig — dietary-restriction discovery
**foodisgood.com / iOS / Android.** 300k+ products, 50+ stores, 2000+ diets.
- **Community:** scan/search → is-this-right-for-me by diet; build shopping lists; discover
  products that fit your restrictions; ratings from dietitians (expert, not crowd).
- **Works:** **discovery framed around a need** ("what CAN I eat") not a verdict; store-filtered
  shopping lists; a warm, inclusive community tone.
- **Weaknesses:** community is largely *audience*, not creators; experts generate the content, not
  peers; paywalled after 5 scans/mo.
- **Steal:** need-based discovery ("Products without emulsifiers" is exactly this) and
  store-scoped lists ("Everything I buy at Mercadona").

### Yuka — the scanner incumbent
**yuka.io.** ~50M users; the app we're explicitly *not* copying.
- **Community:** minimal — it's a solo utility (scan → score → alternatives). Social proof is the
  install base, not interaction.
- **Works:** the score is dead-simple and viral; "better product" alternatives drive behaviour.
- **Weaknesses (our opening):** **a score is a verdict, not understanding; there is no community,
  no lists, no discussion.** Users can't contribute, curate, or connect. Ceiling on depth + trust.
- **Steal / avoid:** avoid the reductive score (our guardrail); take the "buy this instead"
  alternative pattern, but make it **community + AI generated**, not an opaque algorithm.

### Reddit — the latent grocery community
**r/traderjoes, r/costco, r/EatCheapAndHealthy, etc.** Hundreds of thousands to millions of members.
- **Community:** endless "what should I buy at X", hauls, "hidden gems", recommendation threads,
  upvoted product recs.
- **Works:** proves **massive unmet demand** for community grocery recommendations; upvotes
  surface consensus; identity-per-store ("I'm a TJ's person").
- **Weaknesses:** ephemeral (threads vanish), unstructured (no product entities, no reusable
  lists), no AI, hard to search, no shopping utility.
- **Steal:** this is the audience. Baloo = "give Reddit's grocery threads a **product-native,
  list-structured, AI-backed** home." Every recurring thread ("best cereal?") should be a
  living Baloo list.

---

## Synthesis — patterns that win, and where the bigger opportunity is

**What consistently works across the winners:**
1. **The list/board/shelf is the primary object** — shareable, followable, reusable, SEO-friendly.
   Posting single items is a feed; curating lists is a network. (Jitain is right.)
2. **A better rating primitive than 5 stars** — Beli's pairwise ranking + taste-compatibility is
   the standout; it makes *following people* meaningful.
3. **Gamification of contribution** — Untappd badges / streaks drive retention (our deferred Top
   Scanners).
4. **Identity through taste** — "I'm a Trader Joe's person", "no-emulsifier household". Lists are
   how people perform identity.
5. **Web pages per list** — Letterboxd/Pinterest grow through shareable, link-previewable,
   indexable list pages. **Argues web-first for the community layer.**

**The bigger opportunity Jitain sensed — three moats none of the analogs combine:**
- **AI under the community.** Vivino/Beli/Letterboxd have *zero* explanation layer. Baloo already
  has best-in-class per-ingredient + per-product AI. "Every product has AI, every ingredient has
  AI" *under* community lists is genuinely novel.
- **Trust/neutrality as a feature.** Vivino/Yuka monetise in ways that bias neutrality; our
  "education before persuasion, no verdict" stance is a differentiator in a category full of
  scores and marketing.
- **Structured product truth.** Reddit has the demand but no product entities; OFF has the
  entities but no community. Baloo can hold **both** — canonical products (OFF + Go-UPC + our AI)
  *and* the social layer on top.

**Concrete features to prototype (ranked):**
1. Lists as the atom — create/curate/share, public web pages, follow. *(Pinterest/Letterboxd)*
2. Pairwise product ranking + taste-compatibility %. *(Beli — highest-leverage new idea)*
3. Community-voted "best of category" living lists (Listopia for groceries). *(Goodreads)*
4. Per-product discussion threads + upvotes. *(Product Hunt/Reddit)*
5. Store-scoped and need-scoped lists ("Everything at Mercadona", "No emulsifiers"). *(Fig)*
6. Contribution badges/streaks. *(Untappd — later, with accounts)*
7. AI "explain this list" / "buy this instead, and why" — the layer only we can do.

**One-line positioning:** *Letterboxd for supermarket products, with an AI nutritionist under
every item.*

---

## Notes / caveats
- Screenshots need manual capture from each live app/site (couldn't be pulled programmatically);
  the "key screen" to grab per app: Vivino feed, Untappd check-in + badges, Beli ranking flow +
  compatibility, Letterboxd list page, Pinterest board, Product Hunt daily leaderboard, Goodreads
  Listopia, Fig discovery, a big r/traderjoes rec thread.
- Also worth a live look (not deep-researched here): **Flavour/HowGood, Spoonful, IngrediCheck,
  Labeless AI** (ingredient communities), **Bring!/AnyList** (shopping-list apps with light
  social — the "list" mechanic without discovery).
