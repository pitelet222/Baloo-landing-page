"use client";

import { useState } from "react";
import { validateUrl } from "@/lib/retailers";

export function UrlForm({
  onAnalyze,
  busy,
}: {
  onAnalyze: (url: string) => void;
  busy: boolean;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit() {
    const check = validateUrl(value);
    if (!check.ok) {
      setError(check.reason);
      return;
    }
    setError(null);
    onAnalyze(value.trim());
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="flex flex-col gap-2 rounded-2xl border border-line bg-paper p-2 shadow-hero transition focus-within:border-natural/50 focus-within:ring-4 focus-within:ring-natural/10 sm:flex-row sm:items-center sm:gap-0 sm:rounded-full sm:py-1.5 sm:pl-5 sm:pr-1.5">
        <input
          type="url"
          inputMode="url"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder="Paste a supermarket product link…"
          aria-label="Supermarket product link"
          className="min-w-0 flex-1 bg-transparent px-4 py-3 text-ink outline-none placeholder:text-muted/70 sm:px-0"
        />
        <button
          onClick={submit}
          disabled={busy}
          className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-ink px-6 py-3 font-medium text-paper transition hover:bg-ink/85 disabled:cursor-not-allowed disabled:opacity-60 sm:rounded-full"
        >
          {busy && (
            <span
              className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-paper/40 border-t-paper"
              aria-hidden
            />
          )}
          {busy ? "Reading…" : "Analyse"}
        </button>
      </div>
      {error && (
        <p className="mt-2.5 text-center text-sm text-processed" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
