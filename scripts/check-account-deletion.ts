// S7a verification: prove account deletion erases the PERSON and keeps the COMMUNITY.
//
// Builds a throwaway account with a public list, a private list, and a comment that ANOTHER user has
// replied to; deletes the account; then asserts the outcome. Cleans up whatever it can regardless.
// Read-only against real data — it only touches rows it created.
//
//   npx -y tsx scripts/check-account-deletion.ts
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env.development.local" });

import { createClient } from "@supabase/supabase-js";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "../lib/db";
import { comments, lists, saves } from "../lib/db/schema";
import { upsertProfile, getProfileById, getProfileByHandle } from "../lib/db/queries/profiles";
import { createList, getListBySlug } from "../lib/db/queries/lists";
import { getRecentProducts } from "../lib/db/queries/products";
import { deleteAccount } from "../lib/account/delete";

let pass = 0;
let fail = 0;
function check(label: string, ok: boolean, detail = "") {
  if (ok) {
    pass++;
    console.log(`  ✓ ${label}`);
  } else {
    fail++;
    console.error(`  ✗ ${label} ${detail}`);
  }
}

async function main() {
  const dbi = db();
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
  if (!dbi || !url || !serviceKey) {
    console.error("Needs DATABASE_URL + SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  const stamp = Date.now();
  const email = `s7a-test-${stamp}@baloo.life`;
  const handle = `s7a-test-${stamp}`;
  const publicSlug = `s7a-public-${stamp}`;
  const privateSlug = `s7a-private-${stamp}`;

  // A second, surviving user to own the reply — the whole point of the comment tombstone.
  const replier = await getProfileByHandle(dbi, "baloo-friend");
  const [product] = await getRecentProducts(dbi, 1);
  if (!replier || !product) {
    console.error("Needs the dev seed (a @baloo-friend profile + at least one product). Run npm run db:seed.");
    process.exit(1);
  }

  console.log("Setting up a throwaway account…");
  const { data: created, error: cErr } = await admin.auth.admin.createUser({ email, email_confirm: true });
  if (cErr || !created.user) throw cErr ?? new Error("createUser failed");
  const userId = created.user.id;
  await upsertProfile(dbi, { id: userId, handle, displayName: "S7a Test", bio: "throwaway" });

  const pub = await createList(dbi, { ownerId: userId, title: "S7a public", slug: publicSlug, isPublic: true });
  const priv = await createList(dbi, { ownerId: userId, title: "S7a private", slug: privateSlug, isPublic: false });

  const [victimComment] = await dbi
    .insert(comments)
    .values({ userId, productId: product.id, body: "personal data that must not survive" })
    .returning({ id: comments.id });
  const [reply] = await dbi
    .insert(comments)
    .values({ userId: replier.id, productId: product.id, parentId: victimComment.id, body: "someone else's reply" })
    .returning({ id: comments.id });
  // a personal signal that SHOULD be cascaded away
  await dbi.insert(saves).values({ userId, listId: pub.id }).onConflictDoNothing();

  console.log(`\nDeleting the account (${handle})…`);
  const res = await deleteAccount(userId);
  check("deleteAccount reported success", res.ok, JSON.stringify(res));

  console.log("\nAsserting outcome:");

  // ── The community survives ──────────────────────────────────────────────────────────────────
  const pubAfter = await getListBySlug(dbi, publicSlug);
  check("public list still exists", !!pubAfter);
  check("public list is now ownerless (owner_id IS NULL)", pubAfter?.ownerId === null, `got ${pubAfter?.ownerId}`);

  const survivingReply = await dbi.select().from(comments).where(eq(comments.id, reply.id));
  check("the OTHER user's reply survives", survivingReply.length === 1);

  const [victimAfter] = await dbi.select().from(comments).where(eq(comments.id, victimComment.id));
  check("deleted user's comment row survives as a tombstone", !!victimAfter);
  check("…its body is scrubbed", victimAfter?.body === "", `got "${victimAfter?.body}"`);
  check("…it is marked hidden by the author", victimAfter?.hiddenBy === "author");
  check("…its author link is nulled", victimAfter?.userId === null, `got ${victimAfter?.userId}`);

  // ── The person is erased ────────────────────────────────────────────────────────────────────
  const privAfter = await getListBySlug(dbi, privateSlug);
  check("private list is gone", !privAfter);

  const profileAfter = await getProfileById(dbi, userId);
  check("profile row is gone", !profileAfter);

  const savesAfter = await dbi.select().from(saves).where(eq(saves.userId, userId));
  check("saves are gone", savesAfter.length === 0);

  const { data: userList } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  check("auth user is gone", !userList.users.some((u) => u.id === userId));

  // ── Cleanup: the ownerless public list + the reply we created ────────────────────────────────
  console.log("\nCleaning up test rows…");
  await dbi.delete(comments).where(eq(comments.id, reply.id));
  await dbi.delete(comments).where(eq(comments.id, victimComment.id));
  await dbi.delete(lists).where(and(eq(lists.slug, publicSlug), isNull(lists.ownerId)));
  const leftover = await getListBySlug(dbi, publicSlug);
  check("test public list cleaned up", !leftover);

  console.log(`\n${fail === 0 ? "ALL CHECKS PASSED" : "FAILURES PRESENT"} — ${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("CHECK FAILED:", err);
  process.exit(1);
});
