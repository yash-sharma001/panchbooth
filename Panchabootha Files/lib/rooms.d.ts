import type { GameState } from "./types";
import type { PanchabhootaEngine } from "./engine";

export interface RoomClient {
  send: (frame: string) => void;
  playerId: number;
}

export interface Room {
  engine: PanchabhootaEngine;
  state: GameState;
  playerCount: number;
  seats: (string | null)[];
  seatUsers: (string | null)[];
  clients: Set<RoomClient>;
  lastActivity: number;
}

export const rooms: Map<string, Room>;

export function makeCode(): string;
export function createRoom(opts?: { playerCount?: number; seed?: string }): string;
export function claimSeat(
  code: string,
  identity?: { userId?: string; name?: string }
):
  | { code: string; playerId: number; token: string; name: string }
  | { error: string; status: number };
export function roomForToken(
  code: string | null,
  token: string | null
): { room: Room | undefined; playerId: number };
export function authorize(
  state: GameState,
  playerId: number,
  method: string,
  args?: unknown[]
): string | null;
export function redactState(state: GameState, forPlayerId: number): GameState;
export function applyAction(
  room: Room,
  playerId: number,
  method: string,
  args?: unknown[]
): { ok: true } | { error: string; status?: number };
export function broadcast(room: Room): void;
