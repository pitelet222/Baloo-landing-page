import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isCurrentUserAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { getOpenReports } from "@/lib/db/queries/reports";
import { SiteHeader } from "@/components/SiteHeader";
import { ModerationQueue } from "@/components/admin/ModerationQueue";

export const metadata: Metadata = { title: "Moderation — Baloo", robots: { index: false } };

// The moderator queue (Order G9). Admin-only — everyone else gets a 404 (no existence leak).
export default async function AdminPage() {
  const admin = await isCurrentUserAdmin();
  if (!admin) notFound();
  const dbi = db();
  const reports = dbi ? await getOpenReports(dbi) : [];

  return (
    <div className="relative min-h-screen">
      <main className="mx-auto flex min-h-screen max-w-tool flex-col px-5 pb-16">
        <SiteHeader />
        <section className="mt-10 animate-fade-in">
          <h1 className="font-display text-[30px] leading-tight text-ink">Moderation</h1>
          <p className="mt-1.5 text-sm text-muted">
            Open reports from the community. Hide removes content from public view; dismiss keeps it.
          </p>
          <ModerationQueue initial={reports} />
        </section>
      </main>
    </div>
  );
}
