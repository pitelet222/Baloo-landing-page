import type { Extraction } from "./schema";

// --- Call 1: extract from Firecrawl markdown ---
export function extractionPrompt(markdown: string): string {
  return `You are reading a supermarket product page that has been converted to markdown.

Extract:
1. The product name
2. The retailer name
3. The complete ingredient list, exactly as written, preserving the original order
4. The ingredients split into an ordered array (same order as the label)
5. Any ingredient percentages if listed (e.g. "sugar 12%")

Ingredients on food labels are listed most-to-least by quantity, by law — preserve that order
exactly. If the page has no ingredient list (a non-food item, a login wall, or a blocked page),
return empty strings and empty arrays rather than guessing.

PAGE MARKDOWN:
"""
${markdown}
"""`;
}

// --- Call 2: analyse each ingredient ---
export function analysisPrompt(input: {
  product_name: string;
  retailer: string;
  ingredients_list: string[];
  percentages: { ingredient: string; percentage: string }[];
}): string {
  const pct =
    input.percentages.length > 0
      ? input.percentages.map((p) => `${p.ingredient}: ${p.percentage}`).join(", ")
      : "none listed";

  return `You are a knowledgeable, calm nutritionist.
Education before persuasion. Never alarmist.
Never tell the user what to buy or avoid.
Explain what ingredients are and why they are used.
Context over judgment.

Product: ${input.product_name}
Retailer: ${input.retailer}
Ingredients in label order: ${input.ingredients_list.join(", ")}
Percentages where known: ${pct}

For each ingredient, in the same order, return:
- name
- tag: "Natural" or "Processed"
- what_it_is: 2-3 informative sentences explaining the ingredient itself, written to hold true of
  this ingredient in general (not just in this product, so the explanation is reusable): its
  origin/source, what it is made from or how it is produced, and the form it usually takes. Be
  specific and genuinely educational, not generic.
- why_its_here: 2-3 sentences on the concrete role it plays in THIS product — the function it
  serves (e.g. texture, moisture, preservation, flavour, colour, emulsifying, fortification) and
  why a product like this one includes it. Tie it to this product, not to ingredients in general.
- percentage: the listed percentage (e.g. "1%") or null
- percentage_note: if a percentage is present, whether that amount is meaningful or mainly
  cosmetic; otherwise null

Explain and give context in the calm nutritionist voice above — never judge, never call an
ingredient good or bad, and never tell the user what to buy or avoid. Keep the ingredients in
label order. Do not reorder them.`;
}
