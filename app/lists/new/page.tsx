import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { CreateListForm } from "@/components/lists/CreateListForm";

export const metadata: Metadata = { title: "New list — Baloo" };

export default async function NewListPage() {
  const auth = await getCurrentProfile();
  // Signed in but no handle yet → finish setup first.
  if (auth && !auth.profile) redirect("/welcome");

  return (
    <div className="relative min-h-screen">
      <main className="mx-auto flex min-h-screen max-w-tool flex-col px-5">
        <SiteHeader />

        <section className="mt-10 animate-fade-in">
          <h1 className="font-display text-2xl text-ink">New list</h1>
          {auth?.profile ? (
            <>
              <p className="mt-1.5 text-sm text-muted">
                Give it a name — you&apos;ll add products next.
              </p>
              <CreateListForm />
            </>
          ) : (
            <p className="mt-6 text-sm text-muted">Sign in (top right) to create a list.</p>
          )}
        </section>
        <div className="mt-auto" />
      </main>
    </div>
  );
}
