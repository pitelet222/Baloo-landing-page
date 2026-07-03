"use client";

import { useState } from "react";
import type { Ingredient, Nutrition } from "@/lib/schema";
import { IngredientRow } from "./IngredientCard";
import { NutritionPanel } from "./NutritionPanel";

type Tab = "ingredients" | "nutrition";

export function ResultsView({
  productName,
  retailer,
  sourceUrl,
  count,
  ingredients,
  nutrition,
  cacheKey,
  productSummary,
  loading = false,
}: {
  productName: string;
  retailer: string;
  sourceUrl: string;
  count: number;
  ingredients: Partial<Ingredient>[];
  nutrition?: Nutrition;
  cacheKey?: string;
  productSummary?: string;
  loading?: boolean;
}) {
  const [tab, setTab] = useState<Tab>("ingredients");
  const empty = ingredients.length === 0;

  const tabClass = (active: boolean) =>
    `-mb-px border-b-2 py-3 text-[15px] transition ${
      active
        ? "border-natural font-semibold text-ink"
        : "border-transparent font-medium text-muted hover:text-ink"
    }`;

  return (
    <section className="mt-12 animate-fade-in">
      <header className="border-b border-line pb-5">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-natural">
          Ingredient breakdown
        </p>
        <h2 className="mt-2 font-display text-2xl leading-tight text-ink sm:text-3xl">
          {productName}
        </h2>
        <p className="mt-1.5 text-sm text-muted">
          {retailer}
          {sourceUrl && (
            <>
              {" · "}
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-line underline-offset-2 transition hover:text-ink"
              >
                View on retailer
              </a>
            </>
          )}
        </p>
        <p className="mt-3 text-sm text-muted">
          <span className="font-medium text-ink/70">{count}</span>{" "}
          {count === 1 ? "ingredient" : "ingredients"}, in label order — listed most to least by
          quantity.
        </p>
      </header>

      {/* Tabs per the design handoff: Ingredients / Nutrition / Processing (Soon, disabled). */}
      <div role="tablist" aria-label="Result views" className="mt-1.5 flex gap-6 border-b border-line">
        <button
          role="tab"
          id="tab-ingredients"
          aria-controls="panel-ingredients"
          aria-selected={tab === "ingredients"}
          onClick={() => setTab("ingredients")}
          className={tabClass(tab === "ingredients")}
        >
          Ingredients
        </button>
        <button
          role="tab"
          id="tab-nutrition"
          aria-controls="panel-nutrition"
          aria-selected={tab === "nutrition"}
          onClick={() => setTab("nutrition")}
          className={tabClass(tab === "nutrition")}
        >
          Nutrition
        </button>
        <button
          role="tab"
          aria-selected={false}
          disabled
          aria-disabled
          className="-mb-px flex cursor-not-allowed items-center gap-1.5 border-b-2 border-transparent py-3 text-[15px] font-medium text-muted opacity-50"
        >
          Processing
          <span className="rounded-full bg-line px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.09em] text-muted">
            Soon
          </span>
        </button>
      </div>

      {/* Both panels stay mounted (inactive one hidden) so streaming keeps flowing into the
          Ingredients list while the user reads Nutrition, and row animations don't replay. */}
      <div
        id="panel-ingredients"
        role="tabpanel"
        aria-labelledby="tab-ingredients"
        hidden={tab !== "ingredients"}
      >
        {empty ? (
          <div className="mt-8 flex items-center gap-3 text-muted">
            <Spinner />
            <span className="text-sm">Analysing the first ingredients…</span>
          </div>
        ) : (
          <>
            <ReadStrip ingredients={ingredients} summary={productSummary} loading={loading} />

            {/* One container, not one card per ingredient — an index, not a stack. */}
            <ul className="mt-4 overflow-hidden rounded-2xl border border-line bg-paper shadow-card [&>li+li]:border-t [&>li+li]:border-line">
              {ingredients.map((ing, i) => (
                <IngredientRow key={i} ingredient={ing} index={i} />
              ))}
              {loading && (
                <li className="flex list-none items-center gap-3 border-t border-line px-4 py-3.5 text-muted sm:px-5">
                  <Spinner />
                  <span className="text-sm">Analysing the rest…</span>
                </li>
              )}
            </ul>
          </>
        )}
      </div>
      <div
        id="panel-nutrition"
        role="tabpanel"
        aria-labelledby="tab-nutrition"
        hidden={tab !== "nutrition"}
      >
        <NutritionPanel nutrition={nutrition} productName={productName} cacheKey={cacheKey} />
      </div>
    </section>
  );
}

// The product read strip (Order F2): live counts, the one-sentence product summary, and the
// reassurance line. Plain typography on canvas — a table of contents, not a report card.
// Counts are computed here in code; the model never counts (CLAUDE.md).
function ReadStrip({
  ingredients,
  summary,
  loading,
}: {
  ingredients: Partial<Ingredient>[];
  summary?: string;
  loading: boolean;
}) {
  const total = ingredients.length;
  const natural = ingredients.filter((i) => i.tag === "Natural").length;
  const processed = ingredients.filter((i) => i.tag === "Processed").length;

  return (
    <div className="mt-5">
      <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[13px] tabular-nums text-muted">
        <span className="font-medium text-ink">
          {total} {total === 1 ? "ingredient" : "ingredients"}
        </span>
        <span aria-hidden className="text-line">
          ·
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-natural" />
          {natural} natural
        </span>
        <span aria-hidden className="text-line">
          ·
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-processed" />
          {processed} processed
        </span>
      </p>

      {summary ? (
        <p className="mt-2.5 animate-rise text-[15px] leading-[1.6] text-ink/80">{summary}</p>
      ) : (
        loading && (
          <p className="mt-2.5 flex items-center gap-2 text-[13px] text-muted">
            <Spinner className="h-3.5 w-3.5" />
            Reading the formulation…
          </p>
        )
      )}

      <p className="mt-2.5 text-xs text-muted">
        An explanation, not a verdict — tap any ingredient for the full story.
      </p>
    </div>
  );
}

function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <span
      className={`${className} animate-spin rounded-full border-2 border-line border-t-natural`}
      aria-hidden
    />
  );
}
