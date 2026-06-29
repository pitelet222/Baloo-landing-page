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
    <div>
      <div className="flex flex-col gap-2 sm:flex-row">
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
          className="flex-1 rounded-lg border border-line bg-paper px-4 py-3 text-ink outline-none transition focus:border-natural focus:ring-2 focus:ring-natural/20"
        />
        <button
          onClick={submit}
          disabled={busy}
          className="rounded-lg bg-ink px-6 py-3 font-medium text-paper transition hover:bg-ink/85 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Reading…" : "Analyse"}
        </button>
      </div>
      {error && (
        <p className="mt-2 text-sm text-processed" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
