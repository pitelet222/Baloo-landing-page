// Account deletion (Order S7a) — GDPR right to erasure.
//
// The principle: ERASE THE PERSON, KEEP THE COMMUNITY. Everything that identifies the user goes;
// the public contributions they made to a shared space survive without their name on them, so one
// person leaving doesn't 404 other people's bookmarks or gut Discover.
//
// ORDER MATTERS in here — read before editing:
//   1. private lists are deleted while we still know who owns them (after step 3 the owner is NULL
//      and they'd be indistinguishable from an anonymised public list);
//   2. comments are scrubbed while we can still find them by user_id, for the same reason;
//   3. the auth user goes last. That single delete is the real erasure (email + password) and its
//      cascade clears profile, saves, follows, votes, activity and reports — while the two S7a
//      SET NULL foreign keys (migration 0008) preserve public lists and comment tombstones.

import { and, eq } from "drizzle-orm";
import { createClient } from "@supabase/supabase-js";
import { db } from "../db";
import { comments, lists } from "../db/schema";

export type DeleteResult = { ok: true } | { ok: false; reason: string };

export async function deleteAccount(userId: string): Promise<DeleteResult> {
  const dbi = db();
  if (!dbi) return { ok: false, reason: "db_not_configured" };

  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
  if (!url || !serviceKey) return { ok: false, reason: "auth_admin_not_configured" };

  // 1 · Private lists are personal, not community content — they leave with their owner. (Public
  //     ones are deliberately left to be anonymised by the SET NULL in step 3.)
  await dbi.delete(lists).where(and(eq(lists.ownerId, userId), eq(lists.isPublic, false)));

  // 2 · Comments: the BODY is the personal data, the ROW is thread structure. Clear the body and
  //     tombstone it with the same flags an author self-delete uses (G9), so replies underneath —
  //     other people's writing — keep their parent and stay readable.
  await dbi
    .update(comments)
    .set({ body: "", hiddenAt: new Date(), hiddenBy: "author" })
    .where(eq(comments.userId, userId));

  // 3 · The actual erasure. Deleting the auth user cascades to `profiles` (migration 0002) and from
  //     there to saves / follows / votes / activity / reports.
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { ok: false, reason: error.message };

  return { ok: true };
}
