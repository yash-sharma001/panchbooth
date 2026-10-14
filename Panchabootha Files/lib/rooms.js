// In-memory online-room store, shared by the API route handlers.
// NOTE: a module-level Map only works on a single long-lived Node process
// (next dev, or `next start` on one instance). A serverless / multi-instance
// deploy needs an external store (Redis, etc.) — swap this module then.
import { PanchabhootaEngine } from "./engine.js";

const g = globalThis;
/** @type {Map<string, Room>} */
export const rooms = (g.__panchaRooms ??= new Map());

const ROOM_TTL_MS = 10 * 60 * 1000;
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

if (!g.__panchaSweep) {
  g.__panchaSweep = setInterval(() => {
    const now = Date.now();
    for (const [code, room] of rooms) {
      if (room.clients.size === 0 && now - room.lastActivity > ROOM_TTL_MS) rooms.delete(code);
    }
  }, 60000);
  g.__panchaSweep.unref?.();
}

export function makeCode() {
  let code;
  do {
    code = Array.from({ length: 4 }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join("");
  } while (rooms.has(code));
  return code;
}

export function createRoom({ playerCount = 4, seed = "panchabhoota" } = {}) {
  const engine = new PanchabhootaEngine(undefined, seed);
  const state = engine.newGame({ playerCount, seed });
  const code = makeCode();
  rooms.set(code, {
    engine,
    state,
    playerCount,
    seats: Array(playerCount).fill(null),
    seatUsers: Array(playerCount).fill(null),
    clients: new Set(),
    lastActivity: Date.now()
  });
  return code;
}

// Claim (or reconnect to) a seat for a logged-in identity. The seat's display
// name is stamped onto the game state so opponents see the username, not "Player N".
export function claimSeat(code, { userId, name } = {}) {
  const room = rooms.get(code);
  if (!room) return { error: "No such room.", status: 404 };
  room.seatUsers ??= Array(room.playerCount).fill(null);

  const existing = userId ? room.seatUsers.indexOf(userId) : -1;
  if (existing >= 0) {
    return { code, playerId: existing, token: room.seats[existing], name: room.state.players[existing].name };
  }

  const seat = room.seats.indexOf(null);
  if (seat < 0) return { error: "Room is full.", status: 409 };
  const seatToken = randomToken();
  room.seats[seat] = seatToken;
  room.seatUsers[seat] = userId ?? seatToken;
  if (name) room.state.players[seat].name = name;
  room.lastActivity = Date.now();
  return { code, playerId: seat, token: seatToken, name: room.state.players[seat].name };
}

export function roomForToken(code, token) {
  const room = rooms.get(code);
  const playerId = room ? room.seats.indexOf(token) : -1;
  return { room, playerId };
}

// Only these engine methods may be invoked over the wire.
const ALLOWED = new Set([
  "rollDice", "setAlignment", "placeStartingHouse", "resolveAsuraDecision", "advancePhase",
  "bankTrade", "playerTrade", "createJeeva", "buildHouse", "upgradeEstablishment",
  "moveDhoota", "establishWithDhoota", "purchaseAstra", "purchaseMantra", "playMantra",
  "playAstra", "endSangrama"
]);
// Methods whose Nth positional arg names the acting player; it must equal the caller's seat.
const ACTOR_ARG = { setAlignment: 0, placeStartingHouse: 0, resolveAsuraDecision: 0 };

export function authorize(state, playerId, method, args = []) {
  if (!ALLOWED.has(method)) return "Unknown action.";
  if (method in ACTOR_ARG) {
    return Number(args[ACTOR_ARG[method]]) === playerId ? null : "You can only act for your own seat.";
  }
  if (method === "playAstra") {
    return args[0] && Number(args[0].attackerId) === playerId ? null : "You can only attack as your own seat.";
  }
  return playerId === state.activePlayerId ? null : "It is not your turn.";
}

// Per-recipient view: opponent hand contents and the draw decks are stripped.
export function redactState(state, forPlayerId) {
  const view = structuredClone(state);
  for (const player of view.players) {
    if (player.id === forPlayerId) continue;
    player.astraHand = player.astraHand.map((c) => ({ id: c.id, hidden: true }));
    player.mantraHand = player.mantraHand.map((c) => ({ id: c.id, hidden: true }));
  }
  view.astraDeck = view.astraDeck.map(() => null);
  view.mantraDeck = view.mantraDeck.map(() => null);
  return view;
}

export function applyAction(room, playerId, method, args = []) {
  const denied = authorize(room.state, playerId, method, args);
  if (denied) return { error: denied, status: 403 };
  try {
    room.state = room.engine[method](room.state, ...args);
  } catch (error) {
    return { error: error.message, status: 400 };
  }
  room.lastActivity = Date.now();
  broadcast(room);
  return { ok: true };
}

export function broadcast(room) {
  const cache = new Map();
  for (const client of room.clients) {
    if (!cache.has(client.playerId)) cache.set(client.playerId, JSON.stringify(redactState(room.state, client.playerId)));
    client.send(`event: state\ndata: ${cache.get(client.playerId)}\n\n`);
  }
}

function randomToken() {
  return (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`);
}
