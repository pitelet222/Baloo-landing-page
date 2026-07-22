import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";
import { db } from "@/lib/db";
import { getListsByOwnerWithCounts } from "@/lib/db/queries/lists";
import { SiteHeader } from "@/components/SiteHeader";
import { ListCard } from "@/components/lists/ListCard";

export const metadata: Metadata = { title: "Your lists — Baloo" };

// "My lists" (Order G4). Signed-out and handle-pending states guide the user to the next step.
export default async function MyListsPage() {
  const auth = await getCurrentProfile();
  const dbi = db();
  const lists =
    auth?.profile && dbi ? await getListsByOwnerWithCounts(dbi, auth.profile.id) : [];

  return (
    <div className="relative flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-tool flex-1 flex-col px-5 pt-8">
        <section className="mt-10 animate-fade-in">
          <div className="flex items-center justify-between gap-3">
            <h1 className="font-display text-2xl text-ink">Your lists</h1>
            {auth?.profile && (
              <Link
                href="/lists/new"
                className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:bg-ink/85"
              >
                New list
              </Link>
            )}
          </div>

          {!auth ? (
            <div className="mt-8 rounded-2xl border border-line bg-paper p-8 text-center shadow-card">
              <p className="font-display text-lg text-ink">Keep the good stuff</p>
              <p className="mx-auto mt-1.5 max-w-xs text-sm text-muted">
                Sign in from the top right to create lists and save products you trust.
              </p>
            </div>
          ) : !auth.profile ? (
            <div className="mt-8 rounded-2xl border border-line bg-paper p-8 text-center shadow-card">
              <p className="font-display text-lg text-ink">One more step</p>
              <p className="mx-auto mt-1.5 max-w-xs text-sm text-muted">
                Choose a handle and your lists get a shareable home.
              </p>
              <Link
                href="/welcome"
                className="mt-4 inline-flex rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:bg-ink/85"
              >
                Choose your handle
              </Link>
            </div>
          ) : lists.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-line bg-paper p-8 text-center shadow-card">
              <p className="font-display text-lg text-ink">No lists yet</p>
              <p className="mx-auto mt-1.5 max-w-xs text-sm text-muted">
                Start one here, or add a product to a list from any product page.
              </p>
              <Link
                href="/lists/new"
                className="mt-4 inline-flex rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:bg-ink/85"
              >
                New list
              </Link>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {lists.map((l) => (
                <ListCard key={l.id} list={l} handle={auth.profile!.handle} />
              ))}
            </div>
          )}
        </section>

        <div className="mt-auto" />
      </main>
    </div>
  );
}
