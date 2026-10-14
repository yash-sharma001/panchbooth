import { roomForToken, applyAction } from "@/lib/rooms.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const { room, playerId } = roomForToken(searchParams.get("code"), searchParams.get("token"));
  if (!room || playerId < 0) return Response.json({ error: "Not in this room." }, { status: 403 });

  let body: { method?: string; args?: unknown[] } = {};
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Bad request body." }, { status: 400 });
  }

  const result = applyAction(room, playerId, body.method ?? "", body.args ?? []);
  if ("error" in result) return Response.json({ error: result.error }, { status: result.status ?? 400 });
  return Response.json({ ok: true });
}
