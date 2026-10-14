import test from "node:test";
import assert from "node:assert/strict";
import { ELEMENTS, GAME_CONFIG } from "../lib/config.js";
import { PanchabhootaEngine, classifyRoll, createAstraDeck, createMantraDeck, playerTiles, resourceTotal } from "../lib/engine.js";

function setup(playerCount = 2) {
  const engine = new PanchabhootaEngine(undefined, "test-seed");
  let state = engine.newGame({ playerCount, seed: "test-seed" });
  while (state.setupQueue.length) {
    const playerId = state.setupQueue[0];
    const used = playerTiles(state, playerId).map((t) => t.element);
    const tile = state.tiles.find((t) => t.ownerId === null && !used.includes(t.element));
    state = engine.placeStartingHouse(state, playerId, tile.id);
  }
  return { engine, state };
}

function adjacentTile(state, fromId, predicate = () => true) {
  const from = state.tiles.find((t) => t.id === fromId);
  return state.tiles.find((t) => t.id !== fromId && predicate(t) && distance(from, t) === 1);
}

function distance(a, b) {
  const dq = a.q - b.q;
  const dr = a.r - b.r;
  return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
}

function give(player, amount = 10) {
  for (const element of ELEMENTS) player.resources[element] += amount;
}

function forceSangrama(state) {
  state.phase = GAME_CONFIG.phases.sangrama;
  state.sangrama = { attackUsedBy: [] };
  return state;
}

test("classifies all 36 elemental dice outcomes", () => {
  const counts = {};
  for (const deva of GAME_CONFIG.dice.devaFaces) {
    for (const asura of GAME_CONFIG.dice.asuraFaces) {
      const roll = classifyRoll(deva, asura);
      counts[roll.type] = (counts[roll.type] || 0) + 1;
    }
  }
  assert.equal(counts.differentElements, 20);
  assert.equal(counts.sameElement, 5);
  assert.equal(counts.devaElement, 5);
  assert.equal(counts.asuraElement, 5);
  assert.equal(counts.devaAsura, 1);
});

test("elemental production follows matching elemental faces and active city multiplier", () => {
  const { engine, state } = setup();
  const tile = playerTiles(state, 0)[0];
  tile.element = "Earth";
  tile.establishmentType = "City";
  tile.jeeva = 3;
  state.players[0].resources.Earth = 0;
  const next = engine.rollDice(state, { deva: "Earth", asura: "Earth" });
  assert.equal(next.players[0].resources.Earth, 4);
});

test("Deva + Element gives Deva-aligned players the matching boon", () => {
  const { engine, state } = setup();
  for (const owned of playerTiles(state, 0)) owned.element = "Earth";
  const tile = playerTiles(state, 0)[0];
  tile.element = "Water";
  state.players[0].alignment = "Deva";
  state.players[0].resources.Water = 0;
  const next = engine.rollDice(state, { deva: "Deva", asura: "Water" });
  assert.equal(next.players[0].resources.Water, 2);
});

test("Asura + Element affects Deva players and leaves Asura players unaffected", () => {
  const { engine, state } = setup();
  const devaTile = playerTiles(state, 0)[0];
  const asuraTile = playerTiles(state, 1)[0];
  devaTile.element = "Fire";
  asuraTile.element = "Fire";
  state.players[0].alignment = "Deva";
  state.players[1].alignment = "Asura";
  state.players[0].resources.Fire = 1;
  state.players[1].resources.Fire = 1;
  let next = engine.rollDice(state, { deva: "Fire", asura: "Asura" });
  assert.equal(next.phase, GAME_CONFIG.phases.alignmentDecision);
  next = engine.resolveAsuraDecision(next, 0, { kind: "pay" });
  assert.equal(next.players[0].resources.Fire, 1);
  assert.equal(next.players[1].resources.Fire, 2);
});

