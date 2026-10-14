import { NextResponse, type NextRequest } from "next/server";
import { destroySession } from "@/lib/auth.js";
import { SESSION_COOKIE } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  destroySession(req.cookies.get(SESSION_COOKIE)?.value);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
