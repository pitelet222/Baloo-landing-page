// Drizzle Kit config (Order G1). `db:generate` works fully offline (reads lib/db/schema.ts,
// writes SQL into drizzle/); `db:migrate` needs DATABASE_URL (Supabase transaction pooler
// string) in .env.local.
import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
});
