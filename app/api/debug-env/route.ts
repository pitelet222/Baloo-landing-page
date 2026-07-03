import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

// TEMPORARY diagnostic (Phase 2 deploy). Reports whether the Upstash env vars reach the runtime
// and whether the exact write ops recordScan/cacheSet use actually succeed in prod. Returns no
// secrets — only booleans, lengths, and caught error strings. DELETE after diagnosis.
export async function GET() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  const out: Record<string, unknown> = {
    hasUrl: Boolean(url),
    urlLen: url?.length ?? 0,
    urlPrefix: url ? url.slice(0, 12) : null,
    hasToken: Boolean(token),
    tokenLen: token?.length ?? 0,
    hasAnthropic: Boolean(process.env.ANTHROPIC_API_KEY),
  };
  if (!url || !token) return NextResponse.json(out);

  const r = new Redis({ url, token });
  try {
    await r.set("baloo:dbg:s", "ok", { ex: 60 });
    out.setGet = await r.get("baloo:dbg:s");
  } catch (e) {
    out.setErr = String(e).slice(0, 220);
  }
  try {
    await r.lpush("baloo:dbg:l", { a: 1, ts: Date.now() });
    out.lrange = await r.lrange("baloo:dbg:l", 0, 0);
    await r.del("baloo:dbg:l");
  } catch (e) {
    out.lpushErr = String(e).slice(0, 220);
  }
  try {
    await r.zincrby("baloo:dbg:z", 1, "x");
    out.zrange = await r.zrange("baloo:dbg:z", 0, 0, { withScores: true });
    await r.del("baloo:dbg:z");
  } catch (e) {
    out.zErr = String(e).slice(0, 220);
  }
  return NextResponse.json(out);
}
