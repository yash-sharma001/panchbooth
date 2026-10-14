import type { GameState, Tile, Element, Resources } from "./types";
import { GAME_CONFIG } from "./config.js";

const HEX_W = 120;
const HEX_H = 104;

export function axialToPixel(q: number, r: number) {
  return { x: HEX_W * (q + r / 2), y: HEX_H * r };
}

export function hexDistance(a: { q: number; r: number }, b: { q: number; r: number }) {
  const dq = a.q - b.q;
  const dr = a.r - b.r;
  return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
}

export function areAdjacent(a: Tile, b: Tile) {
  return hexDistance(a, b) === 1;
}

export function tileById(state: GameState, id: string | null | undefined) {
  return id ? state.tiles.find((t) => t.id === id) : undefined;
}

export function dhootaById(state: GameState, id: string | null | undefined) {
  if (!id) return undefined;
  for (const p of state.players) {
    const d = p.dhoota.find((x) => x.id === id);
    if (d) return d;
  }
  return undefined;
}

export function dhootaMoveCost(dest: Tile, ownerId: number): Partial<Resources> {
  const cost: Partial<Resources> = { Air: GAME_CONFIG.dhootaAirPerHex };
  if (dest.ownerId !== null && dest.ownerId !== ownerId && dest.establishmentType) {
    cost[dest.element] = (cost[dest.element] || 0) + 1;
  }
  return cost;
}

export function canAfford(resources: Resources, cost: Partial<Record<Element, number>>) {
  return Object.entries(cost).every(([el, n]) => (resources[el as Element] || 0) >= (n || 0));
}

export function formatCost(cost: Partial<Record<Element, number>>) {
  return Object.entries(cost)
    .filter(([, n]) => n)
    .map(([el, n]) => `${n} ${el}`)
    .join(" + ");
}

export const STEPPER = ["Roll", "Produce", "Alignment", "Trade", "Actions"] as const;

export function stepIndex(phase: GameState["phase"]): number {
  switch (phase) {
    case "roll":
      return 0;
    case "alignmentDecision":
    case "sangrama":
      return 2;
    case "trade":
      return 3;
    case "action":
      return 4;
    default:
      return -1;
  }
}

export interface VpLine {
  label: string;
  vp: number;
  bonus?: boolean;
  muted?: boolean;
}

export function vpBreakdown(state: GameState, playerId: number): VpLine[] {
  const tiles = state.tiles.filter((t) => t.ownerId === playerId);
  const lines: VpLine[] = [];
  const byType: Record<string, { active: number; inactive: number }> = {};
  for (const t of tiles) {
    if (!t.establishmentType) continue;
    const def = GAME_CONFIG.establishments[t.establishmentType];
    const active = t.jeeva >= def.minJeeva;
    byType[t.establishmentType] ??= { active: 0, inactive: 0 };
    byType[t.establishmentType][active ? "active" : "inactive"] += 1;
  }
  for (const [type, counts] of Object.entries(byType)) {
    const vpEach = GAME_CONFIG.establishments[type].vp;
    if (counts.active && vpEach) {
      lines.push({ label: `${counts.active} ${type}${counts.active > 1 ? "s" : ""}`, vp: counts.active * vpEach });
    }
    if (counts.inactive) {
      lines.push({ label: `${counts.inactive} ${type}${counts.inactive > 1 ? "s" : ""} inactive`, vp: 0, muted: true });
    }
  }
  const activeElements = new Set(tiles.filter((t) => t.establishmentType).map((t) => t.element));
  if (activeElements.size === 5) lines.push({ label: "All 5 elements", vp: GAME_CONFIG.bonusVp.masterAllFiveElements, bonus: true });
  const cityCount = tiles.filter((t) => t.establishmentType === "City").length;
  if (cityCount >= 3) lines.push({ label: "3 Cities bonus", vp: GAME_CONFIG.bonusVp.threeCities, bonus: true });
  return lines;
}

export function elementCountLabel(counts: Record<Element, number>) {
  return (Object.entries(counts) as [Element, number][])
    .filter(([, n]) => n > 0)
    .map(([el, n]) => (n > 1 ? `${el} ×${n}` : el))
    .join(" + ");
}
