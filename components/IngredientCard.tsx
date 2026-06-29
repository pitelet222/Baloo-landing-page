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
    <li className="animate-rise rounded-xl border border-line bg-paper p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <span className="text-sm tabular-nums text-muted">{index + 1}</span>
          <h3 className="font-display text-lg text-ink">{ingredient.name ?? "…"}</h3>
          {ingredient.percentage && (
            <span className="text-sm text-muted">{ingredient.percentage}</span>
          )}
        </div>
        {ingredient.tag && (
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
              isProcessed
                ? "bg-processed-soft text-processed"
                : "bg-natural-soft text-natural"
            }`}
          >
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
        <p className="mt-2 text-xs text-muted">{ingredient.percentage_note}</p>
      )}
    </li>
  );
}
