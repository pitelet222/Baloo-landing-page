export function LoadingState({ phase }: { phase: "reading" | "analyzing" }) {
  const label = phase === "reading" ? "Reading ingredients…" : "Analysing with AI…";
  const sub =
    phase === "reading"
      ? "Fetching the product page and finding the label."
      : "Explaining each ingredient in plain language.";

  return (
    <div className="mt-14 flex flex-col items-center gap-3 text-center animate-fade-in">
      <span
        className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-natural"
        aria-hidden
      />
      <div>
        <p className="text-sm font-medium text-ink">{label}</p>
        <p className="mt-0.5 text-sm text-muted">{sub}</p>
      </div>
    </div>
  );
}
