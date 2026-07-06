-- Row-Level Security (Order G1, hand-written custom migration).
--
-- ARCHITECTURE NOTE — read before touching. Our server-side Drizzle client connects over
-- DATABASE_URL as the `postgres` role, which BYPASSES RLS entirely: trusted code paths (API
-- routes) enforce authorisation in code (G2's requireUser + ownership checks in the query
-- layer). These policies are defence-in-depth for every OTHER access path — supabase-js from
-- the browser (G2+), PostgREST, and the future mobile app — so a client-side bug or leaked anon
-- key can never read private rows or write someone else's data.
--
-- Model: public content is world-readable; writes are owner-scoped via auth.uid(); the catalog
-- (products/profiles/nutrition/ingredients) is written only by the ingestion service (service
-- role, which bypasses RLS) — no direct client writes.

-- Identity ------------------------------------------------------------------------------------
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "profiles_public_read" ON "profiles" FOR SELECT USING (true);--> statement-breakpoint
CREATE POLICY "profiles_own_update" ON "profiles" FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);--> statement-breakpoint

-- Catalog (client-read-only; ingestion writes via service role) --------------------------------
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "products_public_read" ON "products" FOR SELECT USING (true);--> statement-breakpoint
ALTER TABLE "ingredient_profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "ingredient_profiles_public_read" ON "ingredient_profiles" FOR SELECT USING (true);--> statement-breakpoint
ALTER TABLE "ingredient_profile_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "ingredient_profile_items_public_read" ON "ingredient_profile_items" FOR SELECT USING (true);--> statement-breakpoint
ALTER TABLE "ingredients" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "ingredients_public_read" ON "ingredients" FOR SELECT USING (true);--> statement-breakpoint
ALTER TABLE "nutrition" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "nutrition_public_read" ON "nutrition" FOR SELECT USING (true);--> statement-breakpoint

-- Lists (public when is_public; owner-scoped writes) -------------------------------------------
ALTER TABLE "lists" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "lists_read_public_or_own" ON "lists" FOR SELECT USING (is_public OR auth.uid() = owner_id);--> statement-breakpoint
CREATE POLICY "lists_own_insert" ON "lists" FOR INSERT WITH CHECK (auth.uid() = owner_id);--> statement-breakpoint
CREATE POLICY "lists_own_update" ON "lists" FOR UPDATE USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);--> statement-breakpoint
CREATE POLICY "lists_own_delete" ON "lists" FOR DELETE USING (auth.uid() = owner_id);--> statement-breakpoint

ALTER TABLE "list_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "list_items_read_via_list" ON "list_items" FOR SELECT USING (
  EXISTS (SELECT 1 FROM "lists" l WHERE l.id = list_id AND (l.is_public OR auth.uid() = l.owner_id))
);--> statement-breakpoint
CREATE POLICY "list_items_insert_via_list" ON "list_items" FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM "lists" l WHERE l.id = list_id AND auth.uid() = l.owner_id)
);--> statement-breakpoint
CREATE POLICY "list_items_update_via_list" ON "list_items" FOR UPDATE USING (
  EXISTS (SELECT 1 FROM "lists" l WHERE l.id = list_id AND auth.uid() = l.owner_id)
);--> statement-breakpoint
CREATE POLICY "list_items_delete_via_list" ON "list_items" FOR DELETE USING (
  EXISTS (SELECT 1 FROM "lists" l WHERE l.id = list_id AND auth.uid() = l.owner_id)
);--> statement-breakpoint

-- Social graph & engagement (world-readable signal; self-scoped writes) ------------------------
ALTER TABLE "follows" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "follows_public_read" ON "follows" FOR SELECT USING (true);--> statement-breakpoint
CREATE POLICY "follows_self_insert" ON "follows" FOR INSERT WITH CHECK (auth.uid() = follower_id);--> statement-breakpoint
CREATE POLICY "follows_self_delete" ON "follows" FOR DELETE USING (auth.uid() = follower_id);--> statement-breakpoint

ALTER TABLE "saves" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "saves_public_read" ON "saves" FOR SELECT USING (true);--> statement-breakpoint
CREATE POLICY "saves_self_insert" ON "saves" FOR INSERT WITH CHECK (auth.uid() = user_id);--> statement-breakpoint
CREATE POLICY "saves_self_delete" ON "saves" FOR DELETE USING (auth.uid() = user_id);--> statement-breakpoint

ALTER TABLE "votes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "votes_public_read" ON "votes" FOR SELECT USING (true);--> statement-breakpoint
CREATE POLICY "votes_self_insert" ON "votes" FOR INSERT WITH CHECK (auth.uid() = user_id);--> statement-breakpoint
CREATE POLICY "votes_self_update" ON "votes" FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);--> statement-breakpoint
CREATE POLICY "votes_self_delete" ON "votes" FOR DELETE USING (auth.uid() = user_id);--> statement-breakpoint

ALTER TABLE "comments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "comments_public_read" ON "comments" FOR SELECT USING (true);--> statement-breakpoint
CREATE POLICY "comments_self_insert" ON "comments" FOR INSERT WITH CHECK (auth.uid() = user_id);--> statement-breakpoint
CREATE POLICY "comments_self_update" ON "comments" FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);--> statement-breakpoint
CREATE POLICY "comments_self_delete" ON "comments" FOR DELETE USING (auth.uid() = user_id);--> statement-breakpoint

ALTER TABLE "activity" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "activity_public_read" ON "activity" FOR SELECT USING (true);--> statement-breakpoint
CREATE POLICY "activity_self_insert" ON "activity" FOR INSERT WITH CHECK (auth.uid() = actor_id);--> statement-breakpoint

-- Trust & safety (reports readable only by their reporter; admin uses service role) ------------
ALTER TABLE "reports" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "reports_own_read" ON "reports" FOR SELECT USING (auth.uid() = reporter_id);--> statement-breakpoint
CREATE POLICY "reports_self_insert" ON "reports" FOR INSERT WITH CHECK (auth.uid() = reporter_id);
