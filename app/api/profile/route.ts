import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getProfileByHandle, upsertProfile } from "@/lib/db/queries/profiles";

const HANDLE_RE = /^[a-z0-9-]{3,20}$/;

// Handle setup / profile update (Order G2) — the first authenticated write in the codebase and
// the template for every G4+ write: requireUser gate, validate, friendly JSON errors only.
export async function POST(req: Request) {
  const gate = await requireUser();
  if ("error" in gate) return gate.error;
  const { user } = gate;

  const dbi = db();
  if (!dbi) return NextResponse.json({ error: "db_not_configured" }, { status: 503 });

  let body: { handle?: string; displayName?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const handle = body.handle?.trim().toLowerCase() ?? "";
  if (!HANDLE_RE.test(handle)) {
    return NextResponse.json({ error: "invalid_handle" }, { status: 400 });
  }

  // Availability: the handle may be taken by someone else, but re-claiming your own is fine.
  const existing = await getProfileByHandle(dbi, handle);
  if (existing && existing.id !== user.id) {
    return NextResponse.json({ error: "handle_taken" }, { status: 409 });
  }

  const displayName =
    body.displayName?.trim() ||
    (user.user_metadata?.full_name as string | undefined) ||
    user.email?.split("@")[0] ||
    handle;

  try {
    const profile = await upsertProfile(dbi, { id: user.id, handle, displayName });
    return NextResponse.json({ profile });
  } catch (err) {
    // Unique-constraint race (two requests claiming one handle) lands here.
    console.error("profile upsert error:", err);
    return NextResponse.json({ error: "handle_taken" }, { status: 409 });
  }
}
