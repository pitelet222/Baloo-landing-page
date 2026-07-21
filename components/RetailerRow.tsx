import { SUPPORTED_RETAILERS } from "@/lib/config";

// The hero eyebrow (Order L1b, V3): a short green rule + the supported retailers, small and calm.
export function RetailerRow() {
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium uppercase tracking-[0.1em] text-natural">
      <span aria-hidden className="h-px w-6 shrink-0 bg-natural" />
      {SUPPORTED_RETAILERS.map((r, i) => (
        <span key={r.name} className="flex items-center gap-2">
          {r.name}
          {i < SUPPORTED_RETAILERS.length - 1 && (
            <span aria-hidden className="text-natural/40">
              &middot;
            </span>
          )}
        </span>
      ))}
    </p>
  );
}
