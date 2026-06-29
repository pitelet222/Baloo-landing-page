import { SUPPORTED_RETAILERS } from "@/lib/config";

export function RetailerRow() {
  return (
    <p className="mt-5 text-center text-sm text-muted">
      Works with{" "}
      {SUPPORTED_RETAILERS.map((r, i) => (
        <span key={r.name}>
          <span className="text-ink/70">{r.name}</span>
          {i < SUPPORTED_RETAILERS.length - 1 ? ", " : ""}
        </span>
      ))}
    </p>
  );
}
