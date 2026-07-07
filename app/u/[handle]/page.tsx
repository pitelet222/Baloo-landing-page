import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getProfileByHandle } from "@/lib/db/queries/profiles";
import {
  getListsByOwnerWithCounts,
  getPublicListsByOwnerWithCounts,
} from "@/lib/db/queries/lists";
import { getSessionUser } from "@/lib/auth";
import { coverCss, monogram } from "@/lib/cover";
import { SiteHeader } from "@/components/SiteHeader";
import { DeferredChip } from "@/components/DeferredChip";
import { ListCard } from "@/components/lists/ListCard";
import { ShareButton } from "@/components/lists/ShareButton";

// Public profile (Order G5, restyled per D-G5 §6): identity + lists. Visitors see PUBLIC lists
// only; the owner also sees their private ones (marked "private" on the card — never shown to
// anyone else). Follow wires up in G6; Saved arrives with G7 (reserved tab).

type Params = { params: Promise<{ handle: string }> };

async function load(handle: string) {
  const dbi = db();
  if (!dbi) return null;
  const profile = await getProfileByHandle(dbi, handle.toLowerCase());
  if (!profile) return null;
  return { dbi, profile };
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { handle } = await params;
  const data = await load(handle);
  if (!data) return { title: "Baloo" };
  return {
    title: `@${data.profile.handle} — Baloo`,
    description:
      data.profile.bio ?? `${data.profile.displayName}'s lists on Baloo.`,
  };
}

export default async function ProfilePage({ params }: Params) {
  const { handle } = await params;
  const data = await load(handle);
  if (!data) notFound();
  const { dbi, profile } = data;

  const viewer = await getSessionUser();
  const isOwner = viewer?.id === profile.id;
  const lists = isOwner
    ? await getListsByOwnerWithCounts(dbi, profile.id)
    : await getPublicListsByOwnerWithCounts(dbi, profile.id);
  const publicCount = lists.filter((l) => l.isPublic).length;
  const joinedYear = profile.createdAt.getFullYear();

  return (
    <div className="relative min-h-screen">
      <main className="mx-auto flex min-h-screen max-w-tool flex-col px-5">
        <SiteHeader />

        <section className="mt-10 animate-fade-in">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              {/* Avatar: generated cover language, seeded by handle — no photos, on brand. */}
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
                <h1 className="truncate font-display text-[28px] leading-tight text-ink">
                  {profile.displayName}
                </h1>
                <p className="text-sm text-muted">@{profile.handle}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <ShareButton path={`/u/${profile.handle}`} />
              {!isOwner && <DeferredChip label="Follow" />}
            </div>
          </div>

          {profile.bio && (
            <p className="mt-4 max-w-[520px] text-[15px] leading-relaxed text-ink/80">
              {profile.bio}
            </p>
          )}
          <p className="mt-3 text-sm tabular-nums text-muted">
            Joined {joinedYear} · {publicCount} public {publicCount === 1 ? "list" : "lists"}
          </p>
        </section>

        {/* Tabs per D-G5 §6 — Lists active; Saved reserved until G7 (shipped Soon pattern). */}
        <div role="tablist" aria-label="Profile views" className="mt-6 flex gap-6 border-b border-line">
          <button
            role="tab"
            aria-selected
            className="-mb-px border-b-2 border-natural py-3 text-[15px] font-semibold text-ink"
          >
            Lists
          </button>
          <button
            role="tab"
            aria-selected={false}
            disabled
            aria-disabled
            className="-mb-px flex cursor-not-allowed items-center gap-1.5 border-b-2 border-transparent py-3 text-[15px] font-medium text-muted opacity-50"
          >
            Saved
            <span className="rounded-full bg-line px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.09em] text-muted">
              Soon
            </span>
          </button>
        </div>

        {lists.length === 0 ? (
          <p className="mt-6 text-sm text-muted">
            @{profile.handle} hasn&apos;t shared any public lists yet. When they make a list
            public, it&apos;ll show up here.
          </p>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
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
