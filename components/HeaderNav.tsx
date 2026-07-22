"use client";

// The app-shell section nav (Order L1d) — the pill links in the sticky header, with the current
// section marked active. Client because it reads `usePathname()` for the active state and `useAuth()`
// to gate the admin link (folds in the old AdminNavLink, which was header-only). DESIGN.md: the active
// nav item is `ink`, inactive is `muted`.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/useAuth";

const LINKS = [
  { href: "/feed", label: "Following" },
  { href: "/discover", label: "Discover" },
  { href: "/lists", label: "Lists" },
] as const;

const base = "rounded-full px-3 py-1.5 text-[13px] font-medium transition";

export function HeaderNav({ className = "" }: { className?: string }) {
  const pathname = usePathname() ?? "";
  const { profile } = useAuth();

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const cls = (href: string) =>
    `${base} ${
      isActive(href) ? "bg-line/60 text-ink" : "text-muted hover:bg-line/40 hover:text-ink"
    }`;

  return (
    <nav className={`items-center gap-1 ${className}`} aria-label="Site">
      {LINKS.map((l) => (
        <Link key={l.href} href={l.href} className={cls(l.href)} aria-current={isActive(l.href) ? "page" : undefined}>
          {l.label}
        </Link>
      ))}
      {profile?.isAdmin && (
        <Link href="/admin" className={cls("/admin")} aria-current={isActive("/admin") ? "page" : undefined}>
          Admin
        </Link>
      )}
    </nav>
  );
}
