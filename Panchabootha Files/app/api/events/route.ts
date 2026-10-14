import { roomForToken, redactState } from "@/lib/rooms.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Client = { send: (frame: string) => void; playerId: number };

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const { room, playerId } = roomForToken(searchParams.get("code"), searchParams.get("token"));
  if (!room || playerId < 0) return new Response("bad room or token", { status: 403 });

  const encoder = new TextEncoder();
  let client: Client;
  let ping: ReturnType<typeof setInterval>;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (frame: string) => {
        try {
          controller.enqueue(encoder.encode(frame));
        } catch {
          /* stream already closed */
        }
      };
      client = { send, playerId };
      send("retry: 3000\n\n");
      send(`event: state\ndata: ${JSON.stringify(redactState(room.state, playerId))}\n\n`);
      room.clients.add(client);
      // frequent comment pings keep the stream warm through NAT / tunnel idle timeouts
      ping = setInterval(() => send(": ping\n\n"), 15000);
    },
    cancel() {
      clearInterval(ping);
      room.clients.delete(client);
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    }
  });
}