test("7 resource Sangrama risk discards half rounded down and ignores cards", () => {
  const { engine, state } = setup();
  state.players[0].resources = { Earth: 8, Water: 2, Fire: 2, Air: 0, Akasha: 0 };
  state.players[0].astraHand.push({ id: "x", name: "Agneyastra", kind: "astra", purchasedTurn: 0 });
  const next = engine.rollDice(state, { deva: "Deva", asura: "Asura" });
  assert.equal(resourceTotal(next.players[0]), 6);
  assert.equal(next.players[0].astraHand.length, 1);
  assert.equal(next.phase, GAME_CONFIG.phases.sangrama);
});

test("Dhoota movement spends Air per hex", () => {
  const { engine, state } = setup();
  state.phase = GAME_CONFIG.phases.action;
  const dhoota = state.players[0].dhoota[0];
  const step = adjacentTile(state, dhoota.tileId, (t) => t.ownerId === null);
  state.players[0].resources.Air = 3;
  const next = engine.moveDhoota(state, dhoota.id, [step.id]);
  assert.equal(next.players[0].resources.Air, 2);
  assert.equal(next.players[0].dhoota[0].tileId, step.id);
});

test("Dhoota opponent tribute transfers matching tile resource", () => {
  const { engine, state } = setup();
  state.phase = GAME_CONFIG.phases.action;
  const dhoota = state.players[0].dhoota[0];
  const from = state.tiles.find((t) => t.id === dhoota.tileId);
  const target = adjacentTile(state, from.id);
  target.ownerId = 1;
  target.establishmentType = "House";
  target.jeeva = 1;
  target.element = "Akasha";
  state.players[0].resources.Air = 2;
  state.players[0].resources.Akasha = 1;
  state.players[1].resources.Akasha = 0;
  const next = engine.moveDhoota(state, dhoota.id, [target.id]);
  assert.equal(next.players[0].resources.Air, 1);
  assert.equal(next.players[0].resources.Akasha, 0);
  assert.equal(next.players[1].resources.Akasha, 1);
});

test("Dhoota can establish immediately on an unclaimed tile and returns home", () => {
  const { engine, state } = setup();
  state.phase = GAME_CONFIG.phases.action;
  const player = state.players[0];
  give(player);
  const dhoota = player.dhoota[0];
  const step = adjacentTile(state, dhoota.tileId, (t) => t.ownerId === null);
  let next = engine.moveDhoota(state, dhoota.id, [step.id]);
  next = engine.establishWithDhoota(next, dhoota.id);
  const tile = next.tiles.find((t) => t.id === step.id);
  assert.equal(tile.ownerId, 0);
  assert.equal(tile.establishmentType, "House");
  assert.equal(tile.jeeva, 1);
  assert.equal(next.players[0].dhoota[0].tileId, next.players[0].dhoota[0].homeTileId);
});

test("all five normal Astra counters cancel their matching Astra", () => {
  const pairs = Object.entries(GAME_CONFIG.astraStockpile).filter(([, def]) => !def.super).map(([name, def]) => [name, def.counter]);
  for (const [name, counter] of pairs) {
    const { engine, state } = setup();
    forceSangrama(state);
    const targetTile = playerTiles(state, 1)[0];
    const card = { id: `a-${name}`, name, kind: "astra", super: false, purchasedTurn: 0 };
    const counterCard = { id: `c-${counter}`, name: counter, kind: "astra", super: false, purchasedTurn: 0 };
    state.players[0].astraHand.push(card);
    state.players[1].astraHand.push(counterCard);
    const next = engine.playAstra(state, { attackerId: 0, targetPlayerId: 1, cardId: card.id, targetTileId: targetTile.id, counterCardId: counterCard.id, resourceElement: "Earth" });
    assert.deepEqual(next.sangrama.attackUsedBy, [0]);
    assert.equal(next.astraDiscard.length, 2);
  }
});

