// The home feed (Order G6) — chronological activity of the people you follow, hydrated for the
// D-G6 "morning paper" rendering. Aggregation is read-time: added_item rows by the same actor to
// the same list on the same day collapse into one "added N products" article.

import { and, desc, eq, inArray, lt, sql } from "drizzle-orm";
import type { Db } from "../index";
import { activity, listItems, lists, products, profiles } from "../schema";
import { getFollowingIds } from "./follows";

export type FeedActor = { handle: string; displayName: string };
export type FeedListRef = { slug: string; title: string; isPublic: boolean };
export type FeedProductRef = { slug: string; name: string; brand: string | null };

export type FeedArticle =
  | {
      kind: "created_list";
      ts: string; // ISO
      actor: FeedActor;
      list: FeedListRef & { description: string | null; itemCount: number };
    }
  | {
      kind: "added_items";
      ts: string;
      actor: FeedActor;
      list: FeedListRef;
      products: FeedProductRef[]; // may be empty for pre-G6 rows (meta-less) → count-only copy
      count: number;
    }
  | {
      // Byline-only (D-G6 §3b / Order G7): votes stay quiet or the feed becomes a scoreboard.
      kind: "voted";
      ts: string;
      actor: FeedActor;
      targets: { type: "product" | "list"; name: string; slug: string }[];
    };

export type FeedPage = { articles: FeedArticle[]; nextBefore: string | null };

const RAW_BATCH = 60; // raw activity rows per fetch; aggregation compresses to articles

export async function getFeed(
  dbi: Db,
  userId: string,
  opts: { before?: Date; limit?: number } = {},
): Promise<FeedPage> {
  const limit = opts.limit ?? 15;
  const followingIds = await getFollowingIds(dbi, userId);
  if (followingIds.length === 0) return { articles: [], nextBefore: null };

  const conditions = [
    inArray(activity.actorId, followingIds),
    inArray(activity.verb, ["created_list", "added_item", "voted"]),
    ...(opts.before ? [lt(activity.createdAt, opts.before)] : []),
  ];

  const rows = await dbi
    .select({ act: activity, actor: profiles })
    .from(activity)
    .innerJoin(profiles, eq(profiles.id, activity.actorId))
    .where(and(...conditions))
    .orderBy(desc(activity.createdAt))
    .limit(RAW_BATCH);

  // Hydrate referenced lists + products in two bulk lookups. voted rows reference either type
  // via objectType; list-verbs always reference a list.
  const listIds = [
    ...new Set(
      rows
        .filter((r) => r.act.verb !== "voted" || r.act.objectType === "list")
        .map((r) => r.act.objectId),
    ),
  ];
  const listRows = listIds.length
    ? await dbi.select().from(lists).where(inArray(lists.id, listIds))
    : [];
  const listMap = new Map(listRows.map((l) => [l.id, l]));

  const productIds = [
    ...new Set([
      ...rows.map((r) => r.act.meta?.productId).filter((x): x is string => !!x),
      ...rows
        .filter((r) => r.act.verb === "voted" && r.act.objectType === "product")
        .map((r) => r.act.objectId),
    ]),
  ];
  const productRows = productIds.length
    ? await dbi.select().from(products).where(inArray(products.id, productIds))
    : [];
  const productMap = new Map(productRows.map((p) => [p.id, p]));

  // Item counts for created_list cards — one grouped query for every referenced list.
  const countRows = listIds.length
    ? await dbi
        .select({ listId: listItems.listId, n: sql<number>`count(*)::int` })
        .from(listItems)
        .where(inArray(listItems.listId, listIds))
        .groupBy(listItems.listId)
    : [];
  const itemCounts = new Map(countRows.map((r) => [r.listId, r.n]));

  const articles: FeedArticle[] = [];
  const addGroups = new Map<string, FeedArticle & { kind: "added_items" }>();
  const voteGroups = new Map<string, FeedArticle & { kind: "voted" }>();
  let oldest: Date | null = null;

  for (const { act, actor } of rows) {
    oldest = act.createdAt;
    const actorRef = { handle: actor.handle, displayName: actor.displayName };

    // Votes: byline-only, aggregated per actor+day (G7).
    if (act.verb === "voted") {
      let target: { type: "product" | "list"; name: string; slug: string } | null = null;
      if (act.objectType === "product") {
        const p = productMap.get(act.objectId);
        if (p) target = { type: "product", name: p.name, slug: p.slug };
      } else if (act.objectType === "list") {
        const l = listMap.get(act.objectId);
        if (l && (l.isPublic || l.ownerId === userId)) {
          target = { type: "list", name: l.title, slug: l.slug };
        }
      }
      if (!target) continue;
      const day = act.createdAt.toISOString().slice(0, 10);
      const key = `${actor.handle}:${day}`;
      let group = voteGroups.get(key);
      if (!group) {
        group = { kind: "voted", ts: act.createdAt.toISOString(), actor: actorRef, targets: [] };
        voteGroups.set(key, group);
        articles.push(group);
      }
      if (!group.targets.some((t) => t.slug === target!.slug)) group.targets.push(target);
      if (articles.length >= limit) break;
      continue;
    }

    const list = listMap.get(act.objectId);
    if (!list) continue; // deleted since — skip silently
    if (!list.isPublic && list.ownerId !== userId) continue; // never leak private lists

    const listRef = { slug: list.slug, title: list.title, isPublic: list.isPublic };

    if (act.verb === "created_list") {
      articles.push({
        kind: "created_list",
        ts: act.createdAt.toISOString(),
        actor: actorRef,
        list: {
          ...listRef,
          description: list.description,
          itemCount: itemCounts.get(list.id) ?? 0,
        },
      });
    } else {
      // Aggregate per actor+list+day (read-time; D-G6 open question 1).
      const day = act.createdAt.toISOString().slice(0, 10);
      const key = `${actor.handle}:${list.id}:${day}`;
      let group = addGroups.get(key);
      if (!group) {
        group = {
          kind: "added_items",
          ts: act.createdAt.toISOString(), // newest in group (rows arrive newest-first)
          actor: actorRef,
          list: listRef,
          products: [],
          count: 0,
        };
        addGroups.set(key, group);
        articles.push(group);
      }
      group.count++;
      const product = act.meta?.productId ? productMap.get(act.meta.productId) : undefined;
      if (product && !group.products.some((p) => p.slug === product.slug)) {
        group.products.push({ slug: product.slug, name: product.name, brand: product.brand });
      }
    }
    if (articles.length >= limit) break;
  }

  const hasMore = rows.length === RAW_BATCH || articles.length >= limit;
  return {
    articles,
    nextBefore: hasMore && oldest ? oldest.toISOString() : null,
  };
}
