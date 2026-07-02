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
6. The nutrition facts panel, if the page shows one

Ingredients on food labels are listed most-to-least by quantity, by law — preserve that order
exactly. If the page has no ingredient list (a non-food item, a login wall, or a blocked page),
return empty strings and empty arrays rather than guessing.

For the nutrition panel:
- Copy every value EXACTLY as printed — number only in per_100g / per_serving (e.g. "6.4",
  "<0.5"), with the unit ("kcal", "g", "mg") in the unit field. Never invent, convert, or
  round a number. Use null for any column the label doesn't show.
- Use these canonical nutrient names: "Energy", "Fat", "Saturates", "Carbohydrate", "Sugars",
  "Fibre", "Protein", "Salt" — use "Sodium" only if the label prints sodium instead of salt.
  Keep the label's row order.
- For energy, when the label shows both kJ and kcal, use the kcal figure (one row, unit "kcal");
  if only kJ is printed, copy the kJ value with unit "kJ".
- serving_size: the serving/portion description exactly as printed (e.g. "30 g (about 13
  crisps)"); null if not stated. per: which basis the label provides ("100g", "serving", or
  "both").
- If there is no nutrition panel, return an empty nutrients array, serving_size null, and per
  "100g" — never make numbers up.

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

// --- Nutrition context line (Order B3): Claude writes the words, code supplies the numbers ---
export function nutritionContextPrompt(input: {
  product_name: string;
  serving_size: string | null;
  basis: "serving" | "100g";
  profileLabel: string;
  highlights: { name: string; pct: number }[];
}): string {
  const portion =
    input.basis === "serving"
      ? `one serving (${input.serving_size ?? "serving size not stated"})`
      : "each 100 g / 100 ml (no serving size is stated)";
  const facts = input.highlights
    .map((h) => `${h.name}: ${h.pct}% of the reference daily intake`)
    .join("; ");

  return `You are a knowledgeable, calm nutritionist.
Education before persuasion. Never alarmist.
Never tell the user what to buy or avoid.
Explain what things are and why they are used.
Context over judgment.

Product: ${input.product_name}
Portion basis: ${portion}
Reference profile: ${input.profileLabel}
Pre-computed facts (already calculated in code — the ONLY numbers you may use): ${facts}

Write ONE short sentence of neutral context from these facts, in the voice above. You may add a
brief closing clause in the spirit of "a sense of how a portion adds up, not a verdict."

Rules:
- Use ONLY the numbers given. Never calculate, convert, extrapolate, or invent any number.
- Phrase as factual context ("about X% of the reference daily fat for ...").
- Never a judgment: no "too much", "high", "bad", "unhealthy", "watch out".
- Never advice: nothing about limiting, avoiding, choosing, or moderating.
- Plain text only, no markdown.`;
}
