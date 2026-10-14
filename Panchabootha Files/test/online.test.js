import test from "node:test";
import assert from "node:assert/strict";
import { authorize, redactState, createRoom, claimSeat, roomForToken, applyAction } from "../lib/rooms.js";
import { playerTiles } from "../lib/engine.js";

test("redactState hides opponent hands and decks, keeps own, does not mutate input", () => {
  const state = {
    activePlayerId: 0,
    players: [
      { id: 0, astraHand: [{ id: "A:x", name: "Agneyastra" }], mantraHand: [{ id: "M:y", name: "Bhiksha" }] },
      { id: 1, astraHand: [{ id: "A:z", name: "Brahmastra" }, { id: "A:w", name: "Indrastra" }], mantraHand: [] }
    ],
    astraDeck: [{ id: "A:1" }, { id: "A:2" }],
    mantraDeck: [{ id: "M:1" }]
  };
  const view = redactState(state, 0);

  assert.deepEqual(view.players[0].astraHand, [{ id: "A:x", name: "Agneyastra" }]);
  assert.deepEqual(view.players[1].astraHand, [{ id: "A:z", hidden: true }, { id: "A:w", hidden: true }]);
  assert.deepEqual(view.astraDeck, [null, null]);
  assert.deepEqual(view.mantraDeck, [null]);
  assert.equal(state.players[1].astraHand[0].name, "Brahmastra");
});

test("authorize enforces seat ownership and turn order", () => {
  const state = { activePlayerId: 0 };
  assert.equal(authorize(state, 0, "nonsense", []), "Unknown action.");
  assert.equal(authorize(state, 1, "setAlignment", [1, "Deva"]), null);
  assert.equal(authorize(state, 0, "setAlignment", [1, "Deva"]), "You can only act for your own seat.");
  assert.equal(authorize(state, 0, "placeStartingHouse", [0, "T3"]), null);
  assert.equal(authorize(state, 1, "placeStartingHouse", [0, "T3"]), "You can only act for your own seat.");
  assert.equal(authorize(state, 0, "rollDice", []), null);
  assert.equal(authorize(state, 1, "rollDice", []), "It is not your turn.");
  assert.equal(authorize(state, 2, "playAstra", [{ attackerId: 2 }]), null);
  assert.equal(authorize(state, 0, "playAstra", [{ attackerId: 2 }]), "You can only attack as your own seat.");
});

test("room lifecycle: create, join by identity, full, reconnect, names", () => {
  const code = createRoom({ playerCount: 2, seed: "unit" });
  assert.match(code, /^[A-Z0-9]{4}$/);

  const p0 = claimSeat(code, { userId: "u1", name: "Ann" });
  assert.equal(p0.playerId, 0);
  assert.equal(p0.name, "Ann");
  const p1 = claimSeat(code, { userId: "u2", name: "Bob" });
  assert.equal(p1.playerId, 1);
  const full = claimSeat(code, { userId: "u3", name: "Cid" });
  assert.equal(full.status, 409);
  const reconnect = claimSeat(code, { userId: "u1" });
  assert.equal(reconnect.playerId, 0);
  assert.equal(roomForToken(code, "nope").playerId, -1);

  const { room } = roomForToken(code, p0.token);
  assert.equal(room.state.players[0].name, "Ann");
  assert.equal(room.state.players[1].name, "Bob");
});

test("applyAction runs setup + turn order through the engine", () => {
  const code = createRoom({ playerCount: 2, seed: "flow" });
  const t = [
    claimSeat(code, { userId: "a", name: "A" }).token,
    claimSeat(code, { userId: "b", name: "B" }).token
  ];
  const { room } = roomForToken(code, t[0]);

  // snake queue for 2 players is [0, 1, 1, 0]
  for (const seat of [0, 1, 1, 0]) {
    const owned = playerTiles(room.state, seat).map((tile) => tile.element);
    const tile = room.state.tiles.find((tl) => tl.ownerId === null && !owned.includes(tl.element));
    const res = applyAction(room, seat, "placeStartingHouse", [seat, tile.id]);
    assert.equal(res.ok, true, JSON.stringify(res));
  }
  assert.equal(room.state.phase, "roll");

  assert.equal(applyAction(room, 1, "rollDice", []).error, "It is not your turn.");
  assert.equal(applyAction(room, 0, "rollDice", []).ok, true);
  assert.ok(room.state.lastRoll);
});
