import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getProductForPage } from "@/lib/db/queries/products";
import { ResultsView } from "@/components/ResultsView";
import { SiteHeader } from "@/components/SiteHeader";
import { AddToList } from "@/components/lists/AddToList";
import { UpvotePill } from "@/components/engagement/UpvotePill";
import { getSessionUser } from "@/lib/auth";
import { getVoteCount, hasVoted } from "@/lib/db/queries/votes";
import type { Ingredient, Nutrition } from "@/lib/schema";

// The canonical product page (Order G3): a permanent, shareable, SSR'd page per product, read
// from Postgres and rendered through the SAME F2 ingredient list + B4 nutrition tab the live tool
// streams. This is what lists (G4) link to and discussions (G8) hang off.

type Params = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  const dbi = db();
  return dbi ? getProductForPage(dbi, slug) : null;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const data = await load(slug);
  if (!data) return { title: "Baloo" };
  const title = `${data.product.name} — Baloo`;
  const description = data.summary ?? `What's in ${data.product.name}: every ingredient explained.`;
  return { title, description, openGraph: { title, description } };
}

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const data = await load(slug);
  if (!data) notFound();

  // Engagement state (Order G7), SSR-hydrated.
  const dbi = db()!; // load() already proved it exists
  const viewer = await getSessionUser();
  const voteCount = await getVoteCount(dbi, "product", data.product.id);
  const viewerVoted = viewer ? await hasVoted(dbi, viewer.id, "product", data.product.id) : false;

  const ingredients: Partial<Ingredient>[] = data.items.map((i) => ({
    name: i.name,
    tag: i.tag ?? undefined,
    role: i.role ?? undefined,
    what_it_is: i.whatItIs ?? "",
    why_its_here: i.whyItsHere ?? "",
    percentage: i.percent ?? null,
    percentage_note: i.percentageNote ?? null,
  }));

  const nutrition: Nutrition | undefined = data.nutrition
    ? {
        serving_size: data.nutrition.servingSize,
        per: data.nutrition.per,
        nutrients: data.nutrition.nutrients,
      }
    : undefined;

  return (
    <div className="relative min-h-screen">
      <main className="mx-auto flex min-h-screen max-w-tool flex-col px-5">
        <SiteHeader action={<AddToList productId={data.product.id} />} />

        {/* Engagement bar (Order G7, D-G7/G8): agreement, not a rating — and it says so. */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <UpvotePill
            targetType="product"
            targetId={data.product.id}
            initialCount={voteCount}
            initialVoted={viewerVoted}
            withLabel
            size="md"
          />
          <p className="text-xs text-muted">
            Upvotes rank this in lists &amp; search. They aren&apos;t a verdict.
          </p>
        </div>

        {data.items.length > 0 ? (
          // loading={false} → ResultsView renders the finished (non-streaming) product view.
          <ResultsView
            productName={data.product.name}
            retailer={data.product.retailer ?? ""}
            sourceUrl=""
            count={data.items.length}
            ingredients={ingredients}
            nutrition={nutrition}
            cacheKey={data.product.id}
            productSummary={data.summary ?? undefined}
            loading={false}
          />
        ) : (
          // Catalog product not yet explained (e.g. seeded from Open Food Facts before its AI
          // pass) — a calm placeholder, never a spinner.
          <section className="mt-12 animate-fade-in border-t border-line pt-6">
            <h1 className="font-display text-2xl leading-tight text-ink sm:text-3xl">
              {data.product.name}
            </h1>
            {data.product.retailer && (
              <p className="mt-1.5 text-sm text-muted">{data.product.retailer}</p>
            )}
            <p className="mt-4 text-sm text-muted">
              We haven&apos;t broken this one down yet — its ingredient explanation is on the way.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
