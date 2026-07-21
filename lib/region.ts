// Region availability math (Order L7). Framework-agnostic — no db/next imports — so it stays
// portable (the mobile app can reuse it) and trivially unit-testable. The DB fetch lives in
// lib/db/queries/lists.ts; this file only does the arithmetic + wording.

import { retailerRegion, type Region } from "./retailers";

export type ListAvailability = {
  availableCount: number;
  total: number;
  pct: number; // 0..1; 0 when the list is empty
};

export type AvailabilityTone = "full" | "most" | "some" | "none";

// A product counts as available in `region` if ANY of its retailers serves that region. A product
// with no recognised retailer counts as unavailable (conservative — we never over-promise).
export function computeAvailability(
  perProductRetailers: Map<string, string[]>,
  region: Region,
): ListAvailability {
  const total = perProductRetailers.size;
  if (total === 0) return { availableCount: 0, total: 0, pct: 0 };
  let availableCount = 0;
  for (const retailers of perProductRetailers.values()) {
    if (retailers.some((r) => retailerRegion(r) === region)) availableCount++;
  }
  return { availableCount, total, pct: availableCount / total };
}

// Neutral, region-agnostic wording — no flags, no nationality. Empty lists get no label.
export function availabilityLabel(a: ListAvailability): { label: string; tone: AvailabilityTone } | null {
  if (a.total === 0) return null;
  if (a.pct >= 1) return { label: "Available where you shop", tone: "full" };
  if (a.pct >= 0.6) return { label: "Mostly available where you shop", tone: "most" };
  if (a.pct > 0) return { label: "Some available where you shop", tone: "some" };
  return { label: "Not sold where you shop", tone: "none" };
}
