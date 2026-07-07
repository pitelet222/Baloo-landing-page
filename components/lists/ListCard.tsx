import Link from "next/link";
import { ListCover } from "./ListCover";
import type { ListWithCounts } from "@/lib/db/queries/lists";

// The list card (Order G4) — the unit shown in profiles, feeds and discovery grids.
export function ListCard({ list, handle }: { list: ListWithCounts; handle?: string | null }) {
  return (
    <Link
      href={`/list/${list.slug}`}
      className="group block overflow-hidden rounded-2xl border border-line bg-paper shadow-card transition duration-200 hover:shadow-card-hover"
    >
      <ListCover title={list.title} seed={list.slug} className="h-28" monogramClassName="text-5xl" />
      <div className="p-4">
        <h3 className="font-display text-lg leading-tight text-ink">{list.title}</h3>
        {handle && <p className="mt-1 text-sm text-muted">by @{handle}</p>}
        <p className="mt-2 text-xs tabular-nums text-muted">
          {list.itemCount} {list.itemCount === 1 ? "product" : "products"}
          {list.saveCount > 0 && ` · ${list.saveCount} saved`}
          {!list.isPublic && " · private"}
        </p>
      </div>
    </Link>
  );
}
