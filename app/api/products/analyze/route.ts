import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { runAnalysisForProduct } from "@/lib/analysis/runForProduct";
import { checkLimit, tooMany } from "@/lib/ratelimit";

export const maxDuration = 60;

// Analyse a product by id (Order P2, spec Order 4) — the USER-TRIGGERED entry point: the retry on
// a product whose analysis failed, or an explicit re-run.
//
// This is deliberately NOT how the app backgrounds its own work: P3's add-by-paste flow calls
// runAnalysisForProduct() directly inside after(), with no HTTP hop and no auth dance. Same engine,
// no self-fetch. Auth is required here because this endpoint spends money (Firecrawl + Claude).
export async function POST(req: Request) {
  const gate = await requireUser();
  if ("error" in gate) return gate.error;

  // S1: cap this paid retry/re-run per user. Fail-open without Upstash.
  const rl = await checkLimit("productsAnalyze", gate.user.id);
  if (!rl.ok) return tooMany(rl.reset);

  let body: { productId?: string; force?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (!body.productId) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const result = await runAnalysisForProduct(body.productId, { force: body.force });
  return NextResponse.json(result, { status: result.status === "failed" ? 422 : 200 });
}
