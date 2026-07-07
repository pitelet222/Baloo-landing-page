"use client";

import { useState } from "react";

// The one live social action in G4: share a list's URL (native share sheet, else copy to
// clipboard). Follow/Save/discussion are designed but deferred to G6–G8.
export function ShareButton({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = typeof window !== "undefined" ? window.location.origin + path : path;
    if (navigator.share) {
      try {
        await navigator.share({ url });
        return;
      } catch {
        /* user dismissed — fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked — nothing else to do */
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className="rounded-full border border-line bg-paper px-4 py-1.5 text-[13px] font-medium text-ink transition hover:border-ink/20"
    >
      {copied ? "Link copied" : "Share"}
    </button>
  );
}
