import { NextResponse } from "next/server";
import { getBoard } from "@/lib/stats";

// Order D: feeds the homepage board. getBoard() is a silent empty result without Upstash, so
// this route never fails — a fresh deploy just serves the inviting empty state. Briefly cached
// per the design handoff (the board is load-time only, no polling).
export async function GET() {
  const board = await getBoard();
  return NextResponse.json(
    { ...board, showTopScanners: process.env.SHOW_TOP_SCANNERS === "true" },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } },
  );
}
