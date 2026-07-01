import type { Ingredient } from "@/lib/schema";
import { IngredientCard } from "./IngredientCard";

export function ResultsView({
  productName,
  retailer,
  sourceUrl,
  count,
  ingredients,
  loading = false,
}: {
  productName: string;
  retailer: string;
  sourceUrl: string;
  count: number;
  ingredients: Partial<Ingredient>[];
  loading?: boolean;
}) {
  const empty = ingredients.length === 0;

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
