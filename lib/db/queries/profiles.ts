// Profile queries (Order G1). G2 (auth) creates profiles on signup via upsertProfile; public
// profile pages (G5) read via getProfileByHandle.

import { eq } from "drizzle-orm";
import type { Db } from "../index";
import { profiles, type Profile } from "../schema";

export async function getProfileByHandle(dbi: Db, handle: string): Promise<Profile | null> {
  const [row] = await dbi.select().from(profiles).where(eq(profiles.handle, handle)).limit(1);
  return row ?? null;
}

export async function getProfileById(dbi: Db, id: string): Promise<Profile | null> {
  const [row] = await dbi.select().from(profiles).where(eq(profiles.id, id)).limit(1);
  return row ?? null;
}

// Id-conflict upsert: G2 calls this on signup/login with id = auth.users.id, so repeated
// sign-ins refresh the display fields without duplicating identity.
export async function upsertProfile(
  dbi: Db,
  values: { id?: string; handle: string; displayName: string; avatarUrl?: string; bio?: string },
): Promise<Profile> {
  const [row] = await dbi
    .insert(profiles)
    .values({
      ...(values.id ? { id: values.id } : {}),
      handle: values.handle,
      displayName: values.displayName,
      avatarUrl: values.avatarUrl ?? null,
      bio: values.bio ?? null,
    })
    .onConflictDoUpdate({
      target: profiles.id,
      set: { displayName: values.displayName, avatarUrl: values.avatarUrl ?? null },
    })
    .returning();
  return row;
}
