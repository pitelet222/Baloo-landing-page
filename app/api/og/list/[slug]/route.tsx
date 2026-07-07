import { ImageResponse } from "next/og";
import { db } from "@/lib/db";
import { getListBySlug } from "@/lib/db/queries/lists";
import { getProfileById } from "@/lib/db/queries/profiles";
import { coverGradient, monogram } from "@/lib/cover";

// Per-list Open Graph image (Order G4) — mirrors the on-page ListCover via the same lib/cover
// helpers so a shared link previews on brand. nodejs runtime (postgres.js isn't edge-safe).
export const runtime = "nodejs";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { slug } = await params;
  const dbi = db();
  const list = dbi ? await getListBySlug(dbi, slug) : null;
  const owner = list && dbi ? await getProfileById(dbi, list.ownerId) : null;

  const title = list?.title ?? "Baloo";
  const g = coverGradient(list?.slug ?? "baloo");
  const count = list?.items.length ?? 0;
  const sub = list
    ? `${count} ${count === 1 ? "product" : "products"}${owner ? ` · by @${owner.handle}` : ""}`
    : "Know what's in your food";

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: `linear-gradient(135deg, ${g.from}, ${g.to})`,
        }}
      >
        <div style={{ fontSize: 36, fontWeight: 700, color: "#1A1A18" }}>Baloo</div>
        <div
          style={{
            position: "absolute",
            right: 40,
            bottom: -40,
            fontSize: 460,
            fontWeight: 700,
            color: "rgba(26,26,24,0.13)",
            lineHeight: 1,
          }}
        >
          {monogram(title)}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 860 }}>
          <div style={{ fontSize: 66, fontWeight: 700, color: "#1A1A18", lineHeight: 1.1 }}>{title}</div>
          <div style={{ fontSize: 30, color: "#6F756E" }}>{sub}</div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" },
    },
  );
}
