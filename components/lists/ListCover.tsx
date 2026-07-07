import { coverCss, monogram } from "@/lib/cover";

// Generated list cover (Order G4): a deterministic gradient + the title's monogram. Presentational
// server component — reused on the list page hero and the list card. The OG route mirrors this via
// the same lib/cover helpers.
export function ListCover({
  title,
  seed,
  className = "",
  monogramClassName = "text-5xl",
}: {
  title: string;
  seed: string;
  className?: string;
  monogramClassName?: string;
}) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden ${className}`}
      style={{ background: coverCss(seed) }}
      aria-hidden
    >
      <span className={`font-display font-semibold text-ink/15 ${monogramClassName}`}>
        {monogram(title)}
      </span>
    </div>
  );
}
