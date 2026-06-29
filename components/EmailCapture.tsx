"use client";

import { useState } from "react";

export function EmailCapture() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!email.trim() || busy) return;
    setBusy(true);
    try {
      await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      setDone(true);
    } catch {
      // Email capture is best-effort; still confirm to the user.
      setDone(true);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return <p className="mt-10 text-center text-sm text-natural">You&apos;re on the list.</p>;
  }

  return (
    <div className="mt-12 rounded-xl border border-line bg-paper p-6 text-center">
      <p className="text-ink">Get early access to the Baloo app</p>
      <p className="mt-1 text-sm text-muted">Be first to know when we launch on iOS and Android.</p>
      <div className="mx-auto mt-4 flex max-w-sm flex-col gap-2 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder="you@email.com"
          aria-label="Email address"
          className="flex-1 rounded-lg border border-line bg-canvas px-4 py-2.5 text-ink outline-none focus:border-natural focus:ring-2 focus:ring-natural/20"
        />
        <button
          onClick={submit}
          disabled={busy}
          className="rounded-lg bg-natural px-5 py-2.5 font-medium text-paper transition hover:bg-natural/90 disabled:opacity-50"
        >
          Notify me
        </button>
      </div>
    </div>
  );
}
