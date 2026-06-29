import { z } from "zod";

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
});
export type Extraction = z.infer<typeof extractionSchema>;

// --- Call 2: per-ingredient analysis (streamed) ---
export const ingredientSchema = z.object({
  name: z.string(),
  tag: z.enum(["Natural", "Processed"]),
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
});
export type Analysis = z.infer<typeof analysisSchema>;

// Shape stored in the cache and returned on a cache hit.
export type CachedResult = {
  product_name: string;
  retailer: string;
  url: string;
  ingredients: Ingredient[];
};
