// Activity log writes (Order G4) — every meaningful action drops a row that G6's home feed and
// the graduated board read. Fire-and-forget from the caller's view (best-effort; never blocks).
import type { Db } from "../index";
import { activity, type ActivityVerb } from "../schema";

export async function recordActivity(
  dbi: Db,
  input: { actorId: string; verb: ActivityVerb; objectType: string; objectId: string },
): Promise<void> {
  try {
    await dbi.insert(activity).values(input);
  } catch (err) {
    console.error("recordActivity error (ignored):", err);
  }
}
