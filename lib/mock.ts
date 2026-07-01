import type { Ingredient } from "./schema";

export const MOCK_EXTRACT = {
  cached: false,
  key: "mock",
  url: "https://www.ocado.com/products/oatly-oat-drink",
  product_name: "Oatly Oat Drink Whole",
  retailer: "Ocado",
  ingredients_raw: "Water, Oats 10%, Rapeseed Oil, Calcium Carbonate, Salt, Vitamins",
  ingredients_list: ["Water", "Oats", "Rapeseed Oil", "Calcium Carbonate", "Salt", "Vitamins (D2, Riboflavin, B12)"],
  percentages: [{ ingredient: "Oats", percentage: "10%" }],
};

const MOCK_INGREDIENTS: Ingredient[] = [
  { name: "Water", tag: "Natural", what_it_is: "The liquid base of the drink.", why_its_here: "It's the carrier the oats are blended into, which is why it's listed first.", percentage: null, percentage_note: null },
  { name: "Oats", tag: "Natural", what_it_is: "A whole grain, here finely milled and enzyme-treated to release natural sweetness.", why_its_here: "The defining ingredient — it gives the drink its body and flavour.", percentage: "10%", percentage_note: "A meaningful amount for an oat drink; it's the second-largest ingredient by weight." },
  { name: "Rapeseed Oil", tag: "Processed", what_it_is: "A refined plant oil.", why_its_here: "A small amount adds a creamier mouthfeel and carries fat-soluble vitamins.", percentage: null, percentage_note: null },
  { name: "Calcium Carbonate", tag: "Processed", what_it_is: "A mineral source of calcium.", why_its_here: "Added to fortify the drink so it's closer to dairy milk's calcium level.", percentage: null, percentage_note: null },
  { name: "Salt", tag: "Natural", what_it_is: "Sodium chloride.", why_its_here: "A pinch rounds out and balances the flavour.", percentage: null, percentage_note: null },
  { name: "Vitamins (D2, Riboflavin, B12)", tag: "Processed", what_it_is: "Added micronutrients.", why_its_here: "Fortification, again to match the nutritional profile people expect from milk.", percentage: null, percentage_note: null },
];

// Streams the JSON in small chunks so useObject's partial parser reveals cards one by one.
export function mockAnalyzeStream(delayMs = 70, chunkSize = 36): Response {
  const full = JSON.stringify({ ingredients: MOCK_INGREDIENTS });
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      for (let i = 0; i < full.length; i += chunkSize) {
        controller.enqueue(encoder.encode(full.slice(i, i + chunkSize)));
        await new Promise((r) => setTimeout(r, delayMs));
      }
      controller.close();
    },
  });
  return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}