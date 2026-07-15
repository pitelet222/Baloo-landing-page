import { NextResponse, after } from "next/server";
import { cacheGet } from "@/lib/cache";
import { hashUrl } from "@/lib/hash";
import { isSupportedUrl } from "@/lib/retailers";
import { MOCK_EXTRACT } from "@/lib/mock";
import { recordScan } from "@/lib/stats";
import { scrapeAndExtract } from "@/lib/analysis/pipeline";
import { storedAsCachedResult } from "@/lib/analysis/stored";
import { canonicalKey } from "@/lib/canonical";
import { db } from "@/lib/db";
import { getProductBySlugOrKey, getProductForPage } from "@/lib/db/queries/products";
import { upsertOffer } from "@/lib/db/queries/offers";
import { geolocation } from "@vercel/functions";

export const maxDuration = 60;

// Phase 1 of the flow: validate -> cache check -> Firecrawl -> Claude extract -> catalog check.
// Returns either a full result the client renders instantly (from the URL cache OR the catalog)
// or the header + ordered ingredient list for the streaming analyse step.
//
// TWO cache layers, each earning its place (Order P2):
//   L1  Redis, keyed by URL   — same URL          -> instant, ZERO API calls.
//   L2  Postgres, by identity — same PRODUCT, new URL -> skips the expensive per-ingredient
//       analyse and records the new retailer as an offer. Identity is only knowable AFTER
//       scraping, which is exactly why L2 lives here and not in Redis.
export async function POST(req: Request) {
  let url: string;
  try {
    ({ url } = await req.json());
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  if (!url || typeof url !== "string" || !isSupportedUrl(url)) {
    return NextResponse.json({ error: "unsupported_url" }, { status: 400 });
  }

  // Dev/design mode: return a canned extraction so the whole UI runs with no keys.
  // Gated on the key being ABSENT, so a stray MOCK_PIPELINE can never shadow a real
  // key. Pair with MOCK_PIPELINE in /api/analyze, which streams the matching cards.
  if (process.env.MOCK_PIPELINE && !process.env.ANTHROPIC_API_KEY) {
    await new Promise((r) => setTimeout(r, 600)); // lets you see "Reading ingredients…"
    return NextResponse.json(MOCK_EXTRACT);
  }

  const key = hashUrl(url);

  // L1 — full analysis already cached for this exact URL?
  const cached = await cacheGet(key);
  if (cached) {
    // A repeat scan is still a successful result — log it for the board without slowing the
    // instant cache response (after() runs the write once the response has been sent).
    const { country } = geolocation(req);
    after(() => recordScan({ product_name: cached.product_name, retailer: cached.retailer, country }));
    return NextResponse.json({ cached: true, source: "url", key, ...cached });
  }

  if (!process.env.FIRECRAWL_API_KEY || !process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "missing_keys" }, { status: 503 });
  }

  try {
    const object = await scrapeAndExtract(url);
    if (!object) {
      return NextResponse.json({ error: "scrape_failed" }, { status: 422 });
    }

    // L2 — do we already KNOW this product (from any retailer)? If its analysis is done, serve the
    // stored one and never pay for the analyse again. This is the Tesco -> Ocado payoff.
    const hit = await catalogHit(url, object.product_name);
    if (hit) {
      const { country } = geolocation(req);
      after(async () => {
        // This URL is a NEW OFFER on a product we already have.
        try {
          const dbi = db();
          if (dbi) await upsertOffer(dbi, { productId: hit.productId, retailer: object.retailer, url });
        } catch (err) {
          console.error("extract offer record error:", err);
        }
        await recordScan({ product_name: hit.result.product_name, retailer: object.retailer, country });
      });
      return NextResponse.json({ cached: true, source: "catalog", key, ...hit.result });
    }

    return NextResponse.json({ cached: false, key, url, ...object });
  } catch (err) {
    console.error("extract route error:", err);
    return NextResponse.json({ error: "extract_failed" }, { status: 500 });
  }
}

/** Identity lookup: a done product with this canonical key already carries a stored analysis. */
async function catalogHit(url: string, productName: string) {
  const dbi = db();
  if (!dbi || !productName) return null;
  try {
    const product = await getProductBySlugOrKey(dbi, canonicalKey({ name: productName }));
    if (!product || product.analysisStatus !== "done") return null;
    const data = await getProductForPage(dbi, product.slug);
    if (!data?.items.length) return null;
    return { productId: product.id, result: storedAsCachedResult(data, url) };
  } catch (err) {
    console.error("extract catalog lookup error (ignored):", err);
    return null; // never break the normal path over an optional optimisation
  }
}
