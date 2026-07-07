// List slugs (Order G4). Unlike product slugs (deterministic from the canonical key), list slugs
// carry a random suffix — two lists can share a title, and the slug is the shareable URL. The
// create route retries with a fresh suffix on the rare unique-index collision.
import { normalizeName } from "./canonical";

export function slugifyTitle(title: string): string {
  const base = normalizeName(title).replace(/\s+/g, "-").slice(0, 50).replace(/^-+|-+$/g, "");
  return base || "list";
}

export function listSlug(title: string): string {
  return `${slugifyTitle(title)}-${Math.random().toString(36).slice(2, 8)}`;
}
