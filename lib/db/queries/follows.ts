// Social graph (Order G6): follow/unfollow + the reads the profile page and feed need.
// Callers own the db() null-guard and auth (requireUser); self-follow is rejected here as the
// last line of defence.

import { and, desc, eq, inArray, notInArray, sql } from "drizzle-orm";
import type { Db } from "../index";
import { activity, follows, lists, profiles, type Profile } from "../schema";

export async function followUser(dbi: Db, followerId: string, followingId: string): Promise<boolean> {
  if (followerId === followingId) return false;
  await dbi.insert(follows).values({ followerId, followingId }).onConflictDoNothing();
  return true;
}

export async function unfollowUser(dbi: Db, followerId: string, followingId: string): Promise<void> {
  await dbi
    .delete(follows)
    .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
}

export async function isFollowing(dbi: Db, followerId: string, followingId: string): Promise<boolean> {
  const [row] = await dbi
    .select({ one: sql<number>`1` })
    .from(follows)
    .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)))
    .limit(1);
  return !!row;
}

export async function getFollowingIds(dbi: Db, followerId: string): Promise<string[]> {
  const rows = await dbi
    .select({ id: follows.followingId })
    .from(follows)
    .where(eq(follows.followerId, followerId));
  return rows.map((r) => r.id);
}

export async function getFollowCounts(
  dbi: Db,
  profileId: string,
): Promise<{ followers: number; following: number }> {
  const [f1] = await dbi
    .select({ n: sql<number>`count(*)::int` })
    .from(follows)
    .where(eq(follows.followingId, profileId));
  const [f2] = await dbi
    .select({ n: sql<number>`count(*)::int` })
    .from(follows)
    .where(eq(follows.followerId, profileId));
  return { followers: f1?.n ?? 0, following: f2?.n ?? 0 };
}

export type SuggestedCurator = Profile & { publicLists: number; followers: number };

// Empty-state suggestions (D-G6 §5): recently active curators with public lists, excluding
// yourself and anyone you already follow. Source-agnostic per the handoff — an editorial or
// popularity signal can replace this query without touching the UI.
export async function getSuggestedCurators(
  dbi: Db,
  userId: string | null,
  limit = 5,
): Promise<SuggestedCurator[]> {
  const exclude: string[] = [];
  if (userId) {
    exclude.push(userId);
    exclude.push(...(await getFollowingIds(dbi, userId)));
  }

  const recentActors = dbi
    .select({ actorId: activity.actorId })
    .from(activity)
    .orderBy(desc(activity.createdAt))
    .limit(200);

  const rows = await dbi
    .select({
      profile: profiles,
      publicLists: sql<number>`count(distinct ${lists.id})::int`,
      followers: sql<number>`(select count(*)::int from ${follows} f where f.following_id = ${profiles.id})`,
    })
    .from(profiles)
    .innerJoin(lists, and(eq(lists.ownerId, profiles.id), eq(lists.isPublic, true)))
    .where(
      and(
        inArray(profiles.id, recentActors),
        exclude.length ? notInArray(profiles.id, exclude) : undefined,
      ),
    )
    .groupBy(profiles.id)
    .limit(limit);

  return rows.map((r) => ({ ...r.profile, publicLists: r.publicLists, followers: r.followers }));
}
