"use client";

// Upvote (Order G7, D-G7/G8 handoff §2). One direction only — agreement, not a rating; there is
// deliberately NO downvote. Neutral ink-tinted states: green/amber stay reserved for ingredient
// classification. Colour-only ~0.2s transition — Baloo doesn't press-animate.

import { useState } from "react";
import { useAuth } from "@/components/auth/useAuth";
import { AuthModal } from "@/components/auth/AuthModal";

export function UpvotePill({
  targetType,
  targetId,
  initialCount,
  initialVoted,
  withLabel = false,
  size = "sm",
}: {
  targetType: "product" | "list";
  targetId: string;
  initialCount: number;
  initialVoted: boolean;
  withLabel?: boolean; // the product bar spells out "Upvote"
  size?: "sm" | "md";
}) {
  const { available, user, refresh } = useAuth();
  const [voted, setVoted] = useState(initialVoted);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  if (!available) return null;

  async function toggle() {
    if (!user) return setAuthOpen(true);
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
      }
    } catch {
      setVoted(!nextVoted);
      setCount((c) => c + (nextVoted ? -1 : 1));
    } finally {
      setBusy(false);
    }
  }

  const pad = size === "md" ? "px-4 py-1.5 text-[13px]" : "px-3 py-1 text-xs";
  const glyph = size === "md" ? "h-3.5 w-3.5" : "h-3 w-3";

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
        {withLabel && <span>Upvote</span>}
        <span className="tabular-nums">{count}</span>
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
