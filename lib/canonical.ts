// Product & ingredient identity (Order G3) — pure, portable. The dedup invariant lives here:
// two people analysing the same real-world product must produce the same canonical_key so they
// converge on one `products` row.

import { createHash } from "crypto";

// Lowercase, strip accents, non-alphanumerics → single spaces. The great equaliser: "Coca-Cola
// Zero!" and "coca cola zero" collapse to the same string.
export function normalizeName(s: string): string {
  // NFKD splits accents into base + combining mark; the [^a-z0-9] pass then drops the marks
  // (and every other separator), so "Coca-Cola Zero!" and "cocá cola zero" both land on the same
  // normalised string.
  return s
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

// barcode when we have one (the OFF/Go-UPC source, later); else a normalised brand+name key.
// The retailer pipeline gives us name only, so today it's effectively name-based — good enough
// to dedup repeat scans of the same product, and upgraded automatically once barcodes arrive.
export function canonicalKey(input: { name: string; brand?: string | null; barcode?: string | null }): string {
  const digits = input.barcode?.replace(/\D/g, "");
  if (digits && digits.length >= 8) return `barcode:${digits}`;
  const basis = normalizeName([input.brand, input.name].filter(Boolean).join(" "));
  return `bn:${basis}`;
}

// Stable + unique: same product → same slug (from the canonical key), readable prefix from the
// name, short hash suffix to avoid collisions between different products with similar names.
export function productSlug(name: string, key: string): string {
  const base =
    normalizeName(name).replace(/\s+/g, "-").slice(0, 60).replace(/^-+|-+$/g, "") || "product";
  const suffix = createHash("sha256").update(key).digest("hex").slice(0, 6);
  return `${base}-${suffix}`;
}

// The key for the product-INDEPENDENT ingredient cache (brief §4.1): "Water" in any product maps
// to one `ingredients` row, so its what_it_is is generated once and reused everywhere.
export function ingredientKey(name: string): string {
  return normalizeName(name);
}
