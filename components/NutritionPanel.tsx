"use client";

import { useEffect, useState } from "react";
import type { Nutrition } from "@/lib/schema";
import {
  computeNutrition,
  NUTRITION_DISCLAIMER,
  CHILD_DISCLAIMER_SUFFIX,
} from "@/lib/nutrition";
import { ProfileSelector, useProfile } from "./ProfileSelector";

// Rows the label prints as "of which …" — shown muted and indented per the design handoff.
const INDENTED = new Set(["saturates", "sugars"]);

// The Nutrition tab (Order B4). All percentages come from computeNutrition (code, never the
// model); the context line comes from /api/nutrition-context (Claude phrasing code-supplied
// numbers, server-cached per product×profile). Neutral by design: ink-tinted bars only, no
// colour-coding, no verdicts — see CLAUDE.md.
export function NutritionPanel({
  nutrition,
  productName,
  cacheKey,
}: {
  nutrition?: Nutrition;
  productName: string;
  cacheKey?: string;
}) {
  const [profile, setProfile] = useProfile();
  const [context, setContext] = useState<string | null>(null);

  const empty = !nutrition || nutrition.nutrients.length === 0;

  // One context line per profile choice; the route caches per product×profile so switching
  // back is instant. Abort on profile change/unmount; a network failure just means no line.
  useEffect(() => {
    if (empty) return;
    const controller = new AbortController();
    setContext(null);
    fetch("/api/nutrition-context", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: cacheKey,
        product_name: productName,
        serving_size: nutrition?.serving_size ?? null,
        nutrition,
        profile_id: profile.id,
      }),
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.context) setContext(d.context);
      })
      .catch(() => {
        /* silent — the table and disclaimer stand on their own */
      });
    return () => controller.abort();
  }, [empty, nutrition, productName, cacheKey, profile.id]);

  if (empty) {
    return (
      <p className="mt-6 text-sm text-muted">
        This product page didn&apos;t show a nutrition panel, so there&apos;s nothing to put in
        context here.
      </p>
    );
  }

  const computation = computeNutrition(nutrition, profile);
  const servingBasis = computation.basis === "serving";
  const isChild = profile.id.startsWith("child");

  return (
    <div className="animate-fade-in">
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <ProfileSelector value={profile} onChange={setProfile} />
        <p className="text-[13px] text-muted">
          {servingBasis
            ? `Per serving${nutrition.serving_size ? ` · ${nutrition.serving_size}` : ""}`
            : "Per 100 g / 100 ml"}
        </p>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-paper shadow-card">
        <div className="grid grid-cols-[1.4fr_0.8fr_0.8fr_1fr] items-center gap-3 border-b border-line bg-canvas px-5 py-3 sm:grid-cols-[1.6fr_0.9fr_0.9fr_1.15fr]">
          <span className="text-xs font-semibold uppercase tracking-[0.06em] text-muted">
            Nutrient
          </span>
          <span className="text-right text-xs font-semibold uppercase tracking-[0.06em] text-muted">
            Per serving
          </span>
          <span className="text-right text-xs font-semibold uppercase tracking-[0.06em] text-muted">
            Per 100 g
          </span>
          <span className="text-xs font-semibold uppercase tracking-[0.06em] text-muted">
            % of daily intake
          </span>
        </div>

        {computation.rows.map((row, i) => {
          const pct = servingBasis ? row.pct_serving : row.pct_100g;
          const indented = INDENTED.has(row.name.toLowerCase());
          return (
            <div
              key={`${row.name}-${i}`}
              className={`grid grid-cols-[1.4fr_0.8fr_0.8fr_1fr] items-center gap-3 px-5 py-3 text-[13px] sm:grid-cols-[1.6fr_0.9fr_0.9fr_1.15fr] sm:text-sm ${
                i > 0 ? "border-t border-line" : ""
              }`}
            >
              <span className={indented ? "pl-4 text-muted" : "text-ink"}>{row.name}</span>
              <span className="text-right tabular-nums text-ink">
                {row.per_serving ? `${row.per_serving} ${row.unit}` : "—"}
              </span>
              <span className="text-right tabular-nums text-muted">
                {row.per_100g ? `${row.per_100g} ${row.unit}` : "—"}
              </span>
              {pct === null ? (
                <span className="text-muted">—</span>
              ) : (
                <span>
                  <span className="tabular-nums text-ink">
                    {row.approx ? "<" : ""}
                    {pct}%
                  </span>
                  <span className="mt-1 block h-1 w-full max-w-[120px] rounded-full bg-line">
                    <span
                      className="block h-1 rounded-full bg-ink/[0.24]"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </span>
                </span>
              )}
            </div>
          );
        })}
      </div>

      {context && (
        <p className="mt-4 animate-fade-in text-sm leading-[1.6] text-ink/80">{context}</p>
      )}

      <p className="mt-3 border-t border-line pt-3 text-xs text-muted">
        {NUTRITION_DISCLAIMER}
        {isChild && ` ${CHILD_DISCLAIMER_SUFFIX}`}
      </p>
    </div>
  );
}
