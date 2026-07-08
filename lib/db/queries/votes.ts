// Votes (Order G7). One rule from the D-G7/G8 handoff governs everything here: an upvote is
// AGREEMENT, not a rating — single direction, no downvote, and totals are community signal for
// ranking ("they aren't a verdict"). Comment votes join in G8.

import { and, eq, inArray, sql } from "drizzle-orm";
import type { Db } from "../index";
import { votes, type VoteTargetType } from "../schema";

export type VotableType = Extract<VoteTargetType, "product" | "list" | "comment">;

// Toggle semantics: first call upvotes, second removes. Returns the new state + live count.
export async function toggleVote(
  dbi: Db,
  userId: string,
  targetType: VoteTargetType,
  targetId: string,
): Promise<{ voted: boolean; count: number }> {
  const existing = await dbi
    .select({ id: votes.id })
    .from(votes)
    .where(
      and(eq(votes.userId, userId), eq(votes.targetType, targetType), eq(votes.targetId, targetId)),
    )
    .limit(1);

  if (existing.length > 0) {
    await dbi.delete(votes).where(eq(votes.id, existing[0].id));
  } else {
    await dbi
      .insert(votes)
      .values({ userId, targetType, targetId, value: 1 })
      .onConflictDoNothing(); // double-submit race → no dup (unique user+target)
  }

  return {
    voted: existing.length === 0,
    count: await getVoteCount(dbi, targetType, targetId),
  };
}

export async function getVoteCount(
  dbi: Db,
  targetType: VoteTargetType,
  targetId: string,
): Promise<number> {
  const [row] = await dbi
    .select({ n: sql<number>`count(*)::int` })
    .from(votes)
    .where(and(eq(votes.targetType, targetType), eq(votes.targetId, targetId)));
  return row?.n ?? 0;
}

export async function hasVoted(
  dbi: Db,
  userId: string,
  targetType: VoteTargetType,
  targetId: string,
): Promise<boolean> {
  const [row] = await dbi
    .select({ one: sql<number>`1` })
    .from(votes)
    .where(
      and(eq(votes.userId, userId), eq(votes.targetType, targetType), eq(votes.targetId, targetId)),
    )
    .limit(1);
  return !!row;
}

// Bulk counts for ranked surfaces (targetIds of one type).
export async function getVoteCounts(
  dbi: Db,
  targetType: VoteTargetType,
  targetIds: string[],
): Promise<Map<string, number>> {
  if (targetIds.length === 0) return new Map();
  const rows = await dbi
    .select({ targetId: votes.targetId, n: sql<number>`count(*)::int` })
    .from(votes)
    .where(and(eq(votes.targetType, targetType), inArray(votes.targetId, targetIds)))
    .groupBy(votes.targetId);
  return new Map(rows.map((r) => [r.targetId, r.n]));
}

// Bulk "which of these did the viewer upvote" — SSR hydration for many targets at once (G8).
export async function getVotedTargetIds(
  dbi: Db,
  userId: string,
  targetType: VoteTargetType,
  targetIds: string[],
): Promise<Set<string>> {
  if (targetIds.length === 0) return new Set();
  const rows = await dbi
    .select({ targetId: votes.targetId })
    .from(votes)
    .where(
      and(
        eq(votes.userId, userId),
        eq(votes.targetType, targetType),
        inArray(votes.targetId, targetIds),
      ),
    );
  return new Set(rows.map((r) => r.targetId));
}
