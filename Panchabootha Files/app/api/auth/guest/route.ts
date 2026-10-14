import { NextResponse } from "next/server";
import { guestUser, createSession, SESSION_COOKIE } from "@/lib/auth.js";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { name?: string } = {};
  try {
    body = await req.json();
  } catch {
    /* name is optional */
  }
  const result = guestUser(body.name);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });

  const token = createSession(result.user);
  const res = NextResponse.json({ user: result.user });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24
  });
  return res;
}
