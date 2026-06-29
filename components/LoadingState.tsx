export function LoadingState({ phase }: { phase: "reading" | "analyzing" }) {
  const label = phase === "reading" ? "Reading ingredients…" : "Analysing with AI…";
  return (
    <div className="mt-10 flex items-center justify-center gap-3 text-muted">
      <span
        className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-natural"
        aria-hidden
      />
      <span className="text-sm">{label}</span>
    </div>
  );
}
