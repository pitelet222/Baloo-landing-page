import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";
import { db } from "@/lib/db";
import { getListsByOwnerWithCounts } from "@/lib/db/queries/lists";
import { Wordmark } from "@/components/Wordmark";
import { AccountMenu } from "@/components/auth/AccountMenu";
import { ListCard } from "@/components/lists/ListCard";

export const metadata: Metadata = { title: "Your lists — Baloo" };

// "My lists" (Order G4). Signed-out and handle-pending states guide the user to the next step.
export default async function MyListsPage() {
  const auth = await getCurrentProfile();
  const dbi = db();
  const lists =
    auth?.profile && dbi ? await getListsByOwnerWithCounts(dbi, auth.profile.id) : [];

  return (
    <div className="relative min-h-screen">
      <main className="mx-auto flex min-h-screen max-w-tool flex-col px-5">
        <header className="relative flex items-center justify-center pt-8 sm:pt-10">
          <Link href="/" aria-label="Baloo home">
            <Wordmark className="text-xl" />
          </Link>
          <div className="absolute right-0">
            <AccountMenu />
          </div>
        </header>

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
            <p className="mt-6 text-sm text-muted">
              Sign in (top right) to create and keep lists of products.
            </p>
          ) : !auth.profile ? (
            <p className="mt-6 text-sm text-muted">
              Almost there —{" "}
              <Link href="/welcome" className="underline decoration-line underline-offset-2 hover:text-ink">
                choose your handle
              </Link>{" "}
              to start making lists.
            </p>
          ) : lists.length === 0 ? (
            <p className="mt-6 text-sm text-muted">
              No lists yet. Create one, or add a product to a list from any product page.
            </p>
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
