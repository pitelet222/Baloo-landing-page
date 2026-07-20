"use client";

// Shared publish/social gate for client controls (Order S2). Baloo lets guests analyse, but every
// community write requires a REAL (non-anonymous) account — the server enforces it with
// requireVerifiedUser (403 "verify_required"). This mirrors that on the client so a guest gets a
// calm "Save your account" prompt instead of a silent failure. Usage:
//
//   const gate = useAuthGate();
//   if (!gate.available) return null;               // Supabase off — render nothing, as before
//   ...
//   if (!gate.ensureVerified()) return;             // opens the right modal, stops the action
//   const res = await fetch(...);
//   if (res.status === 403) gate.promptUpgrade();   // defensive: stale client state
//   ...
//   return (<>{ ... }{gate.modal}</>);

import { useCallback, useState } from "react";
import { useAuth } from "./useAuth";
import { AuthModal, type AuthMode } from "./AuthModal";

export function useAuthGate() {
  const { available, user, profile, refresh } = useAuth();
  const [mode, setMode] = useState<AuthMode | null>(null);

  // True if the caller may proceed; otherwise opens the right modal and returns false.
  const ensureVerified = useCallback((): boolean => {
    if (!user) {
      setMode("signin"); // signed out entirely
      return false;
    }
    if (user.isAnonymous) {
      setMode("upgrade"); // signed in, but only as a guest → prompt an upgrade to a real account
      return false;
    }
    return true;
  }, [user]);

  const promptUpgrade = useCallback(() => setMode("upgrade"), []);

  const modal = mode ? (
    <AuthModal
      mode={mode}
      onClose={() => setMode(null)}
      onDone={() => {
        setMode(null);
        refresh();
      }}
    />
  ) : null;

  return { available, user, profile, refresh, ensureVerified, promptUpgrade, modal };
}
