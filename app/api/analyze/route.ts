import { streamObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { analysisSchema } from "@/lib/schema";
import { analysisPrompt } from "@/lib/prompts";
import { cacheSet } from "@/lib/cache";
import { MODEL } from "@/lib/config";
import { mockAnalyzeStream } from "@/lib/mock";
import { recordScan } from "@/lib/stats";
import { geolocation } from "@vercel/functions";

export const maxDuration = 60;

// Phase 2 of the flow: stream the per-ingredient analysis so cards render one by one.
// Consumed on the client by useObject. Writes the finished result to cache on completion.
export async function POST(req: Request) {
  // Dev/design mode: stream canned cards (no keys, no Claude) so the UI is fully previewable.
  // Gated on the key being ABSENT so a stray MOCK_PIPELINE can't shadow a real key.
  if (process.env.MOCK_PIPELINE && !process.env.ANTHROPIC_API_KEY) return mockAnalyzeStream();

  const body = await req.json();
  const { product_name, retailer, ingredients_list, percentages, nutrition, key, url } = body;

  // Country-level only, for the scan board. Undefined in local dev (no Vercel headers).
  const { country } = geolocation(req);

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
          nutrition,
          product_summary: object.product_summary,
        });
      }
      // Log the scan for the homepage board. Runs after the stream is delivered, so it never
      // slows the user; recordScan swallows its own errors. Only a real result counts.
      if (object?.ingredients?.length) {
        await recordScan({ product_name, retailer, country });
      }
    },
  });

  return result.toTextStreamResponse();
}
