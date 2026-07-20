import { NextResponse } from "next/server";
import { requireVerifiedUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { toggleVote, type VotableType } from "@/lib/db/queries/votes";
import { recordActivity } from "@/lib/db/queries/activity";

const VOTABLE: VotableType[] = ["product", "list", "comment"];

// Upvote toggle (Order G7). Single direction — there is no downvote, by design. An upvote is
// feed-worthy (voted activity row); removing one isn't (history is history).
export async function POST(req: Request) {
  const gate = await requireVerifiedUser();
  if ("error" in gate) return gate.error;
  const dbi = db();
  if (!dbi) return NextResponse.json({ error: "db_not_configured" }, { status: 503 });

  let body: { targetType?: string; targetId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const targetType = body.targetType as VotableType;
  if (!VOTABLE.includes(targetType) || !body.targetId) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const result = await toggleVote(dbi, gate.user.id, targetType, body.targetId);
  // Product/list upvotes are feed-worthy; a comment upvote is too light to be news.
  if (result.voted && targetType !== "comment") {
    await recordActivity(dbi, {
      actorId: gate.user.id,
      verb: "voted",
      objectType: targetType,
      objectId: body.targetId,
    });
  }
  return NextResponse.json(result);
}
