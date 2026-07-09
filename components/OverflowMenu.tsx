"use client";

// A small "…" popover (Order G9): the shared home for secondary/destructive actions (Report,
// Delete). Closes on outside-click or Escape. Items are plain buttons passed as children.

import { useEffect, useRef, useState } from "react";

export function OverflowMenu({
  label = "More",
  children,
  align = "right",
}: {
  label?: string;
  children: (close: () => void) => React.ReactNode;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-7 w-7 items-center justify-center rounded-full text-muted transition hover:bg-canvas hover:text-ink"
      >
        <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden className="h-4 w-4">
          <circle cx="3" cy="8" r="1.4" />
          <circle cx="8" cy="8" r="1.4" />
          <circle cx="13" cy="8" r="1.4" />
        </svg>
      </button>
      {open && (
        <div
          role="menu"
          className={`absolute z-20 mt-1 min-w-[9rem] overflow-hidden rounded-lg border border-line bg-paper py-1 shadow-card ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export function OverflowItem({
  onClick,
  children,
  danger = false,
}: {
  onClick: () => void;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`block w-full px-3.5 py-2 text-left text-[13px] font-medium transition hover:bg-canvas ${
        danger ? "text-processed" : "text-ink"
      }`}
    >
      {children}
    </button>
  );
}
