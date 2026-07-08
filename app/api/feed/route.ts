import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getFeed } from "@/lib/db/queries/feed";

// The feed's load-more endpoint (Order G6). ?before=<ISO timestamp> pages older activity.
export async function GET(req: Request) {
  const gate = await requireUser();
  if ("error" in gate) return gate.error;
  const dbi = db();
  if (!dbi) return NextResponse.json({ articles: [], nextBefore: null });

  const beforeParam = new URL(req.url).searchParams.get("before");
  const before = beforeParam ? new Date(beforeParam) : undefined;
  const page = await getFeed(dbi, gate.user.id, {
    before: before && !isNaN(before.getTime()) ? before : undefined,
  });
  return NextResponse.json(page);
}
