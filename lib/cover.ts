// Generated list covers (Order G4; flat since L1a) — no image upload. A deterministic FLAT tint
// (from the slug) plus the title's monogram. V3 rule, per Jitain: no gradients anywhere. Pure so
// both the DOM cover (ListCover) and the OG image route use the exact same output.

// The V3 flat palette — calm, desaturated cream-world tints; never a traffic-light hue.
const TINTS: string[] = [
  "#DCE6D5", // sage
  "#EADFC9", // wheat
  "#E7D8CE", // clay
  "#DFE4DE", // mist
  "#E3E7D9", // celadon
  "#EFE4D0", // sand
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function coverTint(seed: string): string {
  return TINTS[hash(seed) % TINTS.length];
}

// Kept as the shared "CSS background for a cover" API (ListCover, profile avatar, OG route) —
// now simply the flat tint.
export function coverCss(seed: string): string {
  return coverTint(seed);
}

export function monogram(title: string): string {
  const first = [...(title ?? "").trim()][0];
  return (first ?? "•").toUpperCase();
}
