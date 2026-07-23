// L4 — seed SUPPLY (official accounts + genuinely curated lists).
//
// The locked decision: solve cold-start by seeding supply, NEVER by faking demand. This script
// therefore creates accounts, lists and real analysed products — and never writes a save, a follow
// or a vote. A list seeded here shows 0 saves until a real person saves it.
//
// It also never invents analysis: every product goes through the SAME pipeline a user's paste does
// (Firecrawl scrape → Claude extract → Claude analyse → ingest), so seeded lists carry real,
// label-derived breakdowns. That costs money, which is why this script is DRY BY DEFAULT.
//
//   npm run db:seed-supply           # dry run — prints the plan + spend estimate, writes nothing
//   npm run db:seed-supply -- --commit   # actually creates accounts, analyses products, builds lists
//
// Idempotent: existing accounts and lists are skipped. Each list's products are analysed BEFORE the
// list is created, so a failure part-way leaves no half-built list and a re-run retries cleanly
// (re-analysis dedups on canonical_key, so it costs tokens but never duplicates rows).
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env.development.local" });

import { createClient } from "@supabase/supabase-js";
import { db } from "../lib/db";
import { upsertProfile, getProfileByHandle } from "../lib/db/queries/profiles";
import { addListItem, createList, getListBySlug } from "../lib/db/queries/lists";
import { scrapeAndExtract, analyseIngredients } from "../lib/analysis/pipeline";
import { ingestAnalysis } from "../lib/ingest";
import { isSupportedUrl } from "../lib/retailers";

const COMMIT = process.argv.includes("--commit");

// ── The official accounts ──────────────────────────────────────────────────────────────────────
// Created WITHOUT a password on purpose: this script never handles credentials. Supabase makes a
// confirmed, password-less user; set each password from the Supabase dashboard (or have the account
// use a reset link) before anyone signs in as them.
const ACCOUNTS = [
  { handle: "baloo", email: "hello@baloo.life", displayName: "Baloo", bio: "Know what's in your food." },
  { handle: "balooteam", email: "team@baloo.life", displayName: "The Baloo Team", bio: "Lists from the people building Baloo." },
  { handle: "proteinpicks", email: "proteinpicks@baloo.life", displayName: "Protein Picks", bio: "High-protein everyday food, read label-first." },
  { handle: "kidslunchbox", email: "kidslunchbox@baloo.life", displayName: "Kids' Lunchbox", bio: "Snacks and staples for school lunches." },
] as const;

type Seed = {
  owner: (typeof ACCOUNTS)[number]["handle"];
  title: string;
  slug: string;
  description: string;
  /** Product URLs from a SUPPORTED retailer (Whole Foods · Ocado · Tesco · Target · Kroger). */
  products: string[];
};

// ── The curated lists ──────────────────────────────────────────────────────────────────────────
// Themes are locked (launch plan); the PRODUCTS are an editorial call — fill each `products` array
// with real product URLs from a supported retailer. A dry run reports any list still empty.
//
// NOTE: the plan's fifth list, "Mercadona essentials", is NOT here: Mercadona is not in
// SUPPORTED_RETAILERS (Whole Foods · Ocado · Tesco · Target · Kroger), so its URLs would be rejected
// by validation and by /api/extract. It needs mercadona.es added to the retailer set first
// (Tier C, "more scrape sites") — tracked as a follow-up rather than silently dropped.
const LISTS: Seed[] = [
  {
    owner: "proteinpicks",
    title: "Best protein yogurts",
    slug: "best-protein-yogurts",
    description: "High-protein yogurts worth the shelf space — what's actually in each one.",
    products: [],
  },
  {
    owner: "balooteam",
    title: "Cereals I'd buy again",
    slug: "cereals-id-buy-again",
    description: "Breakfast cereals we went back for, with every ingredient explained.",
    products: [],
  },
  {
    owner: "baloo",
    title: "Ice creams under 5 ingredients",
    slug: "ice-creams-under-5-ingredients",
    description: "Short labels, no lecture — ice creams that keep the list simple.",
    products: [],
  },
  {
    owner: "kidslunchbox",
    title: "Best snacks for kids",
    slug: "best-snacks-for-kids",
    description: "Lunchbox snacks, read label-first. Context, not verdicts.",
    products: [],
  },
];

function line(s = "") {
  console.log(s);
}

async function ensureAuthUser(email: string): Promise<string> {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
  if (!url || !serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY + SUPABASE_URL are required — run `npx vercel env pull .env.development.local`.");
  }
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { data: existing, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listErr) throw listErr;
  const found = existing.users.find((u) => u.email === email);
  if (found) return found.id;

  const { data: created, error } = await admin.auth.admin.createUser({ email, email_confirm: true });
  if (error || !created.user) throw error ?? new Error("createUser returned no user");
  return created.user.id;
}

