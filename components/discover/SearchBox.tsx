"use client";

// Discover search (Order G5, restyled per the D-G5 handoff §4): debounced /api/search with ?q=
// URL state, a segmented All/Products/Lists filter, tabular count line, brand-initial thumbnails,
// and — on a miss — the discovery→ingestion bridge ("paste the product link and we'll read the
// label for you").

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

type Hit = {
  products: { id: string; name: string; brand: string | null; slug: string }[];
  lists: { id: string; slug: string; title: string; itemCount: number; ownerHandle: string | null }[];
};

type Filter = "all" | "products" | "lists";

export function SearchBox() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [hits, setHits] = useState<Hit | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const first = useRef(true);

  useEffect(() => {
    if (first.current) first.current = false;
    else {
      const url = q.trim() ? `/discover?q=${encodeURIComponent(q.trim())}` : "/discover";
      router.replace(url, { scroll: false });
    }

    if (q.trim().length < 2) {
      setHits(null);
      setSearched(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        setHits(await res.json());
      } catch {
        setHits({ products: [], lists: [] });
      }
      setSearched(true);
      setLoading(false);
    }, 250);
    return () => clearTimeout(t);
  }, [q, router]);

  const nP = hits?.products.length ?? 0;
  const nL = hits?.lists.length ?? 0;
  const empty = searched && !loading && nP === 0 && nL === 0;
  const showLists = filter !== "products" && nL > 0;
  const showProducts = filter !== "lists" && nP > 0;

  return (
    <div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Search products and lists"
        placeholder="Search products and lists…"
        className="w-full rounded-full border border-line bg-paper px-5 py-3 text-ink shadow-card outline-none transition focus:border-natural focus:ring-2 focus:ring-natural/20"
      />

      {loading && (
        <p className="mt-4 flex items-center gap-2 text-sm text-muted">
          <span
            aria-hidden
            className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-natural"
          />
          Searching…
        </p>
      )}

      {searched && !loading && hits && (nP > 0 || nL > 0) && (
        <div className="mt-5 animate-fade-in">
          <p className="text-sm tabular-nums text-muted">
            {nP + nL} {nP + nL === 1 ? "result" : "results"}
            {" · "}
            {nL} {nL === 1 ? "list" : "lists"}, {nP} {nP === 1 ? "product" : "products"}
          </p>

          {/* Segmented filter — active pill = ink fill (D-G5 §4). */}
          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Filter results">
            {(["all", "products", "lists"] as Filter[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                aria-pressed={filter === f}
                className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium transition ${
                  filter === f
                    ? "bg-ink text-paper"
                    : "border border-line bg-paper text-ink/70 hover:bg-canvas"
                }`}
              >
                {f === "all" ? "All" : f === "products" ? "Products" : "Lists"}
              </button>
            ))}
          </div>

          {showLists && (
            <>
              <h2 className="mt-6 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                Lists
              </h2>
              <ul className="mt-2 max-w-[760px] overflow-hidden rounded-2xl border border-line bg-paper shadow-card [&>li+li]:border-t [&>li+li]:border-line">
                {hits.lists.map((l) => (
                  <li key={l.id}>
                    <Link
                      href={`/list/${l.slug}`}
                      className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-canvas"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-display text-[17px] text-ink">
                          {l.title}
                        </span>
                        <span className="text-xs tabular-nums text-muted">
                          {l.itemCount} {l.itemCount === 1 ? "product" : "products"}
                          {l.ownerHandle && ` · @${l.ownerHandle}`}
                        </span>
                      </span>
                      <span aria-hidden className="shrink-0 text-muted">
                        →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}

          {showProducts && (
            <>
              <h2 className="mt-6 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                Products
              </h2>
              <ul className="mt-2 max-w-[760px] overflow-hidden rounded-2xl border border-line bg-paper shadow-card [&>li+li]:border-t [&>li+li]:border-line">
                {hits.products.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/p/${p.slug}`}
                      className="flex items-center gap-3 px-4 py-3 transition hover:bg-canvas"
                    >
                      <span
                        aria-hidden
                        className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg bg-canvas font-display text-lg text-ink/30"
                      >
                        {(p.brand ?? p.name)[0]?.toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-display text-[17px] text-ink">
                          {p.name}
                        </span>
                        {p.brand && <span className="text-xs text-muted">{p.brand}</span>}
                      </span>
                      <span aria-hidden className="shrink-0 text-muted">
                        →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {empty && (
        <div className="mt-5 max-w-[640px] animate-fade-in rounded-2xl border border-line bg-paper p-5 shadow-card">
          <p className="text-sm text-ink">No matches for &quot;{q.trim()}&quot;.</p>
          <p className="mt-1 text-sm text-muted">
            Try a product name or a retailer. Or paste the product link on the home tool and
            we&apos;ll read the label for you.
          </p>
          <Link
            href="/"
            className="mt-3 inline-block rounded-full bg-ink px-4 py-2 text-[13px] font-medium text-paper transition hover:bg-ink/85"
          >
            Analyse a product link
          </Link>
        </div>
      )}
    </div>
  );
}
