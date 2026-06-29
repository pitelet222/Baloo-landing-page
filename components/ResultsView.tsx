import type { Ingredient } from "@/lib/schema";
import { IngredientCard } from "./IngredientCard";

export function ResultsView({
  productName,
  retailer,
  sourceUrl,
  count,
  ingredients,
}: {
  productName: string;
  retailer: string;
  sourceUrl: string;
  count: number;
  ingredients: Partial<Ingredient>[];
}) {
  return (
    <section className="mt-10">
      <header className="border-b border-line pb-5">
        <h2 className="font-display text-2xl text-ink">{productName}</h2>
        <p className="mt-1 text-sm text-muted">
          {retailer}
          {sourceUrl && (
            <>
              {" · "}
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-line underline-offset-2 hover:text-ink"
              >
                View on retailer
              </a>
            </>
          )}
        </p>
        <p className="mt-3 text-sm text-ink/70">
          {count} {count === 1 ? "ingredient" : "ingredients"}, in label order — listed most to
          least by quantity.
        </p>
      </header>

      <ul className="mt-5 flex flex-col gap-3">
        {ingredients.map((ing, i) => (
          <IngredientCard key={i} ingredient={ing} index={i} />
        ))}
      </ul>
    </section>
  );
}
