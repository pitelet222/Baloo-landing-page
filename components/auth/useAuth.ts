"use client";

// Client auth state (Order G2): /api/me is the source of truth, re-fetched on every Supabase
// auth event. `available: false` means Supabase env isn't configured — auth UI renders nothing
// and the site behaves exactly as pre-G2.

import { useCallback, useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { Profile } from "@/lib/db/schema";

export type AuthUser = { id: string; email: string | null; isAnonymous: boolean };

export type AuthState = {
  loading: boolean;
  available: boolean;
  user: AuthUser | null;
  profile: Profile | null;
};

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    loading: true,
    available: false,
    user: null,
    profile: null,
  });

  const refresh = useCallback(async () => {
    const sb = supabaseBrowser();
    if (!sb) {
      setState({ loading: false, available: false, user: null, profile: null });
      return;
    }
    try {
      const res = await fetch("/api/me");
      const data = await res.json();
      setState({ loading: false, available: true, user: data.user, profile: data.profile });
    } catch {
      setState((s) => ({ ...s, loading: false, available: true }));
    }
  }, []);

  useEffect(() => {
    refresh();
    const sb = supabaseBrowser();
    if (!sb) return;
    const { data } = sb.auth.onAuthStateChange(() => {
      refresh();
    });
    return () => data.subscription.unsubscribe();
  }, [refresh]);

  return { ...state, refresh };
}
