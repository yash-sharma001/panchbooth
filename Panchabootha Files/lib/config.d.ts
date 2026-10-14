import type { Element, Alignment } from "./types";

export const ELEMENTS: Element[];
export const ALIGNMENTS: Alignment[];
// GAME_CONFIG holds every tunable value; kept loose on purpose.
export const GAME_CONFIG: {
  playerCount: number;
  vpTarget: number;
  maxJeevaPerEstablishment: number;
  handRiskThreshold: number;
  bankTradeRate: number;
  dhootaAirPerHex: number;
  startingResources: Record<Element, number>;
  costs: Record<string, Partial<Record<Element, number>>>;
  establishments: Record<
    string,
    { minJeeva: number; vp: number; productionMultiplier: number; upgradeFrom?: string; directBuild?: boolean }
  >;
  astraStockpile: Record<string, { copies: number; counter: string | null; super: boolean }>;
  mantraStockpile: Record<string, { copies: number }>;
  bonusVp: Record<string, number>;
  phases: Record<string, string>;
  boardByPlayerCount: Record<number, { hexes: number; eachElement: number }>;
  dice: { devaFaces: string[]; asuraFaces: string[] };
  [key: string]: unknown;
};
