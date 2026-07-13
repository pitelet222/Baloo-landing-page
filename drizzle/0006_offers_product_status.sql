CREATE TYPE "public"."analysis_status" AS ENUM('pending', 'analysing', 'done', 'failed');--> statement-breakpoint
CREATE TABLE "offers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"retailer" text,
	"url" text,
	"available" boolean DEFAULT true NOT NULL,
	"price" numeric,
	"currency" text,
	"price_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "analysis_status" "analysis_status" DEFAULT 'done' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "analysed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "category" text;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "offers_product_retailer_url_uq" ON "offers" USING btree ("product_id","retailer","url");--> statement-breakpoint
CREATE INDEX "offers_product_idx" ON "offers" USING btree ("product_id");--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_name_trgm" ON "products" USING gin ("name" gin_trgm_ops);
