import { NextResponse } from "next/server";
import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { nutritionSchema } from "@/lib/schema";
import { getProfile } from "@/lib/profile";
import { computeNutrition, pickHighlights, fallbackContextSentence } from "@/lib/nutrition";
import { nutritionContextPrompt } from "@/lib/prompts";
import { cacheGetText, cacheSetText } from "@/lib/cache";
import { MODEL } from "@/lib/config";

export const maxDuration = 30;

// Order B3: the one neutral context line under the Nutrition tab. The percentages are
// recomputed HERE from the raw panel (never trusted from the client, never computed by the
// model); Claude only phrases the code-supplied numbers. One model call per product×profile,
// cached in Upstash for 7 days; without a key (or on any failure) a deterministic template
// sentence is returned instead, so the tab never blocks.
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const { key, product_name, serving_size, nutrition, profile_id } = (body ?? {}) as {
    key?: string;
    product_name?: string;
    serving_size?: string | null;
    nutrition?: unknown;
    profile_id?: string;
  };

  const parsedNutrition = nutritionSchema.safeParse(nutrition);
  if (!product_name || !parsedNutrition.success) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const profile = getProfile(profile_id);
  const computation = computeNutrition(parsedNutrition.data, profile);
  const highlights = pickHighlights(computation);
  if (highlights.length === 0) {
    return NextResponse.json({ context: "" });
  }

  const cacheKey = key ? `ctx:${key}:${profile.id}` : null;
  if (cacheKey) {
    const cached = await cacheGetText(cacheKey);
    if (cached) return NextResponse.json({ context: cached, cached: true });
  }

  const facts = {
    product_name,
    serving_size: serving_size ?? parsedNutrition.data.serving_size,
    basis: computation.basis,
    profileLabel: profile.label,
    highlights,
  };

  let context: string;
  if (!process.env.ANTHROPIC_API_KEY) {
    context = fallbackContextSentence(facts);
  } else {
    try {
      const { text } = await generateText({
        model: anthropic(MODEL),
        prompt: nutritionContextPrompt(facts),
      });
      context = text.trim() || fallbackContextSentence(facts);
    } catch (err) {
      console.error("nutrition-context error (falling back):", err);
      context = fallbackContextSentence(facts);
    }
  }

  if (cacheKey && context) await cacheSetText(cacheKey, context);
  return NextResponse.json({ context });
}
