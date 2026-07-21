"use client";

// Comment upvote (Order G7; comment-only since L6 — Save is the one signal on lists/products).
// Agreement inside a discussion, drives the thread's "Top" sort. One direction only — there is
// deliberately NO downvote. Neutral ink-tinted states: green/amber stay reserved for ingredient
// classification. Colour-only ~0.2s transition — Baloo doesn't press-animate.

import { useState } from "react";
import { useAuthGate } from "@/components/auth/useAuthGate";

export function UpvotePill({
  targetType,
  targetId,
  initialCount,
  initialVoted,
  size = "sm",
}: {
  targetType: "comment";
  targetId: string;
  initialCount: number;
  initialVoted: boolean;
  size?: "xs" | "sm";
}) {
  const { available, ensureVerified, promptUpgrade, modal } = useAuthGate();
  const [voted, setVoted] = useState(initialVoted);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);

  if (!available) return null;

  async function toggle() {
    if (!ensureVerified()) return; // signed out → sign in; guest → upgrade prompt
    if (busy) return;
    setBusy(true);
    const nextVoted = !voted;
    setVoted(nextVoted);
    setCount((c) => c + (nextVoted ? 1 : -1)); // optimistic
    try {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId }),
      });
      if (res.ok) {
        const data = await res.json();
        setVoted(data.voted);
        setCount(data.count);
      } else {
        setVoted(!nextVoted);
        setCount((c) => c + (nextVoted ? -1 : 1));
        if (res.status === 403) promptUpgrade(); // guest tried to upvote
      }
    } catch {
      setVoted(!nextVoted);
      setCount((c) => c + (nextVoted ? -1 : 1));
    } finally {
      setBusy(false);
    }
  }

  const pad = size === "xs" ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-xs";
  const glyph = size === "xs" ? "h-2.5 w-2.5" : "h-3 w-3";

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        aria-pressed={voted}
        disabled={busy}
        className={`inline-flex items-center gap-1.5 rounded-full border font-medium transition-colors duration-200 disabled:opacity-60 ${pad} ${
          voted
            ? "border-ink bg-ink/5 text-ink"
            : "border-line bg-paper text-muted hover:border-ink/20 hover:text-ink"
        }`}
      >
        <svg
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
          className={glyph}
        >
          <path d="M2.5 7.5L6 4l3.5 3.5" />
        </svg>
        <span className="tabular-nums">{count}</span>
      </button>
      {modal}
    </>
  );
}
