import { SUPPORTED_RETAILERS } from "@/lib/config";

export function RetailerRow() {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-sm text-muted">
      <span className="text-muted/80">Works with</span>
      {SUPPORTED_RETAILERS.map((r, i) => (
        <span key={r.name} className="flex items-center gap-2.5">
          <span className="text-ink/70">{r.name}</span>
          {i < SUPPORTED_RETAILERS.length - 1 && (
            <span aria-hidden className="text-line">
              &middot;
            </span>
          )}
        </span>
      ))}
    </div>
  );
}
