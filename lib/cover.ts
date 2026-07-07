// Generated list covers (Order G4) — no image upload. A deterministic gradient (from the slug)
// plus the title's monogram. Pure so both the DOM cover (ListCover) and the OG image route use
// the exact same output. Palette is our calm, desaturated tokens + the F2 warm set — never a
// traffic-light hue.

const GRADIENTS: [string, string][] = [
  ["#E7F1EB", "#CFE3D6"], // green soft
  ["#F6ECDD", "#E9D8BE"], // amber soft
  ["#EDE9E0", "#C4AC7F"], // gold / taupe
  ["#EDE7E9", "#B99589"], // mauve
  ["#E8ECEF", "#8C99A6"], // slate blue
  ["#ECEBE5", "#A0A08B"], // olive grey
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function coverGradient(seed: string): { from: string; to: string; angle: number } {
  const [from, to] = GRADIENTS[hash(seed) % GRADIENTS.length];
  return { from, to, angle: 135 };
}

export function coverCss(seed: string): string {
  const g = coverGradient(seed);
  return `linear-gradient(${g.angle}deg, ${g.from}, ${g.to})`;
}

export function monogram(title: string): string {
  const first = [...(title ?? "").trim()][0];
  return (first ?? "•").toUpperCase();
}
