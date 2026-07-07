import Link from "next/link";
import { Wordmark } from "./Wordmark";
import { AccountMenu } from "./auth/AccountMenu";

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
  const nav = showNav && (
    <nav
      className={`items-center gap-3 text-[13px] font-medium text-muted ${
        variant === "center" ? "hidden sm:flex" : "flex"
      }`}
      aria-label="Site"
    >
      <Link href="/discover" className="transition hover:text-ink">
        Discover
      </Link>
      <Link href="/lists" className="transition hover:text-ink">
        Lists
      </Link>
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
