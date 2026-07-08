// Promote a profile to admin (Order G9). Usage: npx tsx scripts/make-admin.ts <handle>
// Run once for the founder. Idempotent.
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env.development.local" });

import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { profiles } from "../lib/db/schema";

async function main() {
  const handle = process.argv[2];
  if (!handle) {
    console.error("Usage: npx tsx scripts/make-admin.ts <handle>");
    process.exit(1);
  }
  const dbi = db();
  if (!dbi) throw new Error("DATABASE_URL not configured");
  const [row] = await dbi
    .update(profiles)
    .set({ isAdmin: true })
    .where(eq(profiles.handle, handle.toLowerCase()))
    .returning({ handle: profiles.handle, isAdmin: profiles.isAdmin });
  if (!row) {
    console.error(`No profile with handle @${handle}`);
    process.exit(1);
  }
  console.log(`@${row.handle} is now admin: ${row.isAdmin}`);
  process.exit(0);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
