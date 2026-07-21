import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getPopularListsThisWeek } from "@/lib/db/queries/lists";

// Order L1b: feeds the homepage "Popular lists this week" strip. Saves-only signal (L6). Returns
// { lists: [] } without a DB or without signal — real numbers only, so the strip hides rather than
// faking a ranking. Load-time only, briefly cached (mirrors /api/board).
export async function GET() {
  const dbi = db();
  const lists = dbi ? await getPopularListsThisWeek(dbi, 8) : [];
  return NextResponse.json(
    { lists },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } },
  );
}
