"use client";

// Follow / unfollow (Order G6). Signed-out → the G2 AuthModal; own profile → render nothing.
// "Following" shows "Unfollow" on hover — the shipped quiet-state language, no confirmation
// theatre for a reversible action.

import { useState } from "react";
import { useAuthGate } from "@/components/auth/useAuthGate";

export function FollowButton({
  profileId,
  initialFollowing,
  ghost = false,
  onChange,
}: {
  profileId: string;
  initialFollowing: boolean;
  ghost?: boolean; // empty-state suggested-curator rows use the ghost treatment
  onChange?: (following: boolean) => void;
}) {
  const { available, user, ensureVerified, promptUpgrade, modal } = useAuthGate();
  const [following, setFollowing] = useState(initialFollowing);
  const [hover, setHover] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!available || user?.id === profileId) return null;

  async function toggle() {
    if (!ensureVerified()) return; // signed out → sign in; guest → upgrade prompt
    if (busy) return;
    setBusy(true);
    const next = !following;
    setFollowing(next); // optimistic
    try {
      const res = next
        ? await fetch("/api/follows", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ followingId: profileId }),
          })
        : await fetch(`/api/follows?followingId=${profileId}`, { method: "DELETE" });
      if (!res.ok) {
        setFollowing(!next); // revert on failure
        if (res.status === 403) promptUpgrade(); // guest tried to follow
      } else onChange?.(next);
    } catch {
      setFollowing(!next);
    } finally {
      setBusy(false);
    }
  }

  const cls = following
    ? "border border-line bg-paper text-muted hover:border-ink/20 hover:text-ink"
    : ghost
      ? "border border-line bg-paper text-ink hover:bg-canvas"
      : "bg-ink text-paper hover:bg-ink/85";

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        disabled={busy}
        className={`rounded-full px-4 py-1.5 text-[13px] font-medium transition disabled:opacity-60 ${cls}`}
      >
        {following ? (hover ? "Unfollow" : "Following") : "Follow"}
      </button>
      {modal}
    </>
  );
}
