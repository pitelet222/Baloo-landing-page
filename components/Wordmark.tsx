// The Baloo lockup: a small leaf mark + the wordmark. No logo asset exists yet, so the
// name is plain type (per the playbook); the leaf is a light, neutral touch and easy to drop.
// The mark scales with font-size (1.1em), so the same component works in the header and footer.
export function Wordmark({
  className = "",
  markClassName = "",
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg
        viewBox="0 0 24 24"
        aria-hidden
        fill="none"
        className={`h-[1.1em] w-[1.1em] ${markClassName}`}
      >
        <path d="M21 3C11 3 4 10 3 21c11-1 18-8 18-18Z" className="fill-natural" />
        <path
          d="M6.5 17.5C10 13 13.5 9.5 18 6"
          className="stroke-natural-soft"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
      <span className="font-display font-semibold tracking-tight text-ink">Baloo</span>
    </span>
  );
}
