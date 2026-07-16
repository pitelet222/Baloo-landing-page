Build me a responsive web app (desktop and mobile) called **Baloo**.

Create THREE genuinely different design directions and put links to them as **v1 / v2 / v3 in the header**, so I can switch between them from this one build. Make them differ in layout, information hierarchy, and personality — not just colour. All three must respect the product and the guardrails below.

## The product in one line
Paste a supermarket product link (or search products already in Baloo) and get a calm, plain-language breakdown of every ingredient — what it is and why it's in that specific product — then save products into shareable lists.

## Design language (all three directions respect this)
- Calm, editorial, trustworthy — a knowledgeable friend, not a clinical health app or an alarmist scanner.
- Light: white / soft paper background, near-black ink text, generous whitespace.
- Typography: a warm serif for headlines paired with a clean sans for body text.
- Colour is disciplined: green and amber ONLY, and only as small ingredient tags (green = Natural, amber = Processed). No other loud colour.
- **NO score, NO rating, NO traffic lights, NO 0–100 number anywhere. Baloo explains, it does not judge.** This is essential to the brand.

## Screens and components

**1. Home — the tool is the hero.**
- Baloo wordmark top-left; top nav: Discover · My Lists · @username; a sign-in entry on the right.
- Headline "Know what's in your food." with one line of subtext.
- A large centred URL input, placeholder "Paste a supermarket product link…", with an Analyse button.
- A quiet line of supported retailers: Whole Foods, Ocado, Tesco, Target, Kroger.

**2. Analysis result — the main event.**
- Product header: product name (large), retailer name + a link to the source, and "N ingredients — listed most to least by quantity."
- Tabs: **Ingredients** / **Nutrition**.
- Ingredients tab: a vertical list of ingredient cards. Each card shows the ingredient name, a small green "Natural" or amber "Processed" tag, a "What it is" paragraph, a "Why it's here" paragraph, and (if present) a percentage with a short note on whether that amount is meaningful or mainly cosmetic. Cards should feel like they reveal one after another, as if streaming in.
- Nutrition tab: the nutrition panel as a clean table with a "% of a reference daily intake for [profile]" column and a small profile selector ("Showing context for: Adult ▾"), one neutral one-line context sentence, and a disclaimer that it's a general estimate and not medical advice. No red/green nutrient colour-coding.
- A clear "Add to list" action on the result.

**3. Two-mode search (used when adding a product to a list).**
- One input. Before typing, show the user's recent products. As they type, search products already in Baloo (show name, brand, retailer, and a small "analysed" check). If the input is a URL, offer "Analyse & add this product." Visually distinguish existing results from the paste option.
- A just-added new product shows an "Analysing…" state.

**4. My Lists and list detail.**
- My Lists: the user's lists as calm cards (title, item count).
- Creating a list is minimal — just a title — and lands the user straight inside the new, empty list with a prominent "Add your first product" action. A public/private toggle exists but is small and secondary, not a big header element.
- List detail: title, owner, item count, Upvote and Save actions. Item rows show product name / brand / retailer, a small "View ingredient analysis" icon (with tooltip), and an "also available at A, B, C" line. Include the empty state (the add-first-product moment).

**5. Quick-view analysis.**
- Tapping the "View ingredient analysis" icon on a list item opens the SAME ingredient analysis in a right-side drawer on desktop, or a full-screen sheet on mobile, with an easy close/back that returns to the same place in the list. Tapping the product name or image instead opens the full product page. Identical cards and design to the main result — only the container changes.

**6. Discover.**
- Public lists as a calm, browsable grid/feed. A "New from people you follow" section that appears once the user follows people.

**7. Profile (@username).**
- The user's public lists (My Lists), Saved lists, and follower/following counts. A Follow button appears on other users' profiles.

**8. Auth.**
- A lightweight email sign-in modal, not a separate page. Browsing and analysing work signed-out; saving, upvoting and following require sign-in.

## Interactions and feel
Streaming reveal of ingredient cards; optimistic upvote / save / follow; smooth drawer and sheet transitions; no jarring full-page reload between naming a list and adding the first product.

## Out of scope — do not design
Comments, activity feeds, messaging, notifications, list cover images, tags, templates, and any kind of health score or rating.

## Reminder
Produce v1, v2 and v3 as three distinct directions, each linked from the header.
