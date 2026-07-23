import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { deleteAccount } from "@/lib/account/delete";

// Account deletion (Order S7a) — GDPR right to erasure.
//
// requireUser, NOT requireVerifiedUser: a guest (anonymous) account is still a real auth.users row
// holding real data, so a guest must be able to erase themselves too. The gate proves identity, and
// the id comes from the SESSION — never from the body — so this can only ever delete the caller.
export async function DELETE() {
  const gate = await requireUser();
  if ("error" in gate) return gate.error;

  const result = await deleteAccount(gate.user.id);
  if (!result.ok) {
    console.error("account deletion failed:", result.reason);
    return NextResponse.json({ error: "delete_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
