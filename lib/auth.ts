// Server-side auth helpers (Order G2) — the gate every Phase 3 write hangs off (G4 lists, G7
// votes, G8 comments...). Reads stay public; writes call requireUser().

import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { supabaseServer } from "./supabase/server";
import { db } from "./db";
import { getProfileById } from "./db/queries/profiles";
import type { Profile } from "./db/schema";

export async function getSessionUser(): Promise<User | null> {
  const sb = await supabaseServer();
  if (!sb) return null;
  const { data } = await sb.auth.getUser();
  return data.user ?? null;
}

// Route-handler guard. Usage:
//   const gate = await requireUser();
//   if ("error" in gate) return gate.error;
//   const { user } = gate;
export async function requireUser(): Promise<{ user: User } | { error: NextResponse }> {
  const user = await getSessionUser();
  if (!user) {
    return { error: NextResponse.json({ error: "auth_required" }, { status: 401 }) };
  }
  return { user };
}

// The signed-in user's public profile row, or null (signed out, DB unconfigured, or the
// handle-setup step hasn't happened yet — /welcome handles that case).
export async function getCurrentProfile(): Promise<{ user: User; profile: Profile | null } | null> {
  const user = await getSessionUser();
  if (!user) return null;
  const dbi = db();
  const profile = dbi ? await getProfileById(dbi, user.id) : null;
  return { user, profile };
}
