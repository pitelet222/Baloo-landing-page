import { z } from "zod";

// --- Nutrition panel (captured in call 1, consumed by the Nutrition tab / lib/nutrition.ts) ---
// Contract: values are strings copied EXACTLY as printed ("6.4", "<0.5") — number only, unit kept
// separately — so label fidelity is preserved; downstream code does all parsing and arithmetic.
export const nutrientSchema = z.object({
  name: z
    .string()
    .describe(
      'Canonical name: "Energy", "Fat", "Saturates", "Carbohydrate", "Sugars", "Fibre", ' +
        '"Protein", "Salt" (use "Sodium" only if that is what the label prints)',
    ),
  per_100g: z
    .string()
    .nullable()
    .describe('Value per 100g/100ml exactly as printed, number only (e.g. "6.4", "<0.5"); null if not shown'),
  per_serving: z
    .string()
    .nullable()
    .describe("Value per serving/portion exactly as printed, number only; null if not shown"),
  unit: z.string().describe('The unit as printed: "kcal", "g", "mg"'),
});
export type Nutrient = z.infer<typeof nutrientSchema>;

export const nutritionSchema = z.object({
  serving_size: z
    .string()
    .nullable()
    .describe('Serving size exactly as printed, e.g. "30 g (about 13 crisps)"; null if not stated'),
  per: z
    .enum(["100g", "serving", "both"])
    .describe('Which basis the label provides; "100g" as placeholder when there is no panel'),
  nutrients: z
    .array(nutrientSchema)
    .describe("Label row order preserved; EMPTY array when the page shows no nutrition panel"),
});
export type Nutrition = z.infer<typeof nutritionSchema>;

// --- Call 1: extraction from page markdown ---
export const extractionSchema = z.object({
  product_name: z.string().describe("The product's name as shown on the page"),
  retailer: z.string().describe("The retailer / supermarket name"),
  ingredients_raw: z
    .string()
    .describe("The full ingredient list exactly as written, original order preserved"),
  ingredients_list: z
    .array(z.string())
    .describe("The ingredients split into an ordered array, label order preserved"),
  percentages: z
    .array(
      z.object({
        ingredient: z.string(),
        percentage: z.string().describe('e.g. "1%"'),
      }),
    )
    .describe("Any percentages listed on the label; empty array if none"),
  nutrition: nutritionSchema,
});
export type Extraction = z.infer<typeof extractionSchema>;

// --- Call 2: per-ingredient analysis (streamed) ---
export const ingredientSchema = z.object({
  name: z.string(),
  tag: z.enum(["Natural", "Processed"]),
  role: z
    .string()
    .describe(
      'A 2-4 word neutral functional label for what the ingredient does in THIS product, e.g. "Base", "Thickener / stabiliser", "Culture / ferment" — never a judgment',
    ),
  what_it_is: z.string().describe("Plain-language explanation of the ingredient itself"),
  why_its_here: z.string().describe("Why it is in this specific product"),
  percentage: z.string().nullable().describe('e.g. "1%", or null if not listed'),
  percentage_note: z
    .string()
    .nullable()
    .describe("Whether that amount is meaningful or mainly cosmetic; null if no percentage"),
});
export type Ingredient = z.infer<typeof ingredientSchema>;

export const analysisSchema = z.object({
  ingredients: z.array(ingredientSchema),
  // Declared AFTER ingredients on purpose: streamObject emits JSON in schema property order,
  // so the summary streams in only once every ingredient card is out — the read strip's
  // "summary arrives last" behaviour (design handoff F2) with no orchestration code.
  product_summary: z
    .string()
    .describe(
      "ONE calm, neutral sentence about the formulation as a whole — no advice, no verdict",
    ),
});
export type Analysis = z.infer<typeof analysisSchema>;

// Shape stored in the cache and returned on a cache hit.
// nutrition (pre-B1) and product_summary (pre-F1) are optional so older entries stay
// readable; old cached ingredients also lack `role` at runtime — the UI reads defensively.
export type CachedResult = {
  product_name: string;
  retailer: string;
  url: string;
  ingredients: Ingredient[];
  nutrition?: Nutrition;
  product_summary?: string;
};
