export type Element = "Earth" | "Water" | "Fire" | "Air" | "Akasha";
export type Alignment = "Deva" | "Asura";
export type EstablishmentType = "House" | "City" | "Temple" | "Fort";
export type Phase =
  | "setup"
  | "roll"
  | "alignmentDecision"
  | "sangrama"
  | "trade"
  | "action"
  | "gameover";

export type Resources = Record<Element, number>;

export interface Dhoota {
  id: string;
  ownerId: number;
  homeTileId: string | null;
  tileId: string | null;
}

export interface Card {
  id: string;
  name: string;
  kind: "astra" | "mantra";
  super?: boolean;
  purchasedTurn: number;
  hidden?: boolean;
}

export interface Player {
  id: number;
  label: string;
  name: string;
  alignment: Alignment;
  resources: Resources;
  astraHand: Card[];
  mantraHand: Card[];
  purchasedThisTurn: string[];
  dhoota: Dhoota[];
  vp: number;
}

export interface Tile {
  id: string;
  q: number;
  r: number;
  element: Element;
  ownerId: number | null;
  establishmentType: EstablishmentType | null;
  jeeva: number;
}

export type RollType =
  | "devaAsura"
  | "devaElement"
  | "asuraElement"
  | "sameElement"
  | "differentElements";

export interface RollResult {
  deva: string;
  asura: string;
  type: RollType;
  element: Element | null;
  elementCounts: Record<Element, number>;
}

export interface PendingDecision {
  playerId: number;
  element?: Element;
}

export interface GameState {
  configVersion: string;
  seed: string;
  playerCount: number;
  players: Player[];
  tiles: Tile[];
  astraDeck: (Card | null)[];
  astraDiscard: Card[];
  mantraDeck: (Card | null)[];
  mantraDiscard: Card[];
  activePlayerId: number;
  round: number;
  turnNumber: number;
  phase: Phase;
  setupQueue: number[];
  alignmentLocked: boolean[];
  pending: { type: string; element?: Element; decisions: PendingDecision[] } | null;
  lastRoll: RollResult | null;
  sangrama: { attackUsedBy: number[] } | null;
  winnerId: number | null;
  log: string[];
}

export interface PlayAstraArgs {
  attackerId: number;
  targetPlayerId: number;
  cardId: string;
  targetTileId?: string;
  targetDhootaId?: string;
  destinationTileId?: string;
  resourceElement?: Element;
  counterCardId?: string;
  mantraCounterCardId?: string;
}

export interface Session {
  code: string;
  playerId: number;
  token: string;
}

export interface UiState {
  selectedDhoota: string | null;
  panel: "trade" | "build" | "dhoota" | "cards" | null;
  showMenu: boolean;
}
