import { ALIGNMENTS, ELEMENTS, GAME_CONFIG } from "./config.js";

export class GameError extends Error {}

export function createRng(seed = "panchabhoota") {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i += 1) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

export class PanchabhootaEngine {
  constructor(config = GAME_CONFIG, seed = "panchabhoota") {
    this.config = config;
    this.rng = createRng(seed);
    this.seed = seed;
  }

  newGame({ playerCount = this.config.playerCount, seed = this.seed } = {}) {
    if (![2, 3, 4].includes(playerCount)) throw new GameError("Panchabhoota supports 2-4 players.");
    this.rng = createRng(seed);
    const board = createBoard(playerCount, this.config);
    const players = Array.from({ length: playerCount }, (_, index) => ({
      id: index,
      label: this.config.setupOrderLabels[index],
      name: `Player ${index + 1}`,
      alignment: ALIGNMENTS[index % 2],
      resources: cloneResources(this.config.startingResources),
      astraHand: [],
      mantraHand: [],
      purchasedThisTurn: [],
      dhoota: Array.from({ length: this.config.dhootaCount }, (_, dhootaIndex) => ({
        id: `${index}:D${dhootaIndex + 1}`,
        ownerId: index,
        homeTileId: null,
        tileId: null
      })),
      vp: 0
    }));
    const order = players.map((p) => p.id);
    const setupQueue = [...order, ...order.slice().reverse()];
    return this.recalculateVp({
      configVersion: "spec-v1.0",
      seed,
      rngSteps: 0,
      playerCount,
      players,
      tiles: board,
      astraDeck: this.shuffle(createAstraDeck(this.config)),
      astraDiscard: [],
      mantraDeck: this.shuffle(createMantraDeck(this.config)),
      mantraDiscard: [],
      activePlayerId: 0,
      round: 1,
      turnNumber: 1,
      phase: this.config.phases.setup,
      setupQueue,
      alignmentLocked: Array.from({ length: playerCount }, () => false),
      pending: null,
      lastRoll: null,
      sangrama: null,
      winnerId: null,
      log: ["Choose starting House locations in snake order."]
    });
  }

  setAlignment(state, playerId, alignment) {
    this.requirePhase(state, this.config.phases.setup);
    if (!ALIGNMENTS.includes(alignment)) throw new GameError("Alignment must be Deva or Asura.");
    const next = this.clone(state);
    const player = getPlayer(next, playerId);
    player.alignment = alignment;
    next.alignmentLocked[playerId] = true;
    next.log.unshift(`${player.name} aligned with ${alignment}.`);
    return next;
  }

  clone(state) {
    return structuredClone(state);
  }

