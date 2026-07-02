// Nutrition context math (Order B3). ALL arithmetic lives here, in code — the model never
// calculates (CLAUDE.md hard rule). Pure and portable: no React, no Next, no network.
//
// Input: the nutrition panel exactly as printed (lib/schema.ts, Order B1) and a reference
// profile (lib/profile.ts, Order B2). Output: per-nutrient % of the profile's reference daily
// intake, ready for the Nutrition tab (Order B4) and the context sentence (/api/nutrition-context).

import type { Nutrition } from "./schema";
import type { Profile } from "./profile";

// ── Disclaimers (exact copy from the design handoff; B4 renders them) ─────────────────────────
export const NUTRITION_DISCLAIMER =
  "General estimate from public UK reference values (FSA/NHS) — not personalised medical or dietary advice.";
export const CHILD_DISCLAIMER_SUFFIX =
  "Children's needs vary with age and activity; for anything specific, check with a health professional.";

export type NutrientRow = {
  name: string; // as printed ("Sodium" stays "Sodium")
  unit: string;
  per_100g: string | null; // as printed — display values
  per_serving: string | null;
  pct_100g: number | null; // % of the profile's reference daily intake; null = missing/unmappable
  pct_serving: number | null;
  approx: boolean; // source value carried "<" — treat the % as "less than"
};

export type NutritionComputation = {
  basis: "serving" | "100g"; // which column the headline %s (and highlights) use
  rows: NutrientRow[];
};

// Tolerant parser for label values as printed: "6.4", "<0.5", "0,5", " 212 ".
// Returns null for anything non-numeric ("trace", "—", "").
function parseValue(raw: string | null): { value: number; approx: boolean } | null {
  if (!raw) return null;
  const approx = raw.includes("<");
  const cleaned = raw.replace(/[<>~≈]/g, "").replace(/\s/g, "").replace(",", ".");
  const value = Number.parseFloat(cleaned);
  if (!Number.isFinite(value)) return null;
  return { value, approx };
}

// Canonical extraction names (see lib/prompts.ts) → profile reference fields.
// Sodium: labels sometimes print sodium instead of salt; the standard salt-equivalent is
// sodium × 2.5, applied here IN CODE so the % compares like-for-like against the salt
// reference. The row keeps displaying "Sodium" and its printed values.
const SODIUM_TO_SALT = 2.5;

function referenceFor(name: string, profile: Profile): { ref: number; factor: number } | null {
  switch (name.trim().toLowerCase()) {
    case "energy":
      return { ref: profile.kcal, factor: 1 };
    case "fat":
      return { ref: profile.fat_g, factor: 1 };
    case "saturates":
    case "saturated fat":
      return { ref: profile.satfat_g, factor: 1 };
    case "carbohydrate":
      return { ref: profile.carb_g, factor: 1 };
    case "sugars":
      return { ref: profile.sugars_g, factor: 1 };
    case "fibre":
    case "fiber":
      return { ref: profile.fibre_g, factor: 1 };
    case "protein":
      return { ref: profile.protein_g, factor: 1 };
    case "salt":
      return { ref: profile.salt_g, factor: 1 };
    case "sodium":
      return { ref: profile.salt_g, factor: SODIUM_TO_SALT };
    default:
      return null; // unmappable rows still display, just without a %
  }
}

// Integers from 1% up; one decimal below 1% so small-but-real amounts don't show as 0%.
function roundPct(pct: number): number {
  return pct >= 1 ? Math.round(pct) : Math.round(pct * 10) / 10;
}

function pctOf(raw: string | null, name: string, profile: Profile): { pct: number | null; approx: boolean } {
  const parsed = parseValue(raw);
  const mapping = referenceFor(name, profile);
  if (!parsed || !mapping || mapping.ref <= 0) return { pct: null, approx: parsed?.approx ?? false };
  return { pct: roundPct(((parsed.value * mapping.factor) / mapping.ref) * 100), approx: parsed.approx };
}

export function computeNutrition(nutrition: Nutrition, profile: Profile): NutritionComputation {
  const hasServing = nutrition.nutrients.some((n) => n.per_serving !== null);
  const basis: "serving" | "100g" = hasServing ? "serving" : "100g";

  const rows: NutrientRow[] = nutrition.nutrients.map((n) => {
    const serving = pctOf(n.per_serving, n.name, profile);
    const per100 = pctOf(n.per_100g, n.name, profile);
    return {
      name: n.name,
      unit: n.unit,
      per_100g: n.per_100g,
      per_serving: n.per_serving,
      pct_serving: serving.pct,
      pct_100g: per100.pct,
      approx: serving.approx || per100.approx,
    };
  });

  return { basis, rows };
}

// Deterministic choice of what the context sentence talks about: the 1–2 highest-percentage
// rows on the active basis, Energy excluded (it's the headline number, not the interesting
// context). Keeping this selection in code means the model never editorialises about data.
export function pickHighlights(
  computation: NutritionComputation,
  max = 2,
): { name: string; pct: number }[] {
  const key = computation.basis === "serving" ? "pct_serving" : "pct_100g";
  return computation.rows
    .filter((r) => r.name.toLowerCase() !== "energy" && r[key] !== null)
    .map((r) => ({ name: r.name, pct: r[key] as number }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, max);
}

// Fallback context sentence, built without the model — used when ANTHROPIC_API_KEY is absent
// or the call fails, so the Nutrition tab always has its line. Same facts, plainer words.
export function fallbackContextSentence(input: {
  serving_size: string | null;
  basis: "serving" | "100g";
  profileLabel: string;
  highlights: { name: string; pct: number }[];
}): string {
  const { serving_size, basis, profileLabel, highlights } = input;
  if (highlights.length === 0) return "";
  const portion =
    basis === "serving" ? `A ${serving_size ?? "single"} serving` : "Each 100 g/100 ml";
  const parts = highlights.map(
    (h, i) =>
      `${i === 0 ? "about " : ""}${h.pct}% of the reference daily ${h.name.toLowerCase()}`,
  );
  return `${portion} provides ${parts.join(" and ")} for ${profileLabel.toLowerCase()} — context for how a portion adds up, not a verdict.`;
}
