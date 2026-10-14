import { NextResponse, type NextRequest } from "next/server";
import { claimSeat } from "@/lib/rooms.js";
import { userFromRequest } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const user = userFromRequest(req);
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  let body: { code?: string } = {};
  try {
    body = await req.json();
  } catch {
    /* empty body is fine */
  }
  const result = claimSeat(String(body.code || "").toUpperCase(), { userId: user.id, name: user.name });
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json(result);
}