test("all three Super Astras destroy their exact advanced establishment and Maha-Raksha cancels", () => {
  const targets = [["Brahmastra", "City"], ["Pashupatastra", "Fort"], ["Narayanastra", "Temple"]];
  for (const [name, type] of targets) {
    const { engine, state } = setup();
    forceSangrama(state);
    const targetTile = playerTiles(state, 1)[0];
    targetTile.establishmentType = type;
    targetTile.jeeva = 3;
    const card = { id: `s-${name}`, name, kind: "astra", super: true, purchasedTurn: 0 };
    state.players[0].astraHand.push(card);
    const next = engine.playAstra(state, { attackerId: 0, targetPlayerId: 1, cardId: card.id, targetTileId: targetTile.id });
    assert.equal(next.tiles.find((t) => t.id === targetTile.id).establishmentType, null);
  }
  const { engine, state } = setup();
  forceSangrama(state);
  const card = { id: "s-b", name: "Brahmastra", kind: "astra", super: true, purchasedTurn: 0 };
  const maha = { id: "m-r", name: "Maha-Raksha", kind: "mantra", purchasedTurn: 0 };
  state.players[0].astraHand.push(card);
  state.players[1].mantraHand.push(maha);
  const targetTile = playerTiles(state, 1)[0];
  targetTile.establishmentType = "City";
  targetTile.jeeva = 3;
  const next = engine.playAstra(state, { attackerId: 0, targetPlayerId: 1, cardId: card.id, targetTileId: targetTile.id, mantraCounterCardId: maha.id });
  assert.equal(next.tiles.find((t) => t.id === targetTile.id).establishmentType, "City");
});

test("Mantra stockpile has 24 cards and every Mantra effect resolves", () => {
  assert.equal(createMantraDeck().length, 24);
  for (const name of Object.keys(GAME_CONFIG.mantraStockpile)) {
    if (["Raksha", "Maha-Raksha"].includes(name)) continue;
    const { engine, state } = setup();
    state.phase = GAME_CONFIG.phases.action;
    give(state.players[0]);
    const card = { id: `m-${name}`, name, kind: "mantra", purchasedTurn: 0 };
    state.players[0].mantraHand.push(card);
    const owned = playerTiles(state, 0)[0];
    const emptyOwned = playerTiles(state, 0)[1];
    emptyOwned.establishmentType = null;
    emptyOwned.jeeva = 1;
    const dhoota = state.players[0].dhoota[0];
    const step1 = adjacentTile(state, dhoota.tileId, (t) => t.ownerId === null);
    const step2 = adjacentTile(state, step1.id, (t) => t.id !== dhoota.tileId);
    const args = {
      Dhanavrishti: { resources: ["Earth", "Water"] },
      Sampatti: { element: "Fire" },
      Parivartana: { returnResource: "Earth", gainElement: "Akasha" },
      Bhiksha: { resource: "Air" },
      "Jeeva-Srishti": { tileId: owned.id },
      "Vayu-Siddhi": { dhootaId: dhoota.id, path: [step1.id, step2.id] },
      Nirman: { tileId: emptyOwned.id }
    }[name];
    const next = engine.playMantra(state, card.id, args);
    assert.equal(next.players[0].mantraHand.length, 0);
    assert.equal(next.mantraDiscard.length, 1);
  }
});

test("Raksha cancels normal Astra and cannot cancel Super Astra", () => {
  const { engine, state } = setup();
  forceSangrama(state);
  const astra = { id: "a", name: "Agneyastra", kind: "astra", super: false, purchasedTurn: 0 };
  const raksha = { id: "r", name: "Raksha", kind: "mantra", purchasedTurn: 0 };
  state.players[0].astraHand.push(astra);
  state.players[1].mantraHand.push(raksha);
  const next = engine.playAstra(state, { attackerId: 0, targetPlayerId: 1, cardId: astra.id, targetTileId: playerTiles(state, 1)[0].id, mantraCounterCardId: raksha.id });
  assert.equal(next.mantraDiscard[0].name, "Raksha");
});

