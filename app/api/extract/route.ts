import { NextResponse, after } from "next/server";
import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { extractionSchema } from "@/lib/schema";
import { scrapeMarkdown } from "@/lib/firecrawl";
import { cacheGet } from "@/lib/cache";
import { hashUrl } from "@/lib/hash";
import { extractionPrompt } from "@/lib/prompts";
import { isSupportedUrl } from "@/lib/retailers";
import { MODEL } from "@/lib/config";
import { MOCK_EXTRACT } from "@/lib/mock";
import { recordScan } from "@/lib/stats";
import { geolocation } from "@vercel/functions";

export const maxDuration = 60;

// Phase 1 of the flow: validate -> cache check -> Firecrawl -> Claude extract.
// Returns either a full cached result (client renders instantly) or the header
// + ordered ingredient list for the streaming analyse step.
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

  // Full analysis already cached for this URL?
  const cached = await cacheGet(key);
  if (cached) {
    // A repeat scan is still a successful result — log it for the board without slowing the
    // instant cache response (after() runs the write once the response has been sent).
    const { country } = geolocation(req);
    after(() => recordScan({ product_name: cached.product_name, retailer: cached.retailer, country }));
    return NextResponse.json({ cached: true, key, ...cached });
  }

  if (!process.env.FIRECRAWL_API_KEY || !process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "missing_keys" }, { status: 503 });
  }

  try {
    const markdown = await scrapeMarkdown(url);
    if (!markdown) {
      return NextResponse.json({ error: "scrape_failed" }, { status: 422 });
    }

    const { object } = await generateObject({
      model: anthropic(MODEL),
      schema: extractionSchema,
      prompt: extractionPrompt(markdown),
    });

    if (!object.ingredients_list || object.ingredients_list.length === 0) {
      return NextResponse.json({ error: "no_ingredients" }, { status: 422 });
    }

    return NextResponse.json({ cached: false, key, url, ...object });
  } catch (err) {
    console.error("extract route error:", err);
    return NextResponse.json({ error: "extract_failed" }, { status: 500 });
  }
}
