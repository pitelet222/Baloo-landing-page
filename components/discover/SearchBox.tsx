"use client";

// Discover search (Order G5): debounced /api/search over products + public lists, with ?q= URL
// state so searches are shareable and back-button friendly.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

type Hit = {
  products: { id: string; name: string; brand: string | null; slug: string }[];
  lists: { id: string; slug: string; title: string; itemCount: number; ownerHandle: string | null }[];
};

export function SearchBox() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [hits, setHits] = useState<Hit | null>(null);
  const [searched, setSearched] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    // Keep the URL in sync (skip the very first render — the URL already has it).
    if (first.current) first.current = false;
    else {
      const url = q.trim() ? `/discover?q=${encodeURIComponent(q.trim())}` : "/discover";
      router.replace(url, { scroll: false });
    }

    if (q.trim().length < 2) {
      setHits(null);
      setSearched(false);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        setHits(await res.json());
      } catch {
        setHits({ products: [], lists: [] });
      }
      setSearched(true);
    }, 250);
    return () => clearTimeout(t);
  }, [q, router]);

  const empty = searched && hits && hits.products.length === 0 && hits.lists.length === 0;

  return (
    <div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Search products and lists"
        placeholder="Search products and lists…"
        className="w-full rounded-lg border border-line bg-paper px-4 py-3 text-ink shadow-card outline-none transition focus:border-natural focus:ring-2 focus:ring-natural/20"
      />

      {hits && (hits.products.length > 0 || hits.lists.length > 0) && (
        <div className="mt-4 animate-fade-in">
          {hits.products.length > 0 && (
            <>
              <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-ink">
                Products
              </h2>
              <ul className="mt-2 overflow-hidden rounded-2xl border border-line bg-paper shadow-card [&>li+li]:border-t [&>li+li]:border-line">
                {hits.products.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/p/${p.slug}`}
                      className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-canvas"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm text-ink">{p.name}</span>
                        {p.brand && (
                          <span className="text-xs uppercase tracking-[0.08em] text-muted">
                            {p.brand}
                          </span>
                        )}
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

          {hits.lists.length > 0 && (
            <>
              <h2 className="mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-ink">
                Lists
              </h2>
              <ul className="mt-2 overflow-hidden rounded-2xl border border-line bg-paper shadow-card [&>li+li]:border-t [&>li+li]:border-line">
                {hits.lists.map((l) => (
                  <li key={l.id}>
                    <Link
                      href={`/list/${l.slug}`}
                      className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-canvas"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm text-ink">{l.title}</span>
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
        </div>
      )}

      {empty && (
        <p className="mt-4 text-sm text-muted">No matches. Try a brand or a simpler word.</p>
      )}
    </div>
  );
}
