// Offers (Order P1): retailer listings of a product. The Product/Offer split means two retailers'
// listings of the same barcode are two offers on ONE product — powering dedup and "also available
// at" (P4). Callers own the db() null-guard.

import { desc, eq } from "drizzle-orm";
import type { Db } from "../index";
import { offers, type Offer } from "../schema";

export async function upsertOffer(
  dbi: Db,
  input: { productId: string; retailer?: string | null; url?: string | null },
): Promise<void> {
  await dbi
    .insert(offers)
    .values({
      productId: input.productId,
      retailer: input.retailer ?? null,
      url: input.url ?? null,
    })
    .onConflictDoNothing(); // (productId, retailer, url) unique — same listing seen twice is a no-op
}

export async function getOffersForProduct(dbi: Db, productId: string): Promise<Offer[]> {
  return dbi
    .select()
    .from(offers)
    .where(eq(offers.productId, productId))
    .orderBy(desc(offers.createdAt));
}
