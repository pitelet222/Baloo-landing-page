// Drizzle Kit config (Order G1). `db:generate` works fully offline (reads lib/db/schema.ts,
// writes SQL into drizzle/); `db:migrate` needs DATABASE_URL (Supabase transaction pooler
// string) in .env.local.
import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// .env.local first (explicit local values win), then .env.development.local (the file
// `npx vercel env pull .env.development.local` writes — carries the Supabase integration vars).
config({ path: ".env.local" });
config({ path: ".env.development.local" });

// Migrations prefer the DIRECT (non-pooled) connection — DDL through the transaction pooler
// can misbehave. Falls back to the pooled URLs for manual setups.
const url =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.POSTGRES_URL ??
  "";

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
});
