import { NextResponse } from "next/server";
import { registerUser, createSession, SESSION_COOKIE } from "@/lib/auth.js";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { name?: string; password?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
  const result = registerUser(body.name, body.password);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });

  const token = createSession(result.user);
  const res = NextResponse.json({ user: result.user });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
  return res;
}
