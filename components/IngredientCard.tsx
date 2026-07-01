import type { Ingredient } from "@/lib/schema";

export function IngredientCard({
  ingredient,
  index,
}: {
  ingredient: Partial<Ingredient>;
  index: number;
}) {
  const isProcessed = ingredient.tag === "Processed";

  return (
    <li className="animate-rise rounded-2xl border border-line bg-paper p-5 shadow-card transition duration-200 hover:shadow-card-hover">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-baseline gap-2.5">
          <span className="text-sm tabular-nums text-muted/70">
            {String(index + 1).padStart(2, "0")}
          </span>
          <h3 className="font-display text-lg text-ink">{ingredient.name ?? "…"}</h3>
          {ingredient.percentage && (
            <span className="rounded-md bg-canvas px-1.5 py-0.5 text-xs font-medium tabular-nums text-muted">
              {ingredient.percentage}
            </span>
          )}
        </div>
        {ingredient.tag && (
          <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
              isProcessed ? "bg-processed-soft text-processed" : "bg-natural-soft text-natural"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${isProcessed ? "bg-processed" : "bg-natural"}`}
              aria-hidden
            />
            {ingredient.tag}
          </span>
        )}
      </div>

      {ingredient.what_it_is && (
        <p className="mt-3 text-sm leading-relaxed text-ink/80">{ingredient.what_it_is}</p>
      )}
      {ingredient.why_its_here && (
        <p className="mt-2 text-sm leading-relaxed text-muted">
          <span className="font-medium text-ink/70">In this product: </span>
          {ingredient.why_its_here}
        </p>
      )}
      {ingredient.percentage_note && (
        <p className="mt-2.5 border-t border-line/70 pt-2.5 text-xs leading-relaxed text-muted">
          {ingredient.percentage_note}
        </p>
      )}
    </li>
  );
}
