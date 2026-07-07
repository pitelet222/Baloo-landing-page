import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { searchProducts } from "@/lib/db/queries/products";

// Product picker search for the list editor (Order G4). Public read; empty when unconfigured.
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") ?? "";
  const dbi = db();
  if (!dbi || q.trim().length < 2) return NextResponse.json({ products: [] });
  const rows = await searchProducts(dbi, q, 10);
  return NextResponse.json({
    products: rows.map((p) => ({ id: p.id, name: p.name, brand: p.brand, slug: p.slug })),
  });
}
