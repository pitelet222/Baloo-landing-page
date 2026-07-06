-- Order G2: tie profiles to real Supabase Auth users (the FK deferred from G1, when the auth
-- schema wasn't in play yet). From here on, a profile can only exist for a real auth user, and
-- deleting an auth user cascades their profile (and, through it, their lists etc.).
--
-- ⚠ DESTRUCTIVE ON DEV DATA, BY DESIGN: the first statement removes any profile whose id has no
-- auth.users row — i.e. the G1 seed's random-uuid demo profile (cascading its demo list). Real
-- profiles are never orphans because G2's signup flow always creates them with id = auth.uid().
DELETE FROM "profiles" WHERE "id" NOT IN (SELECT "id" FROM auth.users);--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_auth_users_fk" FOREIGN KEY ("id") REFERENCES auth.users("id") ON DELETE CASCADE;
