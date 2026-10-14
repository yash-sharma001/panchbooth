export const ELEMENTS = ["Earth", "Water", "Fire", "Air", "Akasha"];
export const ALIGNMENTS = ["Deva", "Asura"];

export const GAME_CONFIG = Object.freeze({
  playerCount: 4,
  boardByPlayerCount: {
    2: { hexes: 15, eachElement: 3 },
    3: { hexes: 20, eachElement: 4 },
    4: { hexes: 25, eachElement: 5 }
  },
  dice: {
    devaFaces: ["Earth", "Water", "Fire", "Air", "Akasha", "Deva"],
    asuraFaces: ["Earth", "Water", "Fire", "Air", "Akasha", "Asura"]
  },
  startingResources: { Earth: 1, Water: 1, Fire: 1, Air: 1, Akasha: 1 },
  startingHouses: 2,
  startingJeevaPerHouse: 1,
  handRiskThreshold: 7,
  bankTradeRate: 3,
  costs: {
    Jeeva: { Water: 1, Air: 1 },
    House: { Earth: 2, Water: 1 },
    City: { Earth: 2, Water: 1, Fire: 1 },
    Temple: { Earth: 1, Water: 1, Fire: 1, Akasha: 1 },
    Fort: { Earth: 2, Fire: 1, Akasha: 1 },
    Astra: { Fire: 2, Akasha: 1 },
    Mantra: {}
  },
  establishments: {
    House: { minJeeva: 1, vp: 0, productionMultiplier: 1, directBuild: true },
    City: { minJeeva: 3, vp: 2, productionMultiplier: 2, upgradeFrom: "House" },
    Temple: { minJeeva: 2, vp: 2, productionMultiplier: 1, upgradeFrom: "House" },
    Fort: { minJeeva: 3, vp: 2, productionMultiplier: 1, upgradeFrom: "House" }
  },
  maxJeevaPerEstablishment: 5,
  dhootaCount: 2,
  dhootaAirPerHex: 1,
  maxDhootaOnUnclaimedTile: 2,
  vpTarget: 10,
  bonusVp: {
    masterAllFiveElements: 2,
    threeCities: 2
  },
  astraStockpile: {
    Agneyastra: { copies: 5, counter: "Varunastra", super: false },
    Varunastra: { copies: 5, counter: "Vayavyastra", super: false },
    Vayavyastra: { copies: 5, counter: "Parvathastra", super: false },
    Parvathastra: { copies: 5, counter: "Indrastra", super: false },
    Indrastra: { copies: 5, counter: "Agneyastra", super: false },
    Brahmastra: { copies: 1, counter: null, super: true },
    Pashupatastra: { copies: 1, counter: null, super: true },
    Narayanastra: { copies: 1, counter: null, super: true }
  },
  mantraStockpile: {
    Dhanavrishti: { copies: 3 },
    Sampatti: { copies: 2 },
    Parivartana: { copies: 2 },
    Bhiksha: { copies: 3 },
    "Jeeva-Srishti": { copies: 3 },
    "Vayu-Siddhi": { copies: 3 },
    Nirman: { copies: 2 },
    Raksha: { copies: 4 },
    "Maha-Raksha": { copies: 2 }
  },
  phases: {
    setup: "setup",
    roll: "roll",
    alignmentDecision: "alignmentDecision",
    sangrama: "sangrama",
    trade: "trade",
    action: "action",
    gameover: "gameover"
  },
  setupOrderLabels: ["A", "B", "C", "D"]
});
