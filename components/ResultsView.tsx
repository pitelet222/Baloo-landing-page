"use client";

import { useState } from "react";
import type { Ingredient, Nutrition } from "@/lib/schema";
import { IngredientCard } from "./IngredientCard";
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
  loading = false,
}: {
  productName: string;
  retailer: string;
  sourceUrl: string;
  count: number;
  ingredients: Partial<Ingredient>[];
  nutrition?: Nutrition;
  cacheKey?: string;
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
        <h2 className="mt-2 font-display text-3xl leading-tight text-ink">{productName}</h2>
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
          Ingredients list while the user reads Nutrition, and card animations don't replay. */}
      <div
        id="panel-ingredients"
        role="tabpanel"
        aria-labelledby="tab-ingredients"
        hidden={tab !== "ingredients"}
      >
        {empty ? (
          <AnalysingRow className="mt-8" label="Analysing the first ingredients…" />
        ) : (
          <>
            <ul className="mt-6 flex flex-col gap-3">
              {ingredients.map((ing, i) => (
                <IngredientCard key={i} ingredient={ing} index={i} />
              ))}
            </ul>
            {loading && <AnalysingRow className="mt-4" label="Analysing the rest…" />}
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

function AnalysingRow({ className = "", label }: { className?: string; label: string }) {
  return (
    <div className={`flex items-center gap-3 text-muted ${className}`}>
      <span
        className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-natural"
        aria-hidden
      />
      <span className="text-sm">{label}</span>
    </div>
  );
}
