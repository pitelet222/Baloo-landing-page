import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getProductById, getProductForPage } from "@/lib/db/queries/products";
import { getCommentForExplain } from "@/lib/db/queries/comments";
import { explanationSchema, type Explanation } from "@/lib/schema";
import { explainPrompt } from "@/lib/prompts";
import { cacheGetText, cacheSetText } from "@/lib/cache";
import { MODEL } from "@/lib/config";
import { checkLimit, tooMany } from "@/lib/ratelimit";

export const maxDuration = 30;

// "Explain this" (Order G8b) — Baloo's factual, in-thread answer. Signed-in only (handoff §6).
// Grounded in the label-derived ingredient facts we already stored; one model call, cached and
// shared per comment/product; a deterministic fallback (no key / on error) uses the stored
// two-beat directly so the card never blocks.
export async function POST(req: Request) {
  const gate = await requireUser();
  if ("error" in gate) return gate.error;

  // S1: cap the paid "Explain this" call per user. Fail-open without Upstash.
  const rl = await checkLimit("explain", gate.user.id);
  if (!rl.ok) return tooMany(rl.reset);

  const dbi = db();
  if (!dbi) return NextResponse.json({ error: "db_not_configured" }, { status: 503 });

  let body: { commentId?: string; productId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  // Resolve the target product + the comment being explained (if any).
  let productId = body.productId ?? null;
  let comment: string | null = null;
  if (body.commentId) {
    const c = await getCommentForExplain(dbi, body.commentId);
    if (!c) return NextResponse.json({ error: "not_found" }, { status: 404 });
    productId = c.productId;
    comment = c.body;
  }
  if (!productId) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const cacheKey = body.commentId ? `explain:c:${body.commentId}` : `explain:p:${productId}`;
  const cached = await cacheGetText(cacheKey);
  if (cached) {
    try {
      return NextResponse.json({ explanation: JSON.parse(cached) as Explanation, cached: true });
    } catch {
      /* fall through and regenerate */
    }
  }

  const product = await getProductById(dbi, productId);
  if (!product) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const page = await getProductForPage(dbi, product.slug);
  const ingredients = (page?.items ?? []).map((i) => ({
    name: i.name,
    tag: i.tag ?? null,
    what_it_is: i.whatItIs ?? "",
    why_its_here: i.whyItsHere ?? "",
  }));

  const explanation = await generateExplanation({
    productName: product.name,
    comment,
    ingredients,
    productSummary: page?.summary ?? null,
  });

  if (explanation) await cacheSetText(cacheKey, JSON.stringify(explanation));
  return explanation
    ? NextResponse.json({ explanation })
    : NextResponse.json({ error: "explain_failed" }, { status: 502 });
}

type Ing = { name: string; tag: string | null; what_it_is: string; why_its_here: string };

async function generateExplanation(input: {
  productName: string;
  comment: string | null;
  ingredients: Ing[];
  productSummary: string | null;
}): Promise<Explanation | null> {
  // Deterministic grounded fallback: the ingredient named in the comment, else the first.
  const fallback = (): Explanation | null => {
    if (input.ingredients.length === 0) {
      return input.productSummary
        ? { what_it_is: input.productSummary, in_this_product: "" }
        : null;
    }
    const lc = (input.comment ?? "").toLowerCase();
    const match =
      input.ingredients.find((i) => i.name && lc.includes(i.name.toLowerCase())) ??
      input.ingredients[0];
    return {
      what_it_is: match.what_it_is || `${match.name} is one of the ingredients in this product.`,
      in_this_product: match.why_its_here || input.productSummary || "",
    };
  };

  if (!process.env.ANTHROPIC_API_KEY || input.ingredients.length === 0) return fallback();

  try {
    const { object } = await generateObject({
      model: anthropic(MODEL),
      schema: explanationSchema,
      prompt: explainPrompt({
        product_name: input.productName,
        comment: input.comment,
        ingredients: input.ingredients,
      }),
    });
    return object;
  } catch (err) {
    console.error("explain error (falling back):", err);
    return fallback();
  }
}
