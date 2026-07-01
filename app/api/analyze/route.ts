import { streamObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { analysisSchema } from "@/lib/schema";
import { analysisPrompt } from "@/lib/prompts";
import { cacheSet } from "@/lib/cache";
import { MODEL } from "@/lib/config";
import { mockAnalyzeStream } from "@/lib/mock";

export const maxDuration = 60;

// Phase 2 of the flow: stream the per-ingredient analysis so cards render one by one.
// Consumed on the client by useObject. Writes the finished result to cache on completion.
export async function POST(req: Request) {
  // Dev/design mode: stream canned cards (no keys, no Claude) so the UI is fully previewable.
  // Gated on the key being ABSENT so a stray MOCK_PIPELINE can't shadow a real key.
  if (process.env.MOCK_PIPELINE && !process.env.ANTHROPIC_API_KEY) return mockAnalyzeStream();

  const body = await req.json();
  const { product_name, retailer, ingredients_list, percentages, key, url } = body;

  const result = streamObject({
    model: anthropic(MODEL),
    schema: analysisSchema,
    prompt: analysisPrompt({
      product_name,
      retailer,
      ingredients_list: ingredients_list ?? [],
      percentages: percentages ?? [],
    }),
    onFinish: async ({ object }) => {
      // Cache the complete analysis keyed by URL hash (7-day TTL handled in cacheSet).
      if (object && key) {
        await cacheSet(key, {
          product_name,
          retailer,
          url,
          ingredients: object.ingredients,
        });
      }
    },
  });

  return result.toTextStreamResponse();
}
