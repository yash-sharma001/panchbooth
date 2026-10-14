import { roomForToken, redactState } from "@/lib/rooms.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const { room, playerId } = roomForToken(searchParams.get("code"), searchParams.get("token"));
  if (!room || playerId < 0) return Response.json({ error: "Not in this room." }, { status: 403 });
  return Response.json(redactState(room.state, playerId));
}
