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
- what_it_is: a plain-language explanation of the ingredient itself
- why_its_here: the role it plays in this specific product
- percentage: the listed percentage (e.g. "1%") or null
- percentage_note: if a percentage is present, whether that amount is meaningful or mainly
  cosmetic; otherwise null

Keep the ingredients in label order. Do not reorder them.`;
}
