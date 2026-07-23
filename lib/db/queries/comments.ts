// Product discussion (Order G8). The thread is product-scoped and one level deep — a paper, not
// a forum (D-G7/G8 handoff §4). Community comments are opinion; the factual answer comes from
// Baloo's "Explain this" card (G8b), never from a vote on a comment.

import { and, eq, inArray, sql } from "drizzle-orm";
import type { Db } from "../index";
import { comments, profiles, votes } from "../schema";

export type CommentAuthor = { handle: string; displayName: string };
export type ThreadComment = {
  id: string;
  body: string;
  ts: string; // ISO
  author: CommentAuthor;
  votes: number;
  viewerVoted: boolean;
  hidden: boolean; // moderated or author-deleted → render a tombstone (G9)
  // Lets the client show the owner's Delete affordance. Null since S7a: the author deleted their
  // account, so the comment is an ownerless tombstone — no viewer id can ever match, which is right.
  authorId: string | null;
  replies: ThreadComment[]; // one level; always chronological
};

export type ThreadSort = "top" | "newest";

export async function getCommentCount(dbi: Db, productId: string): Promise<number> {
  const [row] = await dbi
    .select({ n: sql<number>`count(*)::int` })
    .from(comments)
    .where(eq(comments.productId, productId));
  return row?.n ?? 0;
}

// The whole thread for a product, hydrated (author + vote count + viewer's vote), bulk — no N+1.
export async function getThread(
  dbi: Db,
  productId: string,
  opts: { sort: ThreadSort; viewerId?: string | null },
): Promise<ThreadComment[]> {
  const rows = await dbi
    .select({ c: comments, handle: profiles.handle, displayName: profiles.displayName })
    .from(comments)
    .innerJoin(profiles, eq(profiles.id, comments.userId))
    .where(eq(comments.productId, productId));
  if (rows.length === 0) return [];

  // Bulk vote hydration for every comment in the thread.
  const ids = rows.map((r) => r.c.id);
  const countRows = await dbi
    .select({ targetId: votes.targetId, n: sql<number>`count(*)::int` })
    .from(votes)
    .where(and(eq(votes.targetType, "comment"), inArray(votes.targetId, ids)))
    .groupBy(votes.targetId);
  const counts = new Map(countRows.map((r) => [r.targetId, r.n]));
  const voted = opts.viewerId
    ? new Set(
        (
          await dbi
            .select({ targetId: votes.targetId })
            .from(votes)
            .where(
              and(
                eq(votes.userId, opts.viewerId),
                eq(votes.targetType, "comment"),
                inArray(votes.targetId, ids),
              ),
            )
        ).map((r) => r.targetId),
      )
    : new Set<string>();

  const toNode = (r: (typeof rows)[number]): ThreadComment => {
    const hidden = !!r.c.hiddenAt;
    return {
      id: r.c.id,
      // Tombstone: hidden content leaks neither its text nor its author.
      body: hidden ? "" : r.c.body,
      ts: r.c.createdAt.toISOString(),
      author: hidden
        ? { handle: "", displayName: "" }
        : { handle: r.handle, displayName: r.displayName },
      votes: hidden ? 0 : (counts.get(r.c.id) ?? 0),
      viewerVoted: hidden ? false : voted.has(r.c.id),
      hidden,
      authorId: r.c.userId,
      replies: [],
    };
  };

  const nodes = new Map(rows.map((r) => [r.c.id, toNode(r)]));
  const tops: { node: ThreadComment; ts: number }[] = [];
  for (const r of rows) {
    const node = nodes.get(r.c.id)!;
    if (r.c.parentId) {
      nodes.get(r.c.parentId)?.replies.push(node); // parent is always top-level (one-level cap)
    } else {
      tops.push({ node, ts: r.c.createdAt.getTime() });
    }
  }

  // Replies always chronological under their parent.
  for (const n of nodes.values())
    n.replies.sort((a, b) => Date.parse(a.ts) - Date.parse(b.ts));

  tops.sort((a, b) =>
    opts.sort === "top" ? b.node.votes - a.node.votes || b.ts - a.ts : b.ts - a.ts,
  );
  return tops.map((t) => t.node);
}

// Post a comment or a reply. One-level cap enforced here as the last line of defence.
export async function addComment(
  dbi: Db,
  input: { userId: string; productId: string; body: string; parentId?: string | null },
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (input.parentId) {
    const [parent] = await dbi
      .select({ id: comments.id, parentId: comments.parentId, productId: comments.productId })
      .from(comments)
      .where(eq(comments.id, input.parentId))
      .limit(1);
    if (!parent || parent.productId !== input.productId)
      return { ok: false, error: "bad_parent" };
    if (parent.parentId) return { ok: false, error: "no_nested_replies" };
  }
  const [row] = await dbi
    .insert(comments)
    .values({
      userId: input.userId,
      productId: input.productId,
      body: input.body,
      parentId: input.parentId ?? null,
    })
    .returning({ id: comments.id });
  return { ok: true, id: row.id };
}

// Soft moderation (Order G9). Reversible; the row stays for audit + thread structure.
export async function hideComment(dbi: Db, id: string, by: "author" | "moderator"): Promise<void> {
  await dbi
    .update(comments)
    .set({ hiddenAt: new Date(), hiddenBy: by })
    .where(eq(comments.id, id));
}

export async function unhideComment(dbi: Db, id: string): Promise<void> {
  await dbi.update(comments).set({ hiddenAt: null, hiddenBy: null }).where(eq(comments.id, id));
}

// Author self-delete: soft-hide, ownership enforced. Returns false if not the author's comment.
export async function deleteOwnComment(dbi: Db, id: string, userId: string): Promise<boolean> {
  const res = await dbi
    .update(comments)
    .set({ hiddenAt: new Date(), hiddenBy: "author" })
    .where(and(eq(comments.id, id), eq(comments.userId, userId)))
    .returning({ id: comments.id });
  return res.length > 0;
}

// Explain-this (G8b) grounding: product name + the comment being explained.
export async function getCommentForExplain(
  dbi: Db,
  commentId: string,
): Promise<{ productId: string; body: string } | null> {
  const [row] = await dbi
    .select({ productId: comments.productId, body: comments.body })
    .from(comments)
    .where(eq(comments.id, commentId))
    .limit(1);
  return row ?? null;
}
