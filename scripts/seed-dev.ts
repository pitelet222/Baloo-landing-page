// G1 seed (dev): writes one demo profile, two canonical products (one with a versioned
// ingredient profile + nutrition), and one public list with both — exercising every query
// helper. Idempotent: safe to re-run (upserts + existence checks). Run: npm run db:seed
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env.development.local" }); // vercel env pull target (Supabase integration vars)

import { db } from "../lib/db";
import { ingredientProfileItems, ingredientProfiles, nutrition } from "../lib/db/schema";
import {
  getProductBySlugOrKey,
  upsertProductByCanonicalKey,
} from "../lib/db/queries/products";
import { upsertProfile } from "../lib/db/queries/profiles";
import { addListItem, createList, getListBySlug, reorderListItems } from "../lib/db/queries/lists";

async function main() {
  const dbi = db();
  if (!dbi) {
    console.error("DATABASE_URL is not set in .env.local — create the Supabase project first (step B).");
    process.exit(1);
  }

  // 1 · demo profile (auth-less in G1; G2 ties profiles to auth.users)
  const profile = await upsertProfile(dbi, {
    handle: "baloo-dev",
    displayName: "Baloo Dev",
    bio: "Seed profile for local development.",
  });
  console.log("profile:", profile.handle, profile.id);

  // 2 · canonical product + DEDUP PROOF: same canonical_key twice must converge on one row
  const first = await upsertProductByCanonicalKey(dbi, {
    canonicalKey: "oatly:barista-edition:1l",
    slug: "oatly-oat-drink-barista-edition",
    name: "Oatly Oat Drink Barista Edition",
    brand: "Oatly",
    retailer: "Ocado",
    source: "user_scan",
  });
  const second = await upsertProductByCanonicalKey(dbi, {
    canonicalKey: "oatly:barista-edition:1l",
    slug: "oatly-oat-drink-barista-edition",
    name: "Oatly Oat Drink Barista Edition Long Life", // improved name on re-scan
    brand: "Oatly",
    source: "user_scan",
  });
  if (first.id !== second.id) throw new Error("DEDUP FAILED: two rows for one canonical_key");
  console.log("product (deduped):", second.name, second.id);

  // 3 · versioned ingredient profile + items + nutrition
  const [profileRow] = await dbi
    .insert(ingredientProfiles)
    .values({ productId: second.id, version: 1, isActive: true })
    .onConflictDoNothing()
    .returning();
  if (profileRow) {
    await dbi.insert(ingredientProfileItems).values([
      { profileId: profileRow.id, rank: 1, name: "Water", tag: "Natural", role: "Base", whyItsHere: "The liquid base the oats are blended into." },
      { profileId: profileRow.id, rank: 2, name: "Oats", tag: "Natural", role: "Base", percent: "10%", whyItsHere: "The defining ingredient — body and flavour." },
      { profileId: profileRow.id, rank: 3, name: "Rapeseed Oil", tag: "Processed", role: "Oil / fat", whyItsHere: "Creamy mouthfeel; helps the drink foam when steamed." },
    ]);
    await dbi
      .insert(nutrition)
      .values({
        productId: second.id,
        servingSize: null,
        per: "100g",
        nutrients: [
          { name: "Energy", per_100g: "61", per_serving: null, unit: "kcal" },
          { name: "Fat", per_100g: "3.0", per_serving: null, unit: "g" },
          { name: "Salt", per_100g: "0.10", per_serving: null, unit: "g" },
        ],
      })
      .onConflictDoNothing();
    console.log("ingredient profile v1 + 3 items + nutrition written");
  } else {
    console.log("ingredient profile v1 already present (idempotent re-run)");
  }

  // 4 · a second product so the list holds two
  const crisps = await upsertProductByCanonicalKey(dbi, {
    canonicalKey: "pringles:original:200g",
    slug: "pringles-original",
    name: "Pringles Original",
    brand: "Pringles",
    source: "user_scan",
  });

  // 5 · one public list with both products, reordered (exercises the list helpers)
  let list = await getListBySlug(dbi, "dev-first-list");
  if (!list) {
    const created = await createList(dbi, {
      ownerId: profile.id,
      title: "Dev: first board",
      slug: "dev-first-list",
      description: "Seed list proving the G1 foundation end to end.",
      isPublic: true,
    });
    await addListItem(dbi, created.id, second.id, "the barista one");
    await addListItem(dbi, created.id, crisps.id);
    await reorderListItems(dbi, created.id, [crisps.id, second.id]); // flip the order
    list = await getListBySlug(dbi, "dev-first-list");
  }
  console.log(
    "list:",
    list!.title,
    "→",
    list!.items.map((i) => `${i.position}. ${i.product.name}`).join(" | "),
  );

  console.log("\nSEED OK");
  process.exit(0);
}

main().catch((err) => {
  console.error("SEED FAILED:", err);
  process.exit(1);
});
