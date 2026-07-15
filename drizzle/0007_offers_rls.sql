-- Row-Level Security for `offers` (Order P2 — the carried fix the Supabase security advisor
-- flagged as `rls_disabled_in_public` after P1 added the table).
--
-- `offers` is CATALOG data, so it takes the same shape as products/nutrition/ingredients in
-- 0001_rls.sql: world-readable, written only by the ingestion service (our server-side Drizzle
-- client connects as `postgres`, which BYPASSES RLS). No client ever writes an offer directly, so
-- there is deliberately no INSERT/UPDATE/DELETE policy — this is defence-in-depth for supabase-js
-- from the browser, PostgREST, and the future mobile app.

ALTER TABLE "offers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "offers_public_read" ON "offers" FOR SELECT USING (true);
