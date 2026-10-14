"use client";

import type { GameApi } from "@/hooks/useGame";
import type { Element } from "@/lib/types";
import { ELEMENTS, GAME_CONFIG } from "@/lib/config.js";
import { playerTiles } from "@/lib/engine.js";
import { Board } from "./Board";
import { AlignIcon, ElementIcon, ELEMENT_CLASS, SEAT_TEXT } from "./icons";

export function SetupScreen({ api }: { api: GameApi }) {
  const { state, viewerId, act, online } = api;
  const placerId = state.setupQueue[0];
  const placer = state.players[placerId];
  const locked = state.alignmentLocked[placerId];
  const houseNo = playerTiles(state, placerId).length + 1;
  const usedElements = new Set(playerTiles(state, placerId).map((t) => t.element));
  const board = GAME_CONFIG.boardByPlayerCount[state.playerCount];
  const iAmPlacer = !online || viewerId === placerId;

  // snake order: [...order, ...order reversed]
  const order = state.players.map((p) => p.id);
  const fullQueue = [...order, ...order.slice().reverse()];
  const done = fullQueue.length - state.setupQueue.length;
  const half = order.length;

  return (
    <div className="mx-auto flex h-screen max-w-6xl flex-col p-5">
      <header className="flex items-baseline justify-between border-b border-line pb-3">
        <h1 className="text-lg font-semibold">
          Setup &middot; placing {houseNo === 1 ? "first" : "second"} House
        </h1>
        <span className="text-sm text-ink-faint">
          {state.playerCount} players &middot; {board.hexes} hexes &middot; {board.eachElement} per element
        </span>
      </header>

      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
        {fullQueue.map((pid, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i === 0 && <span className="text-ink-faint">Round 1</span>}
            {i === half && <span className="ml-2 text-ink-faint">Round 2</span>}
            <span
              className={`chip border ${SEAT_TEXT[pid]} ${
                i === done
                  ? "border-accent bg-accent/15"
                  : i < done
                    ? "border-line text-ink-faint line-through"
                    : "border-line"
              }`}
            >
              {state.players[pid].name}
            </span>
          </span>
        ))}
      </div>

      <div className="mt-3 grid flex-1 grid-cols-[1fr_320px] gap-4 overflow-hidden">
        <div className="relative overflow-hidden rounded-2xl border border-line bg-panel">
          <Board api={api} />
        </div>

        <div className="flex flex-col gap-3 overflow-y-auto">
          <div className="panel p-3">
            <h2 className="text-sm font-semibold">
              <span className={SEAT_TEXT[placerId]}>{placer.name}</span> places House {houseNo}
            </h2>
            <p className="mt-1 text-xs text-ink-dim">
              {houseNo === 2
                ? "Must sit on a different element from your first."
                : "Choose any unclaimed tile."}
              {!iAmPlacer && " — waiting for this player."}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(ELEMENTS as Element[]).map((el) => {
                const legal = !usedElements.has(el);
                return (
                  <span
                    key={el}
                    className={`chip ${legal ? `bg-panel-2 ${ELEMENT_CLASS[el]}` : "bg-panel-2 text-ink-faint line-through"}`}
                  >
                    <ElementIcon element={el} className="h-3 w-3" />
                    {el}
                  </span>
                );
              })}
            </div>
          </div>

          {!locked && iAmPlacer && (
            <div className="panel p-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
                Choose your allegiance
              </h3>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(["Deva", "Asura"] as const).map((al) => (
                  <button
                    key={al}
                    type="button"
                    onClick={() => act("setAlignment", placerId, al)}
                    className={`panel flex flex-col items-start gap-1 p-3 text-left hover:border-ink-faint ${
                      al === "Deva" ? "hover:border-deva" : "hover:border-asura"
                    }`}
                  >
                    <span className={`flex items-center gap-1.5 font-semibold ${al === "Deva" ? "text-deva" : "text-asura"}`}>
                      <AlignIcon alignment={al} className="h-4 w-4" />
                      {al}
                    </span>
                    <span className="text-xs text-ink-dim">
                      {al === "Deva"
                        ? "Elemental boons, but exposed to Asura disruption."
                        : "No boons; immune to Asura + element strikes."}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="panel p-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Starting hand</h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(ELEMENTS as Element[]).map((el) => (
                <span key={el} className={`chip bg-panel-2 ${ELEMENT_CLASS[el]}`}>
                  <ElementIcon element={el} className="h-3 w-3" />
                  {el} 1
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
