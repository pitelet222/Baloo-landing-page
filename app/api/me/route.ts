import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getProfileById } from "@/lib/db/queries/profiles";

// Who am I? (Order G2) — the client's useAuth hook polls this after every auth state change.
// Never errors: signed-out / unconfigured environments just return nulls.
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ user: null, profile: null });

  const dbi = db();
  const profile = dbi ? await getProfileById(dbi, user.id) : null;

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email ?? null,
      isAnonymous: user.is_anonymous ?? false,
    },
    profile,
  });
}
