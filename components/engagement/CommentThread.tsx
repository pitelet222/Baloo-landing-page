"use client";

// Product discussion (Order G8, D-G7/G8 handoff §4). Community = opinion: card-less hairline
// rows, one level of replies, upvote + reply. The factual voice is Baloo's "Explain this" card
// (G8b), never a vote on a comment. Calm by default — the composer collapses when empty.

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/useAuth";
import { AuthModal } from "@/components/auth/AuthModal";
import { UpvotePill } from "@/components/engagement/UpvotePill";
import { monogram } from "@/lib/cover";
import type { ThreadComment, ThreadSort } from "@/lib/db/queries/comments";

function countAll(nodes: ThreadComment[]): number {
  return nodes.reduce((n, c) => n + 1 + c.replies.length, 0);
}

function relTime(iso: string): string {
  const s = Math.max(0, (Date.now() - Date.parse(iso)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.round(s / 60)}m`;
  if (s < 86400) return `${Math.round(s / 3600)}h`;
  return `${Math.round(s / 86400)}d`;
}

export function CommentThread({
  productId,
  initial,
}: {
  productId: string;
  initial: ThreadComment[];
}) {
  const { available, user, profile, refresh } = useAuth();
  const [comments, setComments] = useState<ThreadComment[]>(initial);
  const [sort, setSort] = useState<ThreadSort>("top");
  const [authOpen, setAuthOpen] = useState(false);

  async function reload(nextSort: ThreadSort = sort) {
    try {
      const res = await fetch(`/api/comments?productId=${productId}&sort=${nextSort}`);
      const data = await res.json();
      setComments(data.comments ?? []);
    } catch {
      /* keep what we have */
    }
  }

  function changeSort(next: ThreadSort) {
    setSort(next);
    reload(next);
  }

  const total = countAll(comments);

  return (
    <section className="mt-12 border-t border-line pt-8">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-2xl text-ink">
          Discussion <span className="text-muted">· {total}</span>
        </h2>
        {total > 0 && (
          <div className="flex rounded-full bg-canvas p-0.5 text-[13px]" role="group" aria-label="Sort comments">
            {(["top", "newest"] as ThreadSort[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => changeSort(s)}
                aria-pressed={sort === s}
                className={`rounded-full px-3 py-1 font-medium transition ${
                  sort === s ? "bg-paper text-ink shadow-card" : "text-muted hover:text-ink"
                }`}
              >
                {s === "top" ? "Top" : "Newest"}
              </button>
            ))}
          </div>
        )}
      </div>
      <p className="mt-1.5 text-sm text-muted">
        Comments are opinions from the community. For a factual take, use{" "}
        <span className="text-ink/70">Explain this</span> on any comment.
      </p>

      {/* Composer */}
      <Composer
        available={available}
        signedIn={!!user}
        profileName={profile?.displayName ?? profile?.handle ?? null}
        onNeedAuth={() => setAuthOpen(true)}
        onPost={async (text) => {
          const res = await fetch("/api/comments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId, body: text }),
          });
          if (res.ok) await reload();
          return res.ok;
        }}
      />

      {/* Thread */}
      {comments.length === 0 ? (
        <div className="mt-6 rounded-xl border border-line bg-paper p-6 text-center">
          <p className="text-sm text-ink">No comments yet.</p>
          <p className="mt-1 text-sm text-muted">Be the first to share what you think.</p>
        </div>
      ) : (
        <ul className="mt-6">
          {comments.map((c) => (
            <li key={c.id}>
              <CommentRow
                comment={c}
                productId={productId}
                signedIn={!!user}
                onNeedAuth={() => setAuthOpen(true)}
                onChanged={reload}
              />
            </li>
          ))}
        </ul>
      )}

      {authOpen && (
        <AuthModal
          mode="signin"
          onClose={() => setAuthOpen(false)}
          onDone={() => {
            setAuthOpen(false);
            refresh();
          }}
        />
      )}
    </section>
  );
}

// ── Composer (collapses when empty, grows on focus) ──────────────────────────────────────────

function Composer({
  available,
  signedIn,
  profileName,
  onNeedAuth,
  onPost,
  placeholder = "Share what you think about this product…",
  compact = false,
  onCancel,
}: {
  available: boolean;
  signedIn: boolean;
  profileName: string | null;
  onNeedAuth: () => void;
  onPost: (text: string) => Promise<boolean>;
  placeholder?: string;
  compact?: boolean;
  onCancel?: () => void;
}) {
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(compact);
  const [busy, setBusy] = useState(false);
  if (!available) return null;

  const open = focused || text.length > 0;

  async function submit() {
    const t = text.trim();
    if (!t || busy) return;
    setBusy(true);
    const ok = await onPost(t);
    setBusy(false);
    if (ok) {
      setText("");
      setFocused(false);
      onCancel?.();
    }
  }

  return (
    <div className={compact ? "mt-3" : "mt-6"}>
      <div className="flex gap-3">
        {!compact && (
          <span
            aria-hidden
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-canvas font-display text-sm text-ink/40"
          >
            {profileName ? monogram(profileName) : "?"}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <textarea
            value={text}
            onFocus={() => {
              if (!signedIn) onNeedAuth();
              else setFocused(true);
            }}
            onChange={(e) => setText(e.target.value)}
            placeholder={placeholder}
            rows={open ? 3 : 1}
            maxLength={1000}
            className="w-full resize-none rounded-lg border border-line bg-paper px-3.5 py-2.5 text-[15px] text-ink outline-none transition focus:border-natural focus:ring-2 focus:ring-natural/20"
          />
          {open && (
            <div className="mt-2 flex animate-fade-in items-center justify-between gap-3">
              <p className="text-xs text-muted">This reads as your opinion, not a fact.</p>
              <div className="flex items-center gap-2">
                {compact && (
                  <button
                    type="button"
                    onClick={() => {
                      setText("");
                      onCancel?.();
                    }}
                    className="rounded-lg px-3 py-1.5 text-[13px] font-medium text-muted transition hover:text-ink"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="button"
                  onClick={submit}
                  disabled={busy || text.trim().length === 0}
                  className="rounded-lg bg-ink px-4 py-1.5 text-[13px] font-medium text-paper transition hover:bg-ink/85 disabled:opacity-40"
                >
                  Post
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Comment row + one level of replies ───────────────────────────────────────────────────────

function CommentRow({
  comment,
  productId,
  signedIn,
  onNeedAuth,
  onChanged,
  isReply = false,
}: {
  comment: ThreadComment;
  productId: string;
  signedIn: boolean;
  onNeedAuth: () => void;
  onChanged: () => Promise<void>;
  isReply?: boolean;
}) {
  const { available, profile } = useAuth();
  const [replying, setReplying] = useState(false);

  const avatarSize = isReply ? "h-7 w-7 text-[11px]" : "h-[34px] w-[34px] text-xs";

  return (
    <div className={isReply ? "py-3" : "border-b border-line py-4"}>
      <div className="flex gap-2.5">
        <span
          aria-hidden
          className={`flex shrink-0 items-center justify-center rounded-full bg-canvas font-display text-ink/40 ${avatarSize}`}
        >
          {monogram(comment.author.displayName)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
            <Link href={`/u/${comment.author.handle}`} className="font-semibold text-ink hover:underline">
              @{comment.author.handle}
            </Link>
            <time className="text-xs tabular-nums text-muted" dateTime={comment.ts}>
              {relTime(comment.ts)}
            </time>
          </p>
          <p className={`mt-1 whitespace-pre-wrap leading-relaxed text-ink/70 ${isReply ? "text-sm" : "text-[15px]"}`}>
            {comment.body}
          </p>

          <div className="mt-2 flex items-center gap-3">
            <UpvotePill
              targetType="comment"
              targetId={comment.id}
              initialCount={comment.votes}
              initialVoted={comment.viewerVoted}
              size={isReply ? "xs" : "sm"}
            />
            {!isReply && (
              <button
                type="button"
                onClick={() => (signedIn ? setReplying((v) => !v) : onNeedAuth())}
                className="text-[13px] font-medium text-muted transition hover:text-ink"
              >
                Reply
              </button>
            )}
          </div>

          {replying && (
            <Composer
              available={available}
              signedIn={signedIn}
              profileName={profile?.displayName ?? null}
              compact
              placeholder="Write a reply…"
              onNeedAuth={onNeedAuth}
              onCancel={() => setReplying(false)}
              onPost={async (text) => {
                const res = await fetch("/api/comments", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ productId, body: text, parentId: comment.id }),
                });
                if (res.ok) await onChanged();
                return res.ok;
              }}
            />
          )}

          {comment.replies.length > 0 && (
            <ul className="mt-2 border-l border-line pl-4">
              {comment.replies.map((r) => (
                <li key={r.id}>
                  <CommentRow
                    comment={r}
                    productId={productId}
                    signedIn={signedIn}
                    onNeedAuth={onNeedAuth}
                    onChanged={onChanged}
                    isReply
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
