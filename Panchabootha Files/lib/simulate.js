import { ELEMENTS } from "./config.js";
import { PanchabhootaEngine, playerTiles, resourceTotal } from "./engine.js";

export function runSimulations(games = 1000) {
  const aggregate = {
    games,
    completed: 0,
    averageTurns: 0,
    resourceFlow: Object.fromEntries(ELEMENTS.map((e) => [e, 0])),
    jeevaCreated: 0,
    establishmentBuilds: 0,
    dhootaMoves: 0,
    cardAcquisition: { astra: 0, mantra: 0 },
    sangramaFrequency: 0,
    handRiskFrequency: 0,
    winRates: { P1: 0, P2: 0, P3: 0, P4: 0 }
  };
  for (let i = 0; i < games; i += 1) {
    const report = runSingleSimulation(`sim-${i}`);
    aggregate.completed += 1;
    aggregate.averageTurns += report.turns;
    for (const e of ELEMENTS) aggregate.resourceFlow[e] += report.resourceFlow[e];
    aggregate.jeevaCreated += report.jeevaCreated;
    aggregate.establishmentBuilds += report.establishmentBuilds;
    aggregate.dhootaMoves += report.dhootaMoves;
    aggregate.cardAcquisition.astra += report.cardAcquisition.astra;
    aggregate.cardAcquisition.mantra += report.cardAcquisition.mantra;
    aggregate.sangramaFrequency += report.sangramaFrequency;
    aggregate.handRiskFrequency += report.handRiskFrequency;
    if (report.winnerId !== null) aggregate.winRates[`P${report.winnerId + 1}`] += 1;
  }
  aggregate.averageTurns = Number((aggregate.averageTurns / games).toFixed(2));
  for (const e of ELEMENTS) aggregate.resourceFlow[e] = Number((aggregate.resourceFlow[e] / games).toFixed(2));
  for (const key of Object.keys(aggregate.winRates)) aggregate.winRates[key] = Number((aggregate.winRates[key] / games).toFixed(3));
  return aggregate;
}

export function runSingleSimulation(seed = "sim") {
  const engine = new PanchabhootaEngine(undefined, seed);
  let state = engine.newGame({ playerCount: 4, seed });
  const report = {
    turns: 0,
    resourceFlow: Object.fromEntries(ELEMENTS.map((e) => [e, 0])),
    jeevaCreated: 0,
    establishmentBuilds: 0,
    dhootaMoves: 0,
    cardAcquisition: { astra: 0, mantra: 0 },
    sangramaFrequency: 0,
    handRiskFrequency: 0,
    winnerId: null
  };
  for (const playerId of state.setupQueue.slice()) {
    const used = playerTiles(state, playerId).map((t) => t.element);
    const tile = state.tiles.find((t) => t.ownerId === null && !used.includes(t.element));
    state = engine.placeStartingHouse(state, playerId, tile.id);
  }
  while (state.phase !== engine.config.phases.gameover && report.turns < 300) {
    report.turns += 1;
    const before = state.players.map(resourceTotal);
    state = engine.rollDice(state);
    if (state.phase === engine.config.phases.alignmentDecision) {
      while (state.pending?.decisions?.length) {
        const d = state.pending.decisions[0];
        const p = state.players[d.playerId];
        if (p.resources[state.pending.element] > 0) state = engine.resolveAsuraDecision(state, d.playerId, { kind: "pay" });
        else {
          const tile = playerTiles(state, d.playerId).find((t) => t.element === state.pending.element && t.jeeva > 0);
          state = engine.resolveAsuraDecision(state, d.playerId, { kind: "loseJeeva", tileId: tile.id });
        }
      }
    }
    if (state.phase === engine.config.phases.sangrama) {
      report.sangramaFrequency += 1;
      report.handRiskFrequency += state.log.filter((line) => line.includes("7-card Sangrama risk")).length;
      state = engine.endSangrama(state);
    }
    for (const [i, total] of before.entries()) {
      const delta = resourceTotal(state.players[i]) - total;
      if (delta > 0 && state.lastRoll) {
        for (const e of ELEMENTS) report.resourceFlow[e] += Math.max(0, state.players[i].resources[e]);
      }
    }
    if (state.phase === engine.config.phases.trade) state = engine.advancePhase(state);
    state = scriptedAction(engine, state, report);
  }
  report.winnerId = state.winnerId;
  return report;
}

function scriptedAction(engine, state, report) {
  let next = state;
  const player = next.players[next.activePlayerId];
  for (const tile of playerTiles(next, player.id)) {
    if (tile.establishmentType && tile.jeeva < engine.config.maxJeevaPerEstablishment && canAfford(player, engine.config.costs.Jeeva)) {
      next = engine.createJeeva(next, tile.id);
      report.jeevaCreated += 1;
      break;
    }
  }
  const house = playerTiles(next, player.id).find((t) => t.establishmentType === "House" && t.jeeva >= 3);
  if (house) {
    for (const type of ["City", "Fort", "Temple"]) {
      if (canAfford(player, engine.config.costs[type])) {
        next = engine.upgradeEstablishment(next, house.id, type);
        report.establishmentBuilds += 1;
        break;
      }
    }
  }
  if (playerTiles(next, player.id).some((t) => t.establishmentType === "Fort") && canAfford(player, engine.config.costs.Astra)) {
    try {
      next = engine.purchaseAstra(next);
      report.cardAcquisition.astra += 1;
    } catch {}
  }
  if (playerTiles(next, player.id).some((t) => t.establishmentType === "Temple") && canAfford(player, engine.config.costs.Mantra)) {
    try {
      next = engine.purchaseMantra(next);
      report.cardAcquisition.mantra += 1;
    } catch {}
  }
  return engine.advancePhase(next);
}

function canAfford(player, cost) {
  return Object.entries(cost || {}).every(([element, amount]) => player.resources[element] >= amount);
}

if (typeof process !== "undefined" && process.argv?.[1] && directRunPath(import.meta.url) === process.argv[1].replace(/\\/g, "/")) {
  const games = Number(process.argv[2] || 1000);
  console.log(JSON.stringify(runSimulations(games), null, 2));
}

function directRunPath(url) {
  return decodeURIComponent(new URL(url).pathname).replace(/^\/([A-Za-z]:)/, "$1").replace(/\\/g, "/");
}
