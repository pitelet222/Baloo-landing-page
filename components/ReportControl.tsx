"use client";

// A standalone Report affordance (Order G9) for surfaces without an overflow menu (the list
// page header). Signed-out → AuthModal; signed-in → the reason dialog.

import { useState } from "react";
import { useAuth } from "@/components/auth/useAuth";
import { AuthModal } from "@/components/auth/AuthModal";
import { ReportDialog } from "@/components/ReportDialog";

export function ReportControl({
  targetType,
  targetId,
}: {
  targetType: "comment" | "list";
  targetId: string;
}) {
  const { available, user, refresh } = useAuth();
  const [dialog, setDialog] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  if (!available) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => (user ? setDialog(true) : setAuthOpen(true))}
        className="rounded-full border border-line bg-paper px-3.5 py-1.5 text-[13px] font-medium text-muted transition hover:border-ink/20 hover:text-ink"
      >
        Report
      </button>
      {dialog && <ReportDialog targetType={targetType} targetId={targetId} onClose={() => setDialog(false)} />}
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
