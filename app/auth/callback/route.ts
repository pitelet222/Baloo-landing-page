import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

// OAuth / magic-link landing (Order G2): exchanges the PKCE code for a session cookie, then
// sends the user home (the client's useAuth picks the session up and routes to /welcome if the
// handle-setup step is still pending).
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  if (code) {
    const sb = await supabaseServer();
    if (sb) await sb.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL("/", url.origin));
}
