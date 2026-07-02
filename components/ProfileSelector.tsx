"use client";

import { useEffect, useRef, useState } from "react";
import {
  DEFAULT_PROFILE_ID,
  PROFILES,
  getProfile,
  loadProfileId,
  saveProfileId,
  type Profile,
} from "@/lib/profile";

// Hydration-safe profile state: the server (and first client render) shows the default,
// the persisted choice is adopted after mount, and changes persist to localStorage.
// The Nutrition tab (Order B4) wires this hook to the selector and the table.
export function useProfile(): [Profile, (p: Profile) => void] {
  const [profile, setProfile] = useState<Profile>(() => getProfile(DEFAULT_PROFILE_ID));

  useEffect(() => {
    const stored = loadProfileId();
    if (stored) setProfile(getProfile(stored));
  }, []);

  function update(p: Profile) {
    setProfile(p);
    saveProfileId(p.id);
  }

  return [profile, update];
}

// Compact "Showing context for: [Adult ▾]" pill + dropdown.
export function ProfileSelector({
  value,
  onChange,
}: {
  value: Profile;
  onChange: (p: Profile) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-full border border-line bg-paper px-3.5 py-2 text-[13px] transition hover:border-ink/20"
      >
        <span className="text-muted">Showing context for</span>
        <span className="font-medium text-ink">{value.label}</span>
        <svg
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
          className={`h-3 w-3 text-muted transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M2.5 4.5L6 8l3.5-3.5" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Reference profile"
          className="absolute left-0 z-10 mt-2 min-w-[230px] rounded-xl border border-line bg-paper p-1.5 shadow-hero"
        >
          {PROFILES.map((p) => (
            <li key={p.id} role="option" aria-selected={p.id === value.id}>
              <button
                type="button"
                onClick={() => {
                  onChange(p);
                  setOpen(false);
                }}
                className={`w-full rounded-lg px-2.5 py-2 text-left transition hover:bg-canvas ${
                  p.id === value.id ? "bg-canvas" : ""
                }`}
              >
                <span className="block text-sm font-medium text-ink">{p.label}</span>
                <span className="block text-xs tabular-nums text-muted">
                  {p.kcal.toLocaleString("en-GB")} kcal reference
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