/** Runs the real pipeline for one URL and persists it. Returns the catalog product id. */
async function analyseAndIngest(url: string): Promise<string | null> {
  const extraction = await scrapeAndExtract(url);
  if (!extraction || !extraction.ingredients_list?.length) {
    console.error(`    ✗ could not read ${url}`);
    return null;
  }
  const analysis = await analyseIngredients({
    product_name: extraction.product_name,
    retailer: extraction.retailer,
    ingredients_list: extraction.ingredients_list,
    percentages: extraction.percentages,
  });
  const ingested = await ingestAnalysis({
    product_name: extraction.product_name,
    retailer: extraction.retailer,
    url,
    ingredients: analysis.ingredients,
    product_summary: analysis.product_summary,
    nutrition: extraction.nutrition,
  });
  if (!ingested) {
    console.error(`    ✗ ingest failed for ${url}`);
    return null;
  }
  console.log(`    ✓ ${extraction.product_name}`);
  return ingested.productId;
}

async function main() {
  const dbi = db();
  if (!dbi) {
    console.error("No DATABASE_URL — run `npx vercel env pull .env.development.local` first.");
    process.exit(1);
  }

  // ── Validate before spending a cent ──────────────────────────────────────────────────────────
  const unsupported: string[] = [];
  let totalProducts = 0;
  for (const l of LISTS) {
    for (const u of l.products) {
      totalProducts++;
      if (!isSupportedUrl(u)) unsupported.push(`${l.slug}: ${u}`);
    }
  }
  const emptyLists = LISTS.filter((l) => l.products.length === 0);

  line(`Mode: ${COMMIT ? "COMMIT (will write + spend)" : "DRY RUN (no writes, no spend)"}`);
  line(`Accounts: ${ACCOUNTS.length}   Lists: ${LISTS.length}   Products: ${totalProducts}`);
  line(`Estimated spend: ${totalProducts} × (1 Firecrawl scrape + 2 Claude calls)`);
  if (unsupported.length) {
    line();
    line("UNSUPPORTED RETAILER URLs (these would be rejected — fix before committing):");
    unsupported.forEach((u) => line(`  ✗ ${u}`));
  }
  if (emptyLists.length) {
    line();
    line("LISTS WITH NO PRODUCTS YET (editorial picks needed — they'd be seeded empty):");
    emptyLists.forEach((l) => line(`  • ${l.slug} — "${l.title}"`));
  }
  if (!COMMIT) {
    line();
    line("Dry run complete. Re-run with --commit to apply.");
    process.exit(0);
  }
  if (unsupported.length) {
    console.error("\nRefusing to commit while unsupported URLs are present.");
    process.exit(1);
  }

  // ── Accounts ─────────────────────────────────────────────────────────────────────────────────
  line();
  const ownerIds = new Map<string, string>();
  for (const a of ACCOUNTS) {
    const existing = await getProfileByHandle(dbi, a.handle);
    if (existing) {
      ownerIds.set(a.handle, existing.id);
      line(`account @${a.handle} — already exists`);
      continue;
    }
    const authId = await ensureAuthUser(a.email);
    const p = await upsertProfile(dbi, {
      id: authId,
      handle: a.handle,
      displayName: a.displayName,
      bio: a.bio,
    });
    ownerIds.set(a.handle, p.id);
    line(`account @${a.handle} — created (password unset; set it in Supabase before signing in)`);
  }

  // ── Lists (products analysed first, so a failure leaves no half-built list) ──────────────────
  for (const l of LISTS) {
    if (await getListBySlug(dbi, l.slug)) {
      line(`\nlist ${l.slug} — already exists, skipping`);
      continue;
    }
    const ownerId = ownerIds.get(l.owner);
    if (!ownerId) {
      console.error(`\nlist ${l.slug} — owner @${l.owner} missing, skipping`);
      continue;
    }
    line(`\nlist ${l.slug} — analysing ${l.products.length} product(s)`);
    const productIds: string[] = [];
    for (const url of l.products) {
      const id = await analyseAndIngest(url);
      if (id) productIds.push(id);
    }
    if (l.products.length && !productIds.length) {
      console.error(`  ✗ no products resolved — not creating ${l.slug}`);
      continue;
    }
    const created = await createList(dbi, {
      ownerId,
      title: l.title,
      slug: l.slug,
      description: l.description,
      isPublic: true,
    });
    for (const pid of productIds) await addListItem(dbi, created.id, pid);
    line(`  ✓ created "${l.title}" with ${productIds.length} product(s)`);
  }

  // Deliberately NOT seeded: saves, follows, votes. Real numbers only.
  line("\nSEED SUPPLY OK");
  process.exit(0);
}

main().catch((err) => {
  console.error("SEED SUPPLY FAILED:", err);
  process.exit(1);
});
