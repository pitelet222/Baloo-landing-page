import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getProfileByHandle } from "@/lib/db/queries/profiles";
import {
  getListsByOwnerWithCounts,
  getPublicListsByOwnerWithCounts,
} from "@/lib/db/queries/lists";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { getFollowCounts, isFollowing } from "@/lib/db/queries/follows";
import { getSavedListsWithCounts } from "@/lib/db/queries/saves";
import { coverCss, monogram } from "@/lib/cover";
import { SiteHeader } from "@/components/SiteHeader";
import { FollowButton } from "@/components/FollowButton";
import { ListCard } from "@/components/lists/ListCard";
import { ShareButton } from "@/components/lists/ShareButton";

// Public profile (Order G5, restyled per D-G5 §6): identity + lists. Visitors see PUBLIC lists
// only; the owner also sees their private ones (marked "private" on the card — never shown to
// anyone else). Follow wires up in G6; Saved arrives with G7 (reserved tab).

type Params = {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ tab?: string }>;
};

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
  // L5c: a profile with no public lists is private — don't leak its name/bio to crawlers or social.
  const publicLists = await getPublicListsByOwnerWithCounts(data.dbi, data.profile.id);
  if (publicLists.length === 0) return { title: "Baloo" };
  return {
    title: `@${data.profile.handle} — Baloo`,
    description:
      data.profile.bio ?? `${data.profile.displayName}'s lists on Baloo.`,
  };
}

export default async function ProfilePage({ params, searchParams }: Params) {
  const { handle } = await params;
  const { tab } = await searchParams;
  const activeTab = tab === "saved" ? "saved" : "lists";
  const data = await load(handle);
  if (!data) notFound();
  const { dbi, profile } = data;

  const viewer = await getSessionUser();
  const isOwner = viewer?.id === profile.id;
  const lists = isOwner
    ? await getListsByOwnerWithCounts(dbi, profile.id)
    : await getPublicListsByOwnerWithCounts(dbi, profile.id);
  // L5c: a profile is private until it has ≥1 public list — publishing a list joins the community.
  // For a non-owner `lists` is already public-only, so an empty list = no public lists = private.
  if (!isOwner && lists.length === 0) notFound();
  const savedLists =
    activeTab === "saved"
      ? await getSavedListsWithCounts(dbi, profile.id, { publicOnly: !isOwner })
      : [];
  const publicCount = lists.filter((l) => l.isPublic).length;
  const joinedYear = profile.createdAt.getFullYear();
  const counts = await getFollowCounts(dbi, profile.id);
  const viewerFollows = viewer && !isOwner ? await isFollowing(dbi, viewer.id, profile.id) : false;

  return (
    <div className="relative flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-tool flex-1 flex-col px-5 pt-8">
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
              {/* Nothing public to share until the profile is public (L5c). */}
              {publicCount > 0 && <ShareButton path={`/u/${profile.handle}`} />}
              <FollowButton profileId={profile.id} initialFollowing={viewerFollows} />
            </div>
          </div>

          {profile.bio && (
            <p className="mt-4 max-w-[520px] text-[15px] leading-relaxed text-ink/80">
              {profile.bio}
            </p>
          )}
          <p className="mt-3 text-sm tabular-nums text-muted">
            Joined {joinedYear} · {counts.followers}{" "}
            {counts.followers === 1 ? "follower" : "followers"} · {counts.following} following ·{" "}
            {publicCount} public {publicCount === 1 ? "list" : "lists"}
          </p>
          {isOwner && publicCount === 0 && (
            <p className="mt-4 rounded-xl border border-line bg-canvas px-4 py-3 text-sm text-muted">
              Your profile is private. <span className="font-medium text-ink">Publish a list</span> to
              make it discoverable.
            </p>
          )}
        </section>

        {/* Tabs — Saved went live with Order G7 (link-tabs, SSR). */}
        <div role="tablist" aria-label="Profile views" className="mt-6 flex gap-6 border-b border-line">
          <Link
            role="tab"
            aria-selected={activeTab === "lists"}
            href={`/u/${profile.handle}`}
            className={`-mb-px border-b-2 py-3 text-[15px] transition ${
              activeTab === "lists"
                ? "border-natural font-semibold text-ink"
                : "border-transparent font-medium text-muted hover:text-ink"
            }`}
          >
            Lists
          </Link>
          <Link
            role="tab"
            aria-selected={activeTab === "saved"}
            href={`/u/${profile.handle}?tab=saved`}
            className={`-mb-px border-b-2 py-3 text-[15px] transition ${
              activeTab === "saved"
                ? "border-natural font-semibold text-ink"
                : "border-transparent font-medium text-muted hover:text-ink"
            }`}
          >
            Saved
          </Link>
        </div>

        {activeTab === "lists" ? (
          lists.length === 0 ? (
            // Owner-only in practice: a non-owner seeing zero lists means zero PUBLIC lists, and
            // L5c 404s them above — so this speaks to the owner, not about them in the third person.
            <div className="mt-6 rounded-2xl border border-line bg-paper p-8 text-center shadow-card">
              <p className="font-display text-lg text-ink">No lists yet</p>
              <p className="mx-auto mt-1.5 max-w-xs text-sm text-muted">
                Make your first list — publish it and your profile joins the community.
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
                <ListCard key={l.id} list={l} handle={profile.handle} />
              ))}
            </div>
          )
        ) : savedLists.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-line bg-paper p-8 text-center shadow-card">
            <p className="font-display text-lg text-ink">Nothing saved yet</p>
            {isOwner ? (
              <>
                <p className="mx-auto mt-1.5 max-w-xs text-sm text-muted">
                  Tap Save on any list you want to keep — they collect here.
                </p>
                <Link
                  href="/discover"
                  className="mt-4 inline-flex rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:bg-ink/85"
                >
                  Browse lists
                </Link>
              </>
            ) : (
              <p className="mx-auto mt-1.5 max-w-xs text-sm text-muted">
                @{profile.handle} hasn&rsquo;t saved any public lists.
              </p>
            )}
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {savedLists.map((l) => (
              <ListCard key={l.id} list={l} handle={l.ownerHandle} />
            ))}
          </div>
        )}

        <div className="mt-auto" />
      </main>
    </div>
  );
}
