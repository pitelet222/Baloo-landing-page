import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { getPublicListsRecent } from "@/lib/db/queries/lists";
import { getRecentProducts } from "@/lib/db/queries/products";
import { SiteHeader } from "@/components/SiteHeader";
import { ListCard } from "@/components/lists/ListCard";
import { SearchBox } from "@/components/discover/SearchBox";

export const metadata: Metadata = {
  title: "Discover — Baloo",
  description: "Find lists and products the Baloo community is putting together.",
};

// Browse + search (Order G5). "Popular" arrives with G7's vote signal; category landings arrive
// with H1's catalog taxonomy — until then: search, recent lists, and new products.
export default async function DiscoverPage() {
  const dbi = db();
  const [lists, products] = dbi
    ? await Promise.all([getPublicListsRecent(dbi, 12), getRecentProducts(dbi, 8)])
    : [[], []];

  return (
    <div className="relative min-h-screen">
      {/* 1140px: the one documented extension of max-w-tool — a reading column can't hold a
          card grid (D-G5 handoff §0). */}
      <main className="mx-auto flex min-h-screen w-full max-w-[1140px] flex-col px-5 pb-16">
        <SiteHeader />

        <section className="mt-12 max-w-[680px] animate-fade-in">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-natural">Discover</p>
          <h1 className="mt-2 font-display text-4xl leading-[1.1] text-ink">
            Lists worth trusting.
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted">
            What the Baloo community is buying, keeping, and explaining — every product on every
            list broken down ingredient by ingredient.
          </p>
          <div className="mt-6">
            {/* useSearchParams requires a Suspense boundary. */}
            <Suspense fallback={null}>
              <SearchBox />
            </Suspense>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-[23px] text-ink">Recently added</h2>
          {lists.length === 0 ? (
            <p className="mt-3 text-sm text-muted">
              No public lists yet. Paste a product link on the home tool to analyse a product,
              then save it to your first list.
            </p>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {lists.map((l) => (
                <ListCard key={l.id} list={l} handle={l.ownerHandle} />
              ))}
            </div>
          )}
        </section>

        <section className="mt-12">
          <h2 className="font-display text-[23px] text-ink">Recently analysed</h2>
          {products.length === 0 ? (
            <p className="mt-3 text-sm text-muted">
              No products yet — analyse one on the homepage and it joins the catalog.
            </p>
          ) : (
            <ul className="mt-4 max-w-[760px] overflow-hidden rounded-2xl border border-line bg-paper shadow-card [&>li+li]:border-t [&>li+li]:border-line">
              {products.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/p/${p.slug}`}
                    className="flex items-center gap-3 px-4 py-3 transition hover:bg-canvas sm:px-5"
                  >
                    <span
                      aria-hidden
                      className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg bg-canvas font-display text-lg text-ink/30"
                    >
                      {(p.brand ?? p.name)[0]?.toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-display text-[17px] leading-tight text-ink">
                        {p.name}
                      </span>
                      {(p.brand || p.retailer) && (
                        <span className="text-xs text-muted">
                          {[p.brand, p.retailer].filter(Boolean).join(" · ")}
                        </span>
                      )}
                    </span>
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
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