  shuffle(cards) {
    const copy = cards.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(this.rng() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  rollDice(state, forced) {
    this.requirePhase(state, this.config.phases.roll);
    const deva = forced?.deva || pick(this.config.dice.devaFaces, this.rng);
    const asura = forced?.asura || pick(this.config.dice.asuraFaces, this.rng);
    const next = this.clone(state);
    next.lastRoll = classifyRoll(deva, asura);
    next.log.unshift(`Rolled Deva ${deva} and Asura ${asura}.`);
    this.produce(next, next.lastRoll.elementCounts);
    this.resolveAlignmentRoll(next);
    return this.recalculateVp(next);
  }

  placeStartingHouse(state, playerId, tileId) {
    this.requirePhase(state, this.config.phases.setup);
    if (state.setupQueue[0] !== playerId) throw new GameError("It is not this player's setup placement.");
    const next = this.clone(state);
    const tile = getTile(next, tileId);
    const player = getPlayer(next, playerId);
    if (tile.ownerId !== null || tile.establishmentType) throw new GameError("Starting House must be on an unclaimed tile.");
    if (playerTiles(next, playerId).some((owned) => owned.element === tile.element)) {
      throw new GameError("A player's two starting Houses must be on different elemental tiles.");
    }
    tile.ownerId = playerId;
    tile.establishmentType = "House";
    tile.jeeva = this.config.startingJeevaPerHouse;
    const unhomed = player.dhoota.find((d) => d.homeTileId === null);
    if (unhomed) {
      unhomed.homeTileId = tile.id;
      unhomed.tileId = tile.id;
    }
    next.setupQueue.shift();
    if (next.setupQueue.length === 0) {
      for (const p of next.players) {
        for (const d of p.dhoota) {
          if (d.homeTileId === null) {
            d.homeTileId = playerTiles(next, p.id)[0].id;
            d.tileId = d.homeTileId;
          }
        }
      }
      next.phase = this.config.phases.roll;
      next.log.unshift("Starting setup complete. Begin the first turn.");
    }
    return this.recalculateVp(next);
  }

  resolveAsuraDecision(state, playerId, choice) {
    this.requirePhase(state, this.config.phases.alignmentDecision);
    const next = this.clone(state);
    const pending = next.pending;
    if (!pending || pending.type !== "asuraElement") throw new GameError("No Asura elemental decision is pending.");
    const item = pending.decisions.find((d) => d.playerId === playerId);
    if (!item) throw new GameError("This player has no pending Asura decision.");
    const player = getPlayer(next, playerId);
    if (choice.kind === "pay") {
      spend(player, { [pending.element]: 1 });
      next.log.unshift(`${player.name} paid 1 ${pending.element} to the bank.`);
    } else if (choice.kind === "loseJeeva") {
      const tile = getTile(next, choice.tileId);
      if (tile.ownerId !== playerId || tile.element !== pending.element || tile.jeeva <= 0) {
        throw new GameError("Choose one owned matching-element establishment with Jeeva.");
      }
      tile.jeeva -= 1;
      next.log.unshift(`${player.name} lost 1 Jeeva on ${tile.element}.`);
    } else {
      throw new GameError("Unknown Asura decision.");
    }
    pending.decisions = pending.decisions.filter((d) => d.playerId !== playerId);
    if (pending.decisions.length === 0) {
      next.pending = null;
      next.phase = this.config.phases.trade;
    }
    return this.recalculateVp(next);
  }

  advancePhase(state) {
    const next = this.clone(state);
    if (next.phase === this.config.phases.trade) next.phase = this.config.phases.action;
    else if (next.phase === this.config.phases.action) return this.endTurn(next);
    else throw new GameError("Cannot advance from this phase.");
    return next;
  }

  endTurn(state) {
    const next = this.clone(state);
    const winner = next.players.find((p) => p.vp >= this.config.vpTarget);
    if (winner) {
      next.phase = this.config.phases.gameover;
      next.winnerId = winner.id;
      next.log.unshift(`${winner.name} wins with ${winner.vp} VP.`);
      return next;
    }
    next.activePlayerId = (next.activePlayerId + 1) % next.players.length;
    if (next.activePlayerId === 0) next.round += 1;
    next.turnNumber += 1;
    for (const p of next.players) p.purchasedThisTurn = [];
    next.phase = this.config.phases.roll;
    next.log.unshift(`${getPlayer(next, next.activePlayerId).name}'s turn begins.`);
    return next;
  }

  bankTrade(state, giveElement, gainElement) {
    this.requireActivePhase(state, [this.config.phases.trade, this.config.phases.action]);
    if (!ELEMENTS.includes(giveElement) || !ELEMENTS.includes(gainElement) || giveElement === gainElement) {
      throw new GameError("Bank trade requires two different basic resources.");
    }
    const next = this.clone(state);
    const player = activePlayer(next);
    spend(player, { [giveElement]: this.config.bankTradeRate });
    player.resources[gainElement] += 1;
    next.log.unshift(`${player.name} traded ${this.config.bankTradeRate} ${giveElement} for 1 ${gainElement}.`);
    return next;
  }

  playerTrade(state, partnerId, offer, request) {
    this.requirePhase(state, this.config.phases.trade);
    const next = this.clone(state);
    const active = activePlayer(next);
    const partner = getPlayer(next, partnerId);
    if (active.id === partner.id) throw new GameError("Cannot trade with yourself.");
    spend(active, offer);
    spend(partner, request);
    gain(active, request);
    gain(partner, offer);
    next.log.unshift(`${active.name} traded with ${partner.name}.`);
    return next;
  }

  createJeeva(state, tileId, free = false) {
    this.requirePhase(state, this.config.phases.action);
    const next = this.clone(state);
    const player = activePlayer(next);
    const tile = getTile(next, tileId);
    requireOwnedEstablishment(tile, player.id);
    if (tile.jeeva >= this.config.maxJeevaPerEstablishment) throw new GameError("That establishment is at Jeeva capacity.");
    if (!free) spend(player, this.config.costs.Jeeva);
    tile.jeeva += 1;
    next.log.unshift(`${player.name} created 1 Jeeva on ${tile.element}.`);
    return this.recalculateVp(next);
  }

  buildHouse(state, tileId, { free = false } = {}) {
    this.requirePhase(state, this.config.phases.action);
    const next = this.clone(state);
    const player = activePlayer(next);
    const tile = getTile(next, tileId);
    if (tile.ownerId !== player.id) throw new GameError("Build House on an owned tile.");
    if (tile.establishmentType) throw new GameError("Tile already has an establishment.");
    if (tile.jeeva < this.config.establishments.House.minJeeva) throw new GameError("House requires 1 Jeeva on the tile.");
    if (!free) spend(player, this.config.costs.House);
    tile.establishmentType = "House";
    next.log.unshift(`${player.name} built a House on ${tile.element}.`);
    return this.recalculateVp(next);
  }

  upgradeEstablishment(state, tileId, type) {
    this.requirePhase(state, this.config.phases.action);
    if (!["City", "Temple", "Fort"].includes(type)) throw new GameError("Advanced establishments must be City, Temple, or Fort.");
    const next = this.clone(state);
    const player = activePlayer(next);
    const tile = getTile(next, tileId);
    requireOwnedEstablishment(tile, player.id);
    if (tile.establishmentType !== "House") throw new GameError("Advanced establishments upgrade from a House.");
    if (tile.jeeva < this.config.establishments[type].minJeeva) throw new GameError(`${type} requires ${this.config.establishments[type].minJeeva} Jeeva.`);
    spend(player, this.config.costs[type]);
    tile.establishmentType = type;
    next.log.unshift(`${player.name} upgraded a House into a ${type}.`);
    return this.recalculateVp(next);
  }

  moveDhoota(state, dhootaId, path, { freeExact2 = false } = {}) {
    this.requirePhase(state, this.config.phases.action);
    const next = this.clone(state);
    const player = activePlayer(next);
    const dhoota = findDhoota(next, dhootaId);
    if (dhoota.ownerId !== player.id) throw new GameError("Can only move your own Dhoota.");
    if (!Array.isArray(path) || path.length === 0) throw new GameError("Dhoota path must include destination steps.");
    if (freeExact2 && path.length !== 2) throw new GameError("Vayu-Siddhi moves exactly 2 hexes.");
    let from = getTile(next, dhoota.tileId);
    const tributePayments = [];
    for (const stepId of path) {
      const to = getTile(next, stepId);
      if (!areAdjacent(from, to)) throw new GameError("Dhoota must move hex-by-hex through adjacent tiles.");
      if (to.ownerId !== null && to.ownerId !== player.id && to.establishmentType) {
        tributePayments.push({ ownerId: to.ownerId, element: to.element });
      }
      from = to;
    }
    const cost = freeExact2 ? {} : { Air: path.length * this.config.dhootaAirPerHex };
    const tributeCost = {};
    for (const payment of tributePayments) tributeCost[payment.element] = (tributeCost[payment.element] || 0) + 1;
    spend(player, addCosts(cost, tributeCost));
    for (const payment of tributePayments) {
      getPlayer(next, payment.ownerId).resources[payment.element] += 1;
    }
    const destination = getTile(next, path[path.length - 1]);
    if (destination.ownerId === null && countDhootaOnTile(next, destination.id) >= this.config.maxDhootaOnUnclaimedTile) {
      throw new GameError("An unclaimed tile can hold at most 2 Dhoota.");
    }
    dhoota.tileId = destination.id;
    next.log.unshift(`${player.name} moved ${dhoota.id} ${path.length} hexes.`);
    return next;
  }

  establishWithDhoota(state, dhootaId) {
    this.requirePhase(state, this.config.phases.action);
    const next = this.clone(state);
    const player = activePlayer(next);
    const dhoota = findDhoota(next, dhootaId);
    if (dhoota.ownerId !== player.id) throw new GameError("Can only establish with your own Dhoota.");
    const tile = getTile(next, dhoota.tileId);
    if (tile.ownerId !== null || tile.establishmentType) throw new GameError("Dhoota can establish only on an unclaimed tile.");
    spend(player, this.config.costs.House);
    tile.ownerId = player.id;
    tile.establishmentType = "House";
    tile.jeeva = this.config.establishments.House.minJeeva;
    dhoota.tileId = dhoota.homeTileId;
    next.log.unshift(`${player.name} established a House on ${tile.element}; Dhoota returned home.`);
    return this.recalculateVp(next);
  }

  purchaseAstra(state) {
    return this.purchaseCard(state, "astra");
  }

  purchaseMantra(state) {
    return this.purchaseCard(state, "mantra");
  }

  purchaseCard(state, kind) {
    this.requirePhase(state, this.config.phases.action);
    const next = this.clone(state);
    const player = activePlayer(next);
    if (kind === "astra") {
      if (!playerTiles(next, player.id).some((t) => t.establishmentType === "Fort")) throw new GameError("Must own at least one Fort to purchase an Astra.");
      spend(player, this.config.costs.Astra);
      drawCard(next, player, "astra");
    } else {
      if (!playerTiles(next, player.id).some((t) => t.establishmentType === "Temple")) throw new GameError("Must own at least one Temple to purchase a Mantra.");
      spend(player, this.config.costs.Mantra);
      drawCard(next, player, "mantra");
    }
    const card = player[`${kind}Hand`].at(-1);
    card.purchasedTurn = next.turnNumber;
    player.purchasedThisTurn.push(card.id);
    next.log.unshift(`${player.name} purchased ${card.name}; it is usable next turn.`);
    return next;
  }

  playMantra(state, cardId, args = {}) {
    this.requirePhase(state, this.config.phases.action);
    const next = this.clone(state);
    const player = activePlayer(next);
    const card = takeReadyCard(player.mantraHand, cardId, next.turnNumber);
    this.applyMantra(next, player, card, args);
    next.mantraDiscard.push(card);
    next.log.unshift(`${player.name} played ${card.name}.`);
    return this.recalculateVp(next);
  }

  playAstra(state, { attackerId, targetPlayerId, cardId, targetTileId, targetDhootaId, destinationTileId, resourceElement, counterCardId, mantraCounterCardId }) {
    this.requirePhase(state, this.config.phases.sangrama);
    const next = this.clone(state);
    const attacker = getPlayer(next, attackerId);
    const target = getPlayer(next, targetPlayerId);
    if (!next.sangrama || next.sangrama.attackUsedBy.includes(attackerId)) throw new GameError("Each player may initiate exactly one Astra attack during one Sangrama.");
    if (attacker.alignment === target.alignment) throw new GameError("Same-alignment attacks are prohibited.");
    const card = takeReadyCard(attacker.astraHand, cardId, next.turnNumber);
    if (card.super) {
      if (counterCardId) throw new GameError("Super Astras cannot be countered by Astras.");
      if (mantraCounterCardId) {
        const counter = takeNamedCard(target.mantraHand, mantraCounterCardId, "Maha-Raksha");
        next.mantraDiscard.push(counter);
        next.astraDiscard.push(card);
        next.sangrama.attackUsedBy.push(attackerId);
        next.log.unshift(`${target.name} cancelled ${card.name} with Maha-Raksha.`);
        return this.recalculateVp(next);
      }
    } else if (mantraCounterCardId) {
      const counter = takeNamedCard(target.mantraHand, mantraCounterCardId, "Raksha");
      next.mantraDiscard.push(counter);
      next.astraDiscard.push(card);
      next.sangrama.attackUsedBy.push(attackerId);
      next.log.unshift(`${target.name} cancelled ${card.name} with Raksha.`);
      return this.recalculateVp(next);
    } else if (counterCardId) {
      const needed = this.config.astraStockpile[card.name].counter;
      const counter = takeNamedCard(target.astraHand, counterCardId, needed);
      next.astraDiscard.push(counter, card);
      next.sangrama.attackUsedBy.push(attackerId);
      next.log.unshift(`${target.name} countered ${card.name} with ${counter.name}.`);
      return this.recalculateVp(next);
    }
    this.applyAstra(next, attacker, target, card, { targetTileId, targetDhootaId, destinationTileId, resourceElement });
    next.astraDiscard.push(card);
    next.sangrama.attackUsedBy.push(attackerId);
    next.log.unshift(`${attacker.name} resolved ${card.name} against ${target.name}.`);
    return this.recalculateVp(next);
  }

  endSangrama(state) {
    this.requirePhase(state, this.config.phases.sangrama);
    const next = this.clone(state);
    next.sangrama = null;
    next.phase = this.config.phases.trade;
    next.log.unshift("Devasura Sangrama ends.");
    return this.recalculateVp(next);
  }

  applyMantra(state, player, card, args) {
    if (card.purchasedTurn === state.turnNumber) throw new GameError("Purchased Mantra cannot be used during the purchase turn.");
    if (card.name === "Dhanavrishti") {
      const picks = args.resources || [];
      if (picks.length !== 2 || picks.some((r) => !ELEMENTS.includes(r))) throw new GameError("Dhanavrishti takes 2 resources of your choice.");
      for (const r of picks) player.resources[r] += 1;
    } else if (card.name === "Sampatti") {
      const element = requireElement(args.element);
      for (const other of state.players) {
        if (other.id === player.id) continue;
        player.resources[element] += other.resources[element];
        other.resources[element] = 0;
      }
    } else if (card.name === "Parivartana") {
      const returnResource = requireElement(args.returnResource);
      const gainElement = requireElement(args.gainElement);
      spend(player, { [returnResource]: 1 });
      player.resources[gainElement] += 2;
    } else if (card.name === "Bhiksha") {
      player.resources[requireElement(args.resource)] += 1;
    } else if (card.name === "Jeeva-Srishti") {
      const tile = getTile(state, args.tileId);
      requireOwnedEstablishment(tile, player.id);
      if (tile.jeeva >= this.config.maxJeevaPerEstablishment) throw new GameError("That establishment is at Jeeva capacity.");
      tile.jeeva += 1;
    } else if (card.name === "Vayu-Siddhi") {
      const moved = this.moveDhoota(state, args.dhootaId, args.path, { freeExact2: true });
      Object.assign(state, moved);
    } else if (card.name === "Nirman") {
      const tile = getTile(state, args.tileId);
      if (tile.ownerId !== player.id || tile.establishmentType || tile.jeeva < 1) throw new GameError("Nirman builds a House subject to normal location/Jeeva rules.");
      tile.establishmentType = "House";
    } else if (["Raksha", "Maha-Raksha"].includes(card.name)) {
      throw new GameError(`${card.name} is played as a response to an Astra, not as a normal action.`);
    }
  }

  applyAstra(state, attacker, target, card, args) {
    if (card.purchasedTurn === state.turnNumber) throw new GameError("Purchased Astra cannot be used during the purchase turn.");
    if (card.name === "Agneyastra") {
      const tile = getTile(state, args.targetTileId);
      requireOwnedEstablishment(tile, target.id);
      if (tile.jeeva <= 0) throw new GameError("Agneyastra requires a Jeeva to remove.");
      tile.jeeva -= 1;
    } else if (card.name === "Varunastra") {
      const tile = getTile(state, args.targetTileId);
      requireOwnedEstablishment(tile, target.id);
      if (tile.establishmentType !== "House") throw new GameError("Varunastra can target only a House.");
      tile.establishmentType = null;
    } else if (card.name === "Vayavyastra") {
      const dhoota = findDhoota(state, args.targetDhootaId);
      if (dhoota.ownerId !== target.id) throw new GameError("Vayavyastra targets one opponent Dhoota.");
      dhoota.tileId = dhoota.homeTileId;
    } else if (card.name === "Parvathastra") {
      const from = getTile(state, args.targetTileId);
      requireOwnedEstablishment(from, target.id);
      if (from.jeeva <= 0) throw new GameError("Parvathastra needs a Jeeva to move or remove.");
      from.jeeva -= 1;
      if (args.destinationTileId) {
        const to = getTile(state, args.destinationTileId);
        requireOwnedEstablishment(to, target.id);
        if (to.jeeva >= this.config.maxJeevaPerEstablishment) throw new GameError("Destination has no Jeeva capacity.");
        to.jeeva += 1;
      }
    } else if (card.name === "Indrastra") {
      const element = requireElement(args.resourceElement);
      spend(target, { [element]: 1 });
    } else if (card.name === "Brahmastra") {
      destroyAdvanced(state, args.targetTileId, target.id, "City");
    } else if (card.name === "Pashupatastra") {
      destroyAdvanced(state, args.targetTileId, target.id, "Fort");
    } else if (card.name === "Narayanastra") {
      destroyAdvanced(state, args.targetTileId, target.id, "Temple");
    }
  }

  produce(state, elementCounts) {
    for (const tile of state.tiles) {
      const matches = elementCounts[tile.element] || 0;
      if (!matches || !tile.establishmentType || tile.ownerId === null) continue;
      if (!isActive(tile, this.config)) continue;
      const amount = matches * this.config.establishments[tile.establishmentType].productionMultiplier;
      getPlayer(state, tile.ownerId).resources[tile.element] += amount;
      state.log.unshift(`${getPlayer(state, tile.ownerId).name} produced ${amount} ${tile.element}.`);
    }
  }

  resolveAlignmentRoll(state) {
    const roll = state.lastRoll;
    if (roll.type === "devaElement") {
      for (const player of state.players.filter((p) => p.alignment === "Deva")) {
        if (playerTiles(state, player.id).some((t) => t.element === roll.element && t.establishmentType)) {
          player.resources[roll.element] += 1;
          state.log.unshift(`${player.name} gained Deva boon: +1 ${roll.element}.`);
        }
      }
      state.phase = this.config.phases.trade;
    } else if (roll.type === "asuraElement") {
      const decisions = [];
      for (const player of state.players.filter((p) => p.alignment === "Deva")) {
        const matching = playerTiles(state, player.id).filter((t) => t.element === roll.element && t.establishmentType && t.jeeva > 0);
        if (!matching.length) continue;
        if (player.resources[roll.element] > 0) decisions.push({ playerId: player.id, element: roll.element });
        else {
          matching[0].jeeva -= 1;
          state.log.unshift(`${player.name} could not pay ${roll.element} and lost 1 Jeeva.`);
        }
      }
      if (decisions.length) {
        state.pending = { type: "asuraElement", element: roll.element, decisions };
        state.phase = this.config.phases.alignmentDecision;
      } else {
        state.phase = this.config.phases.trade;
      }
    } else if (roll.type === "devaAsura") {
      this.applyHandRisk(state);
      state.sangrama = { attackUsedBy: [] };
      state.phase = this.config.phases.sangrama;
      state.log.unshift("Devasura Sangrama begins.");
    } else {
      state.phase = this.config.phases.trade;
    }
  }

  applyHandRisk(state) {
    for (const player of state.players) {
      const total = resourceTotal(player);
      if (total <= this.config.handRiskThreshold) continue;
      const keep = Math.ceil(total / 2);
      let toDiscard = total - keep;
      for (const element of ELEMENTS) {
        const amount = Math.min(player.resources[element], toDiscard);
        player.resources[element] -= amount;
        toDiscard -= amount;
        if (toDiscard === 0) break;
      }
      state.log.unshift(`${player.name} resolved 7-card Sangrama risk and kept ${keep} resources.`);
    }
  }

  recalculateVp(state) {
    for (const player of state.players) {
      let vp = 0;
      const tiles = playerTiles(state, player.id);
      for (const tile of tiles) {
        if (tile.establishmentType && isActive(tile, this.config)) vp += this.config.establishments[tile.establishmentType].vp;
      }
      if (new Set(tiles.filter((t) => t.establishmentType).map((t) => t.element)).size === ELEMENTS.length) {
        vp += this.config.bonusVp.masterAllFiveElements;
      }
      if (tiles.filter((t) => t.establishmentType === "City").length >= 3) vp += this.config.bonusVp.threeCities;
      player.vp = vp;
    }
    return state;
  }

  requirePhase(state, phase) {
    if (state.phase !== phase) throw new GameError(`Expected phase ${phase}, got ${state.phase}.`);
  }

  requireActivePhase(state, phases) {
    if (!phases.includes(state.phase)) throw new GameError(`Expected one of ${phases.join(", ")}, got ${state.phase}.`);
  }
}

export function createAstraDeck(config = GAME_CONFIG) {
  const deck = [];
  for (const [name, def] of Object.entries(config.astraStockpile)) {
    for (let i = 0; i < def.copies; i += 1) {
      deck.push({ id: `A:${name}:${i + 1}`, name, kind: "astra", super: def.super, purchasedTurn: 0 });
    }
  }
  return deck;
}

export function createMantraDeck(config = GAME_CONFIG) {
  const deck = [];
  for (const [name, def] of Object.entries(config.mantraStockpile)) {
    for (let i = 0; i < def.copies; i += 1) {
      deck.push({ id: `M:${name}:${i + 1}`, name, kind: "mantra", purchasedTurn: 0 });
    }
  }
  return deck;
}

export function classifyRoll(deva, asura) {
  const elementCounts = Object.fromEntries(ELEMENTS.map((e) => [e, 0]));
  if (ELEMENTS.includes(deva)) elementCounts[deva] += 1;
  if (ELEMENTS.includes(asura)) elementCounts[asura] += 1;
  if (deva === "Deva" && asura === "Asura") return { deva, asura, type: "devaAsura", element: null, elementCounts };
  if (deva === "Deva" && ELEMENTS.includes(asura)) return { deva, asura, type: "devaElement", element: asura, elementCounts };
  if (ELEMENTS.includes(deva) && asura === "Asura") return { deva, asura, type: "asuraElement", element: deva, elementCounts };
  if (deva === asura) return { deva, asura, type: "sameElement", element: deva, elementCounts };
  return { deva, asura, type: "differentElements", element: null, elementCounts };
}

export function createBoard(playerCount, config = GAME_CONFIG) {
  const wanted = config.boardByPlayerCount[playerCount];
  const coords = [];
  const radius = playerCount === 2 ? 2 : 3;
  for (let q = -radius; q <= radius; q += 1) {
    for (let r = -radius; r <= radius; r += 1) {
      const s = -q - r;
      if (Math.max(Math.abs(q), Math.abs(r), Math.abs(s)) <= radius) coords.push({ q, r });
    }
  }
  coords.sort((a, b) => hexDistance({ q: 0, r: 0 }, a) - hexDistance({ q: 0, r: 0 }, b) || a.q - b.q || a.r - b.r);
  const selected = coords.slice(0, wanted.hexes);
  const elementPool = ELEMENTS.flatMap((element) => Array.from({ length: wanted.eachElement }, () => element));
  return selected.map((coord, index) => ({
    id: `T${index}`,
    q: coord.q,
    r: coord.r,
    element: elementPool[index],
    ownerId: null,
    establishmentType: null,
    jeeva: 0
  }));
}

export function isActive(tile, config = GAME_CONFIG) {
  return Boolean(tile.establishmentType) && tile.jeeva >= config.establishments[tile.establishmentType].minJeeva;
}

export function resourceTotal(player) {
  return ELEMENTS.reduce((sum, element) => sum + player.resources[element], 0);
}

export function playerTiles(state, playerId) {
  return state.tiles.filter((tile) => tile.ownerId === playerId);
}

function cloneResources(base = {}) {
  return Object.fromEntries(ELEMENTS.map((element) => [element, base[element] || 0]));
}

function pick(items, rng) {
  return items[Math.floor(rng() * items.length)];
}

function activePlayer(state) {
  return getPlayer(state, state.activePlayerId);
}

function getPlayer(state, playerId) {
  const player = state.players.find((p) => p.id === Number(playerId));
  if (!player) throw new GameError("Unknown player.");
  return player;
}

function getTile(state, tileId) {
  const tile = state.tiles.find((t) => t.id === tileId);
  if (!tile) throw new GameError("Unknown tile.");
  return tile;
}

function findDhoota(state, dhootaId) {
  for (const player of state.players) {
    const dhoota = player.dhoota.find((d) => d.id === dhootaId);
    if (dhoota) return dhoota;
  }
  throw new GameError("Unknown Dhoota.");
}

function countDhootaOnTile(state, tileId) {
  return state.players.flatMap((p) => p.dhoota).filter((d) => d.tileId === tileId).length;
}

function spend(player, cost) {
  for (const [element, amount] of Object.entries(cost || {})) {
    if ((player.resources[element] || 0) < amount) throw new GameError(`${player.name} lacks ${amount} ${element}.`);
  }
  for (const [element, amount] of Object.entries(cost || {})) player.resources[element] -= amount;
}

function gain(player, resources) {
  for (const [element, amount] of Object.entries(resources || {})) player.resources[element] += amount;
}

function addCosts(...costs) {
  const total = {};
  for (const cost of costs) {
    for (const [element, amount] of Object.entries(cost || {})) total[element] = (total[element] || 0) + amount;
  }
  return total;
}

function requireOwnedEstablishment(tile, ownerId) {
  if (tile.ownerId !== ownerId || !tile.establishmentType) throw new GameError("Expected an owned establishment.");
}

function requireElement(element) {
  if (!ELEMENTS.includes(element)) throw new GameError("Expected a basic element.");
  return element;
}

function drawCard(state, player, kind) {
  const deckName = kind === "astra" ? "astraDeck" : "mantraDeck";
  const discardName = kind === "astra" ? "astraDiscard" : "mantraDiscard";
  const handName = kind === "astra" ? "astraHand" : "mantraHand";
  if (!state[deckName].length) {
    state[deckName] = state[discardName].splice(0);
    state[discardName] = [];
  }
  if (!state[deckName].length) throw new GameError(`No ${kind} cards remain.`);
  player[handName].push(state[deckName].pop());
}

function takeReadyCard(hand, cardId, turnNumber) {
  const index = hand.findIndex((c) => c.id === cardId);
  if (index < 0) throw new GameError("Card is not in hand.");
  const [card] = hand.splice(index, 1);
  if (card.purchasedTurn === turnNumber) throw new GameError("Purchased card cannot be used during the purchase turn.");
  return card;
}

function takeNamedCard(hand, cardId, name) {
  const index = hand.findIndex((c) => c.id === cardId);
  if (index < 0) throw new GameError("Counter card is not in hand.");
  const [card] = hand.splice(index, 1);
  if (card.name !== name) throw new GameError(`Expected ${name} as the counter.`);
  return card;
}

function destroyAdvanced(state, tileId, ownerId, type) {
  const tile = getTile(state, tileId);
  requireOwnedEstablishment(tile, ownerId);
  if (tile.establishmentType !== type) throw new GameError(`This Super Astra targets one opponent ${type}.`);
  tile.establishmentType = null;
}

function areAdjacent(a, b) {
  return hexDistance(a, b) === 1;
}

function hexDistance(a, b) {
  const dq = a.q - b.q;
  const dr = a.r - b.r;
  return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
}
