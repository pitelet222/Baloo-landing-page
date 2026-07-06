// Product queries (Order G1). All helpers take the Db instance explicitly — callers own the
// null-guard (`const dbi = db(); if (!dbi) ...`), keeping "database optional" visible at the
// call site. G3's ingestion and product page consume these.

import { and, eq, or } from "drizzle-orm";
import type { Db } from "../index";
import {
  ingredientProfileItems,
  ingredientProfiles,
  nutrition,
  products,
  type IngredientProfileItem,
  type NewProduct,
  type Product,
} from "../schema";

// THE dedup invariant: everyone ingesting the same real-world product converges on one row.
// Conflict on canonical_key refreshes the descriptive fields (name/brand/image may improve
// between scans) but never changes identity.
export async function upsertProductByCanonicalKey(
  dbi: Db,
  values: NewProduct,
): Promise<Product> {
  const [row] = await dbi
    .insert(products)
    .values(values)
    .onConflictDoUpdate({
      target: products.canonicalKey,
      set: {
        name: values.name,
        brand: values.brand ?? null,
        retailer: values.retailer ?? null,
        barcode: values.barcode ?? null,
        imageUrl: values.imageUrl ?? null,
      },
    })
    .returning();
  return row;
}

export async function getProductBySlugOrKey(dbi: Db, slugOrKey: string): Promise<Product | null> {
  const [row] = await dbi
    .select()
    .from(products)
    .where(or(eq(products.slug, slugOrKey), eq(products.canonicalKey, slugOrKey)))
    .limit(1);
  return row ?? null;
}

// The product page's main read: the ACTIVE ingredient profile + its items in label order.
export async function getActiveProfileWithItems(
  dbi: Db,
  productId: string,
): Promise<{ profileId: string; version: number; items: IngredientProfileItem[] } | null> {
  const [profile] = await dbi
    .select()
    .from(ingredientProfiles)
    .where(and(eq(ingredientProfiles.productId, productId), eq(ingredientProfiles.isActive, true)))
    .limit(1);
  if (!profile) return null;

  const items = await dbi
    .select()
    .from(ingredientProfileItems)
    .where(eq(ingredientProfileItems.profileId, profile.id))
    .orderBy(ingredientProfileItems.rank);

  return { profileId: profile.id, version: profile.version, items };
}

export async function getNutritionForProduct(dbi: Db, productId: string) {
  const [row] = await dbi.select().from(nutrition).where(eq(nutrition.productId, productId)).limit(1);
  return row ?? null;
}
