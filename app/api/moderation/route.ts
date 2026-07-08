import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { hideComment, unhideComment } from "@/lib/db/queries/comments";
import { updateList } from "@/lib/db/queries/lists";
import { resolveReportsForTarget } from "@/lib/db/queries/reports";
import type { ReportTargetType } from "@/lib/db/schema";

type Action = "hide" | "unhide" | "dismiss";

// Admin moderation actions (Order G9). Admin-only. hide → remove content + close its reports;
// dismiss → mark reports reviewed (content stays); unhide → restore.
export async function POST(req: Request) {
  const gate = await requireAdmin();
  if ("error" in gate) return gate.error;
  const dbi = db();
  if (!dbi) return NextResponse.json({ error: "db_not_configured" }, { status: 503 });

  let body: { action?: Action; targetType?: string; targetId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const { action } = body;
  const targetType = body.targetType as ReportTargetType;
  if (
    !body.targetId ||
    !["comment", "list"].includes(targetType) ||
    !["hide", "unhide", "dismiss"].includes(action ?? "")
  ) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  if (action === "dismiss") {
    await resolveReportsForTarget(dbi, targetType, body.targetId, "reviewed");
    return NextResponse.json({ ok: true });
  }

  if (action === "hide") {
    if (targetType === "comment") await hideComment(dbi, body.targetId, "moderator");
    else await updateList(dbi, body.targetId, { isPublic: false });
    await resolveReportsForTarget(dbi, targetType, body.targetId, "actioned");
    return NextResponse.json({ ok: true });
  }

  // unhide (restore) — comments only; a list is re-published by its owner.
  if (targetType === "comment") await unhideComment(dbi, body.targetId);
  return NextResponse.json({ ok: true });
}
