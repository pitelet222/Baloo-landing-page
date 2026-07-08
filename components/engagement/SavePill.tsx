"use client";

// Save (Order G7, D-G7/G8 handoff §3): bookmark a list to your profile. Same neutral ink-tinted
// state system as the upvote — never colour-coded.

import { useState } from "react";
import { useAuth } from "@/components/auth/useAuth";
import { AuthModal } from "@/components/auth/AuthModal";

export function SavePill({
  listId,
  initialSaved,
}: {
  listId: string;
  initialSaved: boolean;
}) {
  const { available, user, refresh } = useAuth();
  const [saved, setSaved] = useState(initialSaved);
  const [busy, setBusy] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  if (!available) return null;

  async function toggle() {
    if (!user) return setAuthOpen(true);
    if (busy) return;
    setBusy(true);
    const next = !saved;
    setSaved(next); // optimistic
    try {
      const res = next
        ? await fetch("/api/saves", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ listId }),
          })
        : await fetch(`/api/saves?listId=${listId}`, { method: "DELETE" });
      if (!res.ok) setSaved(!next);
    } catch {
      setSaved(!next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        aria-pressed={saved}
        disabled={busy}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors duration-200 disabled:opacity-60 ${
          saved
            ? "border-ink bg-ink/5 text-ink"
            : "border-line bg-paper text-muted hover:border-ink/20 hover:text-ink"
        }`}
      >
        <svg
          viewBox="0 0 12 14"
          fill={saved ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
          aria-hidden
          className="h-3.5 w-3"
        >
          <path d="M2 1.5h8a.5.5 0 01.5.5v10.5L6 9.5l-4.5 3V2a.5.5 0 01.5-.5z" />
        </svg>
        {saved ? "Saved" : "Save"}
      </button>
      {authOpen && (
        <AuthModal
          mode="signin"
          onClose={() => setAuthOpen(false)}
          onDone={() => {
            setAuthOpen(false);
            refresh();
          }}
        />
      )}
    </>
  );
}
