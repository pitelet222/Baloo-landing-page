// "Who's this for?" reference-intake profiles (Order B2).
// Pure data + tiny storage helpers — no React, portable to the mobile app.
//
// ── Sources (verified 2 Jul 2026) ─────────────────────────────────────────────────────────────
// [1] PHE, "Government Dietary Recommendations" (Aug 2016, gateway 2016202), Tables 1–2:
//     https://assets.publishing.service.gov.uk/media/5a749fece5274a44083b82d8/government_dietary_recommendations.pdf
// [2] NHS, "How to read food labels" (adult front-of-pack Reference Intakes):
//     https://www.nhs.uk/live-well/eat-well/food-guidelines-and-food-labels/how-to-read-food-labels/
//
// How each column was set:
// - Adult row = the legal front-of-pack Reference Intakes [2] (2000 kcal / 70 g fat / 20 g
//   saturates / 260 g carbohydrate / 90 g TOTAL sugars / 50 g protein / 6 g salt) + 30 g fibre
//   (SACN "Carbohydrates and Health" 2015, via [1] Table 2). These are what "% RI" on UK packs
//   is computed against, so product panels compare like-for-like.
// - Child kcal = [1] Table 1 energy EARs (SACN 2011), male/female averaged:
//   7–10: (1817+1703)/2 = 1760 · 4–6: (1482+1378)/2 = 1430 · 2–3: (1088+1004)/2 = 1046.
// - Child fat/saturates = [1] printed figures averaged (7–10: 71/66 → 69, 22/21 → 22;
//   4–6: 58/54 → 56, 18/17 → 18). PHE prints none under age 4, so 2–3 is DERIVED at the same
//   COMA proportions used by [1]: 35 %E → 41 g fat, 11 %E → 13 g saturates.
// - Child carbohydrate = [1] printed figures averaged (242/227 → 235; 198/184 → 191;
//   145/134 → 140).
// - Child sugars: labels (and our extraction) report TOTAL sugars, but [1]'s child figures are
//   FREE sugars (5 %E) — comparing label totals against free-sugar limits would overstate wildly
//   (misleading and alarmist). So child references are DERIVED at 18 %E — the same proportion
//   behind the adult 90 g total-sugars RI: 1760×0.18/4 ≈ 79 · 1430×0.18/4 ≈ 64 · 1046×0.18/4 ≈ 47.
// - Child protein = COMA 1991 RNIs via [1] (28.3 / 19.7 / 14.5 — kept at source precision).
// - Child salt = SACN 2003 maximums via [1]/NHS (5 / 3 / 2).
// - Child fibre = SACN 2015 via [1] (7–10: 20 · 4–6: 20, noting [1] prints "15 (4y), 20 (5–6y)" —
//   we use the 5–6 figure covering most of the band · 2–3: 15).
// - Youngest band is 2–3 yrs (not 1–3): [1] treats age 1 separately with lower figures, and the
//   sugar/fibre recommendations only start at age 2.
//
// These are population reference values for context, not personalised targets — the UI must
// always carry the disclaimer (see CLAUDE.md).

export type Profile = {
  id: string;
  label: string;
  kcal: number;
  fat_g: number;
  satfat_g: number;
  carb_g: number;
  sugars_g: number;
  fibre_g: number;
  protein_g: number;
  salt_g: number;
};

export const PROFILES: Profile[] = [
  { id: "adult", label: "Adult (average)", kcal: 2000, fat_g: 70, satfat_g: 20, carb_g: 260, sugars_g: 90, fibre_g: 30, protein_g: 50, salt_g: 6 },
  { id: "child-7-10", label: "Child · 7–10 yrs", kcal: 1760, fat_g: 69, satfat_g: 22, carb_g: 235, sugars_g: 79, fibre_g: 20, protein_g: 28.3, salt_g: 5 },
  { id: "child-4-6", label: "Child · 4–6 yrs", kcal: 1430, fat_g: 56, satfat_g: 18, carb_g: 191, sugars_g: 64, fibre_g: 20, protein_g: 19.7, salt_g: 3 },
  { id: "child-2-3", label: "Child · 2–3 yrs", kcal: 1046, fat_g: 41, satfat_g: 13, carb_g: 140, sugars_g: 47, fibre_g: 15, protein_g: 14.5, salt_g: 2 },
];

export const DEFAULT_PROFILE_ID = "adult";

export function getProfile(id: string | null | undefined): Profile {
  return PROFILES.find((p) => p.id === id) ?? PROFILES[0];
}

// localStorage persistence (no account, no server). Guarded so lib stays importable
// server-side; the mobile app will swap these for its own storage.
const STORAGE_KEY = "baloo:profile";

export function loadProfileId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function saveProfileId(id: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* storage may be unavailable (private mode) — the choice just won't persist */
  }
}
