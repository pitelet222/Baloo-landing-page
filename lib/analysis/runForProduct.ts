// The background analysis job (Order P2, spec Order 4).
//
// Analysis stops being "something that only happens inside one streaming request" and becomes a
// resumable job you can point at any product id: it finds the product's own offer URL (this is
// what P1 put the offers table there for), re-runs the pipeline, and moves the product through
// pending → analysing → done | failed.
//
// Callers:
//   - P3's add-by-paste flow will call this directly inside `after()` — no HTTP hop, no auth dance.
//   - POST /api/products/analyze wraps it for a user-triggered retry.
// It never throws: a failure is recorded as `failed` on the product so the UI can offer a retry.

import { db } from "../db";
import {
  getActiveProfileWithItems,
  getProductAnalysisTarget,
  getProductById,
  setAnalysisStatus,
} from "../db/queries/products";
import { ingestAnalysis } from "../ingest";
import { analyseIngredients, scrapeAndExtract } from "./pipeline";
import type { AnalysisStatus } from "../db/schema";

export type RunResult = { status: AnalysisStatus; reason?: string };

export async function runAnalysisForProduct(
  productId: string,
  opts: { force?: boolean } = {},
): Promise<RunResult> {
  const dbi = db();
  if (!dbi) return { status: "failed", reason: "db_not_configured" };

  const product = await getProductById(dbi, productId);
  if (!product) return { status: "failed", reason: "not_found" };

  // Already analysed? Do nothing — the whole point is to never pay twice. `force` is the retry.
  // This MUST come before resolving an offer URL: a done product doesn't need a URL to be done,
  // and demanding one here would report a perfectly analysed product as `failed`.
  if (product.analysisStatus === "done" && !opts.force) {
    const existing = await getActiveProfileWithItems(dbi, productId);
    if (existing) return { status: "done", reason: "already_analysed" };
  }

  // Only now do we need something to scrape.
  const target = await getProductAnalysisTarget(dbi, productId);
  if (!target) return { status: "failed", reason: "no_offer_url" };
  const { url } = target;

  await setAnalysisStatus(dbi, productId, "analysing");

  try {
    const extraction = await scrapeAndExtract(url);
    if (!extraction) {
      await setAnalysisStatus(dbi, productId, "failed");
      return { status: "failed", reason: "scrape_or_extract_failed" };
    }

    const analysis = await analyseIngredients({
      product_name: extraction.product_name,
      retailer: extraction.retailer,
      ingredients_list: extraction.ingredients_list,
      percentages: extraction.percentages ?? [],
    });

    // ingestAnalysis owns the canonical write: it upserts the product on canonical_key, records
    // the offer, caches the shared ingredient explanations, and stamps done + analysed_at.
    const ingested = await ingestAnalysis({
      product_name: extraction.product_name,
      retailer: extraction.retailer,
      url,
      ingredients: analysis.ingredients,
      product_summary: analysis.product_summary,
      nutrition: extraction.nutrition,
    });

    if (!ingested) {
      await setAnalysisStatus(dbi, productId, "failed");
      return { status: "failed", reason: "ingest_failed" };
    }

    // A placeholder product created before we knew its real name resolves to a DIFFERENT canonical
    // row once scraped. Leaving the placeholder 'analysing' forever would strand it, so mark it
    // done too — the list item that pointed at it still resolves, and the catalog now holds the
    // canonical row. (P3 repoints list items at `ingested.productId` when they differ.)
    if (ingested.productId !== productId) {
      await setAnalysisStatus(dbi, productId, "done");
    }

    return { status: "done" };
  } catch (err) {
    console.error("runAnalysisForProduct error:", err);
    await setAnalysisStatus(dbi, productId, "failed");
    return { status: "failed", reason: "pipeline_error" };
  }
}
