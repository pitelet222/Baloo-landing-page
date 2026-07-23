"use client";

// Report dialog (Order G9): a compact reason picker → POST /api/reports. Neutral, no alarm.

import { useState } from "react";
import { Modal } from "@/components/Modal";

const REASONS: { value: string; label: string }[] = [
  { value: "spam", label: "Spam" },
  { value: "abuse", label: "Abuse or harassment" },
  { value: "off_topic", label: "Off-topic" },
  { value: "other", label: "Other" },
];

export function ReportDialog({
  targetType,
  targetId,
  onClose,
}: {
  targetType: "comment" | "list";
  targetId: string;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("spam");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId, reason }),
      });
      setDone(true);
      setTimeout(onClose, 1200);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal onClose={onClose} labelledBy="report-dialog-title" panelClassName="max-w-sm p-5">
      {done ? (
          <p className="py-4 text-center text-sm text-ink">Thanks — a moderator will take a look.</p>
        ) : (
          <>
            <h2 id="report-dialog-title" className="font-display text-xl text-ink">
              Report this {targetType}
            </h2>
            <p className="mt-1 text-sm text-muted">Tell us what&apos;s wrong. This is private.</p>
            <div className="mt-4 space-y-1.5">
              {REASONS.map((r) => (
                <label
                  key={r.value}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition ${
                    reason === r.value ? "border-ink bg-ink/5 text-ink" : "border-line text-ink/70 hover:bg-canvas"
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={() => setReason(r.value)}
                    className="accent-ink"
                  />
                  {r.label}
                </label>
              ))}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-3.5 py-1.5 text-[13px] font-medium text-muted transition hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={busy}
                className="rounded-lg bg-ink px-4 py-1.5 text-[13px] font-medium text-paper transition hover:bg-ink/85 disabled:opacity-40"
              >
                Submit report
              </button>
            </div>
          </>
        )}
    </Modal>
  );
}
