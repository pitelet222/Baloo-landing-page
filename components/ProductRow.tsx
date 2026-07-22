import Link from "next/link";

// Shared product row (Order L1f) — one idiom for "a product in a list", used by Discover's
// "Recently analysed" and the search results in SearchBox (and reusable on profiles later). Pure
// presentational (no hooks), so it works in server and client components alike. Brand-initial
// thumbnail + Playfair name + a neutral brand·retailer meta line + the app's SVG chevron.
export function ProductRow({
  slug,
  name,
  brand,
  retailer,
  meta,
}: {
  slug: string;
  name: string;
  brand?: string | null;
  retailer?: string | null;
  meta?: string; // overrides the default brand·retailer join when a caller wants different text
}) {
  const metaLine = meta ?? [brand, retailer].filter(Boolean).join(" · ");
  return (
    <li>
      <Link
        href={`/p/${slug}`}
        className="flex items-center gap-3 px-4 py-3 transition hover:bg-canvas sm:px-5"
      >
        <span
          aria-hidden
          className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg bg-canvas font-display text-lg text-ink/30"
        >
          {(brand ?? name)[0]?.toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-[17px] leading-tight text-ink">
            {name}
          </span>
          {metaLine && <span className="text-xs text-muted">{metaLine}</span>}
        </span>
        <RowChevron />
      </Link>
    </li>
  );
}

// The single source for the row affordance chevron — reused across product + list rows so the whole
// app points the same way.
export function RowChevron() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="h-4 w-4 shrink-0 text-muted"
    >
      <path d="M6 3.5L10.5 8 6 12.5" />
    </svg>
  );
}