test("purchased cards cannot be used during the purchase turn", () => {
  const { engine, state } = setup();
  state.phase = GAME_CONFIG.phases.action;
  const player = state.players[0];
  give(player);
  const fort = playerTiles(state, 0)[0];
  fort.establishmentType = "Fort";
  fort.jeeva = 3;
  let next = engine.purchaseAstra(state);
  forceSangrama(next);
  assert.throws(() => engine.playAstra(next, { attackerId: 0, targetPlayerId: 1, cardId: next.players[0].astraHand[0].id, targetTileId: playerTiles(next, 1)[0].id }), /purchase turn/i);
});

test("Sangrama enforces one attack per player", () => {
  const { engine, state } = setup();
  forceSangrama(state);
  state.players[0].astraHand.push({ id: "a1", name: "Agneyastra", kind: "astra", super: false, purchasedTurn: 0 });
  state.players[0].astraHand.push({ id: "a2", name: "Agneyastra", kind: "astra", super: false, purchasedTurn: 0 });
  const targetTile = playerTiles(state, 1)[0];
  let next = engine.playAstra(state, { attackerId: 0, targetPlayerId: 1, cardId: "a1", targetTileId: targetTile.id });
  assert.throws(() => engine.playAstra(next, { attackerId: 0, targetPlayerId: 1, cardId: "a2", targetTileId: targetTile.id }), /one Astra attack/i);
});

test("inactive establishments provide no VP and no production", () => {
  const { engine, state } = setup();
  const tile = playerTiles(state, 0)[0];
  tile.element = "Earth";
  tile.establishmentType = "City";
  tile.jeeva = 2;
  state.players[0].resources.Earth = 0;
  engine.recalculateVp(state);
  assert.equal(state.players[0].vp, 0);
  const next = engine.rollDice(state, { deva: "Earth", asura: "Water" });
  assert.equal(next.players[0].resources.Earth, 0);
});

test("establishment destruction keeps ownership/Jeeva and allows rebuilding", () => {
  const { engine, state } = setup();
  forceSangrama(state);
  const targetTile = playerTiles(state, 1)[0];
  targetTile.establishmentType = "House";
  targetTile.jeeva = 1;
  state.players[0].astraHand.push({ id: "v", name: "Varunastra", kind: "astra", super: false, purchasedTurn: 0 });
  let next = engine.playAstra(state, { attackerId: 0, targetPlayerId: 1, cardId: "v", targetTileId: targetTile.id });
  assert.equal(next.tiles.find((t) => t.id === targetTile.id).ownerId, 1);
  assert.equal(next.tiles.find((t) => t.id === targetTile.id).jeeva, 1);
  next.phase = GAME_CONFIG.phases.action;
  next.activePlayerId = 1;
  give(next.players[1]);
  next = engine.buildHouse(next, targetTile.id);
  assert.equal(next.tiles.find((t) => t.id === targetTile.id).establishmentType, "House");
});

test("VP calculation includes active establishments and configurable bonuses", () => {
  const { engine, state } = setup();
  const p = state.players[0];
  state.tiles.slice(0, 5).forEach((tile, index) => {
    tile.ownerId = 0;
    tile.element = ELEMENTS[index];
    tile.establishmentType = index < 3 ? "City" : "Temple";
    tile.jeeva = 3;
  });
  engine.recalculateVp(state);
  assert.equal(p.vp, 14);
});

test("2/3/4-player setup uses specified board counts and snake placement queue", () => {
  for (const count of [2, 3, 4]) {
    const engine = new PanchabhootaEngine(undefined, `setup-${count}`);
    const state = engine.newGame({ playerCount: count, seed: `setup-${count}` });
    assert.equal(state.tiles.length, GAME_CONFIG.boardByPlayerCount[count].hexes);
    for (const element of ELEMENTS) {
      assert.equal(state.tiles.filter((t) => t.element === element).length, GAME_CONFIG.boardByPlayerCount[count].eachElement);
    }
    assert.deepEqual(state.setupQueue, [...Array.from({ length: count }, (_, i) => i), ...Array.from({ length: count }, (_, i) => count - i - 1)]);
  }
});

test("Astra stockpile contains the locked 28 cards", () => {
  assert.equal(createAstraDeck().length, 28);
});
