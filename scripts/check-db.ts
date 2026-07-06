// G1 check (dev): reads back everything the seed wrote and asserts the invariants — dedup
// convergence, label-order items, list ordering. Exit 0 = foundation healthy. Run: npm run db:check
import { config } from "dotenv";
config({ path: ".env.local" });

import { db } from "../lib/db";
import {
  getActiveProfileWithItems,
  getNutritionForProduct,
  getProductBySlugOrKey,
  upsertProductByCanonicalKey,
} from "../lib/db/queries/products";
import { getProfileByHandle } from "../lib/db/queries/profiles";
import { getListBySlug, getListsByOwner } from "../lib/db/queries/lists";

let failures = 0;
function check(label: string, ok: boolean, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
}

async function main() {
  const dbi = db();
  if (!dbi) {
    console.error("DATABASE_URL is not set — nothing to check.");
    process.exit(1);
  }

  const profile = await getProfileByHandle(dbi, "baloo-dev");
  check("profile readable by handle", !!profile, profile?.id);

  const product = await getProductBySlugOrKey(dbi, "oatly-oat-drink-barista-edition");
  check("product readable by slug", !!product, product?.name);

  if (product) {
    const again = await upsertProductByCanonicalKey(dbi, {
      canonicalKey: product.canonicalKey,
      slug: product.slug,
      name: product.name,
      source: "user_scan",
    });
    check("dedup: re-upsert converges on the same row", again.id === product.id);

    const active = await getActiveProfileWithItems(dbi, product.id);
    check("active ingredient profile present", !!active, `v${active?.version}`);
    check(
      "items in label order",
      !!active && active.items.map((i) => i.rank).join(",") === "1,2,3",
      active?.items.map((i) => i.name).join(" → "),
    );

    const nut = await getNutritionForProduct(dbi, product.id);
    check("nutrition present", !!nut && nut.nutrients.length > 0, `${nut?.nutrients.length} nutrients`);
  }

  const list = await getListBySlug(dbi, "dev-first-list");
  check("list readable by slug", !!list, list?.title);
  check(
    "list order = reordered (crisps first)",
    !!list && list.items[0]?.product.name.includes("Pringles"),
    list?.items.map((i) => `${i.position}. ${i.product.name}`).join(" | "),
  );

  if (profile) {
    const owned = await getListsByOwner(dbi, profile.id);
    check("lists by owner", owned.length >= 1, `${owned.length} list(s)`);
  }

  console.log(failures === 0 ? "\nDB CHECK OK" : `\nDB CHECK FAILED (${failures})`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("DB CHECK ERRORED:", err);
  process.exit(1);
});
