"use client";

// The interactive half of /settings (Order S7a). Kept as a small island so the page itself stays a
// server component.

import { useState } from "react";
import { DeleteAccountDialog } from "@/components/account/DeleteAccountDialog";

export function SettingsClient({ handle }: { handle: string }) {
  const [confirming, setConfirming] = useState(false);

  return (
    <>
      <div className="mt-8 rounded-2xl border border-line bg-paper p-5 shadow-card">
        <h2 className="font-display text-lg text-ink">Delete account</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">
          Deletes your email, profile, private lists, saves and follows, and clears the text of your
          comments. Public lists you made stay, without your name on them, so links other people
          saved keep working.
        </p>
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="mt-4 rounded-full border border-line bg-paper px-4 py-2 text-sm font-medium text-ink transition hover:border-ink/20"
        >
          Delete account…
        </button>
      </div>

      {confirming && (
        <DeleteAccountDialog handle={handle} onClose={() => setConfirming(false)} />
      )}
    </>
  );
}
