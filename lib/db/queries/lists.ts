// List queries (Order G1) — lists are the primary object of Phase 3. G4 (list pages/editor)
// consumes these; callers own the db() null-guard and, from G2 onward, the auth check that the
// acting user owns the list.

import { and, asc, desc, eq, max, sql } from "drizzle-orm";
import type { Db } from "../index";
import { listItems, lists, saves, products, type List, type ListItem, type Product } from "../schema";

export async function createList(
  dbi: Db,
  values: { ownerId: string; title: string; slug: string; description?: string; isPublic?: boolean; coverUrl?: string },
): Promise<List> {
  const [row] = await dbi
    .insert(lists)
    .values({
      ownerId: values.ownerId,
      title: values.title,
      slug: values.slug,
      description: values.description ?? null,
      isPublic: values.isPublic ?? false,
      coverUrl: values.coverUrl ?? null,
    })
    .returning();
  return row;
}

export async function updateList(
  dbi: Db,
  listId: string,
  patch: Partial<Pick<List, "title" | "description" | "isPublic" | "coverUrl">>,
): Promise<List | null> {
  const [row] = await dbi
    .update(lists)
    .set({ ...patch, updatedAt: sql`now()` })
    .where(eq(lists.id, listId))
    .returning();
  return row ?? null;
}

export async function deleteList(dbi: Db, listId: string): Promise<void> {
  await dbi.delete(lists).where(eq(lists.id, listId));
}

// Appends at the end (position = max + 1). The (list_id, product_id) unique index makes adding
// the same product twice a no-op conflict rather than a duplicate row.
export async function addListItem(
  dbi: Db,
  listId: string,
  productId: string,
  note?: string,
): Promise<ListItem | null> {
  const [{ maxPos }] = await dbi
    .select({ maxPos: max(listItems.position) })
    .from(listItems)
    .where(eq(listItems.listId, listId));
  const [row] = await dbi
    .insert(listItems)
    .values({ listId, productId, note: note ?? null, position: (maxPos ?? 0) + 1 })
    .onConflictDoNothing()
    .returning();
  await touch(dbi, listId);
  return row ?? null;
}

export async function removeListItem(dbi: Db, listId: string, productId: string): Promise<void> {
  await dbi
    .delete(listItems)
    .where(and(eq(listItems.listId, listId), eq(listItems.productId, productId)));
  await touch(dbi, listId);
}

export async function setListItemNote(
  dbi: Db,
  listId: string,
  productId: string,
  note: string | null,
): Promise<void> {
  await dbi
    .update(listItems)
    .set({ note })
    .where(and(eq(listItems.listId, listId), eq(listItems.productId, productId)));
  await touch(dbi, listId);
}

// Full reorder: caller sends the product ids in the desired order; positions are rewritten
// 1..n in one transaction so a dropped request can't leave a half-ordered list.
export async function reorderListItems(
  dbi: Db,
  listId: string,
  orderedProductIds: string[],
): Promise<void> {
  await dbi.transaction(async (tx) => {
    for (let i = 0; i < orderedProductIds.length; i++) {
      await tx
        .update(listItems)
        .set({ position: i + 1 })
        .where(and(eq(listItems.listId, listId), eq(listItems.productId, orderedProductIds[i])));
    }
  });
  await touch(dbi, listId);
}

export type ListWithItems = List & { items: (ListItem & { product: Product })[] };

export async function getListBySlug(dbi: Db, slug: string): Promise<ListWithItems | null> {
  const [list] = await dbi.select().from(lists).where(eq(lists.slug, slug)).limit(1);
  if (!list) return null;

  const rows = await dbi
    .select({ item: listItems, product: products })
    .from(listItems)
    .innerJoin(products, eq(listItems.productId, products.id))
    .where(eq(listItems.listId, list.id))
    .orderBy(asc(listItems.position));

  return { ...list, items: rows.map((r) => ({ ...r.item, product: r.product })) };
}

export async function getListsByOwner(dbi: Db, ownerId: string): Promise<List[]> {
  return dbi.select().from(lists).where(eq(lists.ownerId, ownerId)).orderBy(desc(lists.updatedAt));
}

export async function getListById(dbi: Db, id: string): Promise<List | null> {
  const [row] = await dbi.select().from(lists).where(eq(lists.id, id)).limit(1);
  return row ?? null;
}

export type ListWithCounts = List & { itemCount: number; saveCount: number };

// leftJoin + groupBy aggregate (one round-trip). count(distinct …) so the two joins don't
// multiply each other; ::int because count() is a bigint (returned as a string otherwise).
const itemCountExpr = sql<number>`count(distinct ${listItems.id})::int`;
const saveCountExpr = sql<number>`count(distinct ${saves.userId})::int`;

export async function getListsByOwnerWithCounts(dbi: Db, ownerId: string): Promise<ListWithCounts[]> {
  const rows = await dbi
    .select({ list: lists, itemCount: itemCountExpr, saveCount: saveCountExpr })
    .from(lists)
    .leftJoin(listItems, eq(listItems.listId, lists.id))
    .leftJoin(saves, eq(saves.listId, lists.id))
    .where(eq(lists.ownerId, ownerId))
    .groupBy(lists.id)
    .orderBy(desc(lists.updatedAt));
  return rows.map((r) => ({ ...r.list, itemCount: r.itemCount, saveCount: r.saveCount }));
}

// Public discovery feed (a minimal strip in G4; G5 expands it).
export async function getPublicListsRecent(dbi: Db, limit = 12): Promise<ListWithCounts[]> {
  const rows = await dbi
    .select({ list: lists, itemCount: itemCountExpr, saveCount: saveCountExpr })
    .from(lists)
    .leftJoin(listItems, eq(listItems.listId, lists.id))
    .leftJoin(saves, eq(saves.listId, lists.id))
    .where(eq(lists.isPublic, true))
    .groupBy(lists.id)
    .orderBy(desc(lists.updatedAt))
    .limit(limit);
  return rows.map((r) => ({ ...r.list, itemCount: r.itemCount, saveCount: r.saveCount }));
}

async function touch(dbi: Db, listId: string): Promise<void> {
  await dbi.update(lists).set({ updatedAt: sql`now()` }).where(eq(lists.id, listId));
}
