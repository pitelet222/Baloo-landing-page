-- Order S7a: make account deletion erase the PERSON without gutting the COMMUNITY.
--
-- Until now both of these were ON DELETE CASCADE, so deleting an auth user (which cascades to
-- profiles, per 0002) would have:
--   • hard-deleted every public list that person curated — 404ing every shared link to them, and
--   • deleted their comments AND, via comments.parent_id's own cascade, every reply OTHER people
--     had written underneath them.
--
-- SET NULL keeps both rows and drops only the link to the departed person: their public lists
-- survive ownerless (the UI already renders "by a Baloo user"), and their comments survive as
-- scrubbed tombstones so the thread tree — and other people's replies — stay intact.
--
-- Safe/non-destructive: no rows are touched, only constraints and nullability.
-- Security: `owner_id = auth.uid()` is never true for NULL, so an orphaned list is editable by
-- nobody and the existing RLS policies need no change.
ALTER TABLE "comments" DROP CONSTRAINT "comments_user_id_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "lists" DROP CONSTRAINT "lists_owner_id_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "comments" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "lists" ALTER COLUMN "owner_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lists" ADD CONSTRAINT "lists_owner_id_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;