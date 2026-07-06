// Lazy Postgres client (Order G1) — same optional-infrastructure pattern as lib/cache.ts:
// when DATABASE_URL is absent, db() returns null and the app keeps running (dev without a
// database, or any environment where Phase 3 isn't configured yet). Server-only — never import
// from client components.

import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type Db = PostgresJsDatabase<typeof schema>;

let instance: Db | null = null;

export function db(): Db | null {
  if (instance) return instance;
  // DATABASE_URL for manual setups; POSTGRES_URL / POSTGRES_PRISMA_URL are what the
  // Vercel↔Supabase integration injects (both pooled). Prefer POSTGRES_URL (no Prisma-specific
  // query params).
  const url =
    process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? process.env.POSTGRES_PRISMA_URL;
  if (!url) return null;
  // prepare:false is required by Supabase's transaction pooler (PgBouncer transaction mode
  // doesn't support prepared statements).
  const client = postgres(url, { prepare: false });
  instance = drizzle(client, { schema });
  return instance;
}
