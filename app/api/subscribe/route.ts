import { NextResponse } from "next/server";

// Email capture. POSTs the address to Loops if LOOPS_API_KEY is set; otherwise logs it
// and still returns success so the UI flow ("You're on the list.") never blocks.
export async function POST(req: Request) {
  let email: string;
  try {
    ({ email } = await req.json());
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  const apiKey = process.env.LOOPS_API_KEY;
  if (!apiKey) {
    console.log("[subscribe] no LOOPS_API_KEY set; captured email:", email);
    return NextResponse.json({ ok: true });
  }

  try {
    const res = await fetch("https://app.loops.so/api/v1/contacts/create", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, source: "baloo.life", subscribed: true }),
    });
    if (!res.ok) {
      console.error("Loops error:", res.status, await res.text());
    }
  } catch (err) {
    console.error("subscribe route error:", err);
  }

  // Always succeed from the user's perspective.
  return NextResponse.json({ ok: true });
}
