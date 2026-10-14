import type {
  GameState,
  Tile,
  Player,
  RollResult,
  Card,
  Alignment,
  Element,
  PlayAstraArgs
} from "./types";
import { GAME_CONFIG } from "./config";

export class GameError extends Error {}

export function createRng(seed?: string): () => number;

export class PanchabhootaEngine {
  constructor(config?: typeof GAME_CONFIG, seed?: string);
  config: typeof GAME_CONFIG;
  seed: string;
  newGame(opts?: { playerCount?: number; seed?: string }): GameState;
  setAlignment(state: GameState, playerId: number, alignment: Alignment): GameState;
  placeStartingHouse(state: GameState, playerId: number, tileId: string): GameState;
  rollDice(state: GameState, forced?: { deva?: string; asura?: string }): GameState;
  resolveAsuraDecision(
    state: GameState,
    playerId: number,
    choice: { kind: "pay" } | { kind: "loseJeeva"; tileId: string }
  ): GameState;
  advancePhase(state: GameState): GameState;
  endTurn(state: GameState): GameState;
  bankTrade(state: GameState, giveElement: Element, gainElement: Element): GameState;
  playerTrade(
    state: GameState,
    partnerId: number,
    offer: Partial<Record<Element, number>>,
    request: Partial<Record<Element, number>>
  ): GameState;
  createJeeva(state: GameState, tileId: string, free?: boolean): GameState;
  buildHouse(state: GameState, tileId: string, opts?: { free?: boolean }): GameState;
  upgradeEstablishment(state: GameState, tileId: string, type: "City" | "Temple" | "Fort"): GameState;
  moveDhoota(state: GameState, dhootaId: string, path: string[], opts?: { freeExact2?: boolean }): GameState;
  establishWithDhoota(state: GameState, dhootaId: string): GameState;
  purchaseAstra(state: GameState): GameState;
  purchaseMantra(state: GameState): GameState;
  playMantra(state: GameState, cardId: string, args?: Record<string, unknown>): GameState;
  playAstra(state: GameState, args: PlayAstraArgs): GameState;
  endSangrama(state: GameState): GameState;
  clone(state: GameState): GameState;
}

export function createAstraDeck(config?: typeof GAME_CONFIG): Card[];
export function createMantraDeck(config?: typeof GAME_CONFIG): Card[];
export function classifyRoll(deva: string, asura: string): RollResult;
export function createBoard(playerCount: number, config?: typeof GAME_CONFIG): Tile[];
export function isActive(tile: Tile, config?: typeof GAME_CONFIG): boolean;
export function resourceTotal(player: Player): number;
export function playerTiles(state: GameState, playerId: number): Tile[];
