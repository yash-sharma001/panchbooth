import { createRoom } from "@/lib/rooms.js";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { playerCount?: number; seed?: string } = {};
  try {
    body = await req.json();
  } catch {
    /* empty body is fine */
  }
  try {
    const code = createRoom({
      playerCount: Number(body.playerCount) || 4,
      seed: body.seed || "panchabhoota"
    });
    return Response.json({ code });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }
}
