"use client";

// Admin-only nav entry (Order G9) — renders nothing for everyone else. Client-side because the
// shared header is otherwise static; reuses the /api/me-backed auth state.
import Link from "next/link";
import { useAuth } from "@/components/auth/useAuth";

export function AdminNavLink() {
  const { profile } = useAuth();
  if (!profile?.isAdmin) return null;
  return (
    <Link href="/admin" className="transition hover:text-ink">
      Admin
    </Link>
  );
}
