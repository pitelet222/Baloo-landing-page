import Link from "next/link";
import { Wordmark } from "./Wordmark";
import { AccountMenu } from "./auth/AccountMenu";
import { AdminNavLink } from "./AdminNavLink";

// The shared page header (Order G5) — one component instead of seven hand-copied headers.
// variant "center": homepage/welcome hero style (wordmark centered, controls floated right;
// nav links hide on mobile to avoid crowding the centered mark). variant "left": app pages
// (wordmark left, everything right). `action` is the page-specific control slot (Edit / Done /
// Add to list), rendered before the account menu.
export function SiteHeader({
  variant = "left",
  action,
  showNav = true,
}: {
  variant?: "left" | "center";
  action?: React.ReactNode;
  showNav?: boolean;
}) {
  // V3 pill nav (Order L1b): quiet rounded links that warm on hover. The active state is left to
  // the pages for now (L1d's sticky shell can wire `usePathname`).
  const pill =
    "rounded-full px-3 py-1.5 text-[13px] font-medium text-muted transition hover:bg-canvas hover:text-ink";
  const nav = showNav && (
    <nav
      className={`items-center gap-1 ${variant === "center" ? "hidden sm:flex" : "flex"}`}
      aria-label="Site"
    >
      <Link href="/feed" className={pill}>
        Following
      </Link>
      <Link href="/discover" className={pill}>
        Discover
      </Link>
      <Link href="/lists" className={pill}>
        Lists
      </Link>
      <AdminNavLink />
    </nav>
  );

  const right = (
    <div className="flex items-center gap-3">
      {nav}
      {action}
      <AccountMenu />
    </div>
  );

  if (variant === "center") {
    return (
      <header className="relative flex items-center justify-center pt-8 sm:pt-10">
        <Link href="/" aria-label="Baloo home">
          <Wordmark className="text-xl" />
        </Link>
        <div className="absolute right-0">{right}</div>
      </header>
    );
  }

  return (
    <header className="flex items-center justify-between gap-3 pt-8 sm:pt-10">
      <Link href="/" aria-label="Baloo home">
        <Wordmark className="text-xl" />
      </Link>
      {right}
    </header>
  );
}
