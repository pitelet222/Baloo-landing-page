// Present-but-deferred control (extracted in Order G5 — used on list pages, profiles, and soon
// products): renders a designed-but-not-yet-wired action (Follow → G6, Save → G7) with a quiet
// "soon" treatment, so pages read finished without over-promising.
export function DeferredChip({ label }: { label: string }) {
  return (
    <span
      className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-full border border-line bg-paper px-3.5 py-1.5 text-[13px] font-medium text-muted/70"
      title="Coming soon"
    >
      {label}
      <span className="rounded-full bg-line px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-muted">
        Soon
      </span>
    </span>
  );
}
