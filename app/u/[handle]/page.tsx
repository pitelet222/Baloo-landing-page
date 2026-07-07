import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getProfileByHandle } from "@/lib/db/queries/profiles";
import { getPublicListsByOwnerWithCounts } from "@/lib/db/queries/lists";
import { coverCss, monogram } from "@/lib/cover";
import { SiteHeader } from "@/components/SiteHeader";
import { DeferredChip } from "@/components/DeferredChip";
import { ListCard } from "@/components/lists/ListCard";

// Public profile (Order G5): identity + the user's PUBLIC lists — private ones never appear
// here, the owner's own included (owners manage everything via /lists). Follow wires up in G6.

type Params = { params: Promise<{ handle: string }> };

async function load(handle: string) {
  const dbi = db();
  if (!dbi) return null;
  const profile = await getProfileByHandle(dbi, handle.toLowerCase());
  if (!profile) return null;
  const lists = await getPublicListsByOwnerWithCounts(dbi, profile.id);
  return { profile, lists };
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { handle } = await params;
  const data = await load(handle);
  if (!data) return { title: "Baloo" };
  return {
    title: `@${data.profile.handle} — Baloo`,
    description:
      data.profile.bio ??
      `${data.profile.displayName}'s lists on Baloo — ${data.lists.length} public ${data.lists.length === 1 ? "list" : "lists"}.`,
  };
}

export default async function ProfilePage({ params }: Params) {
  const { handle } = await params;
  const data = await load(handle);
  if (!data) notFound();
  const { profile, lists } = data;

  return (
    <div className="relative min-h-screen">
      <main className="mx-auto flex min-h-screen max-w-tool flex-col px-5">
        <SiteHeader />

        <section className="mt-10 animate-fade-in">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              {/* Avatar: same generated-cover language as lists, seeded by the handle. */}
              <span
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full"
                style={{ background: coverCss(profile.handle) }}
                aria-hidden
              >
                <span className="font-display text-2xl font-semibold text-ink/25">
                  {monogram(profile.displayName)}
                </span>
              </span>
              <div className="min-w-0">
                <h1 className="truncate font-display text-2xl leading-tight text-ink">
                  {profile.displayName}
                </h1>
                <p className="text-sm text-muted">@{profile.handle}</p>
              </div>
            </div>
            <DeferredChip label="Follow" />
          </div>

          {profile.bio && (
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-ink/80">{profile.bio}</p>
          )}
          <p className="mt-3 text-sm tabular-nums text-muted">
            {lists.length} public {lists.length === 1 ? "list" : "lists"}
          </p>
        </section>

        {lists.length === 0 ? (
          <p className="mt-8 text-sm text-muted">No public lists yet.</p>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {lists.map((l) => (
              <ListCard key={l.id} list={l} handle={profile.handle} />
            ))}
          </div>
        )}

        <div className="mt-auto" />
      </main>
    </div>
  );
}
