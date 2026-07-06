"use client";

// Browser Supabase client (Order G2). Lazy and null when env is absent — the app must run with
// no Supabase configured (same optional-infra rule as the DB and the cache). The anon /
// publishable key is public BY DESIGN (Supabase's model: safety comes from RLS, not key
// secrecy); the Vercel↔Supabase integration provides both key styles, so we accept either.

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function supabaseBrowser(): SupabaseClient | null {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  client = createBrowserClient(url, key);
  return client;
}
