"use client";

import { useMemo } from "react";
import type { GameApi } from "@/hooks/useGame";
import type { Tile } from "@/lib/types";
import { isActive as tileActive, playerTiles } from "@/lib/engine.js";
import { GAME_CONFIG } from "@/lib/config.js";
import {
  axialToPixel,
  areAdjacent,
  dhootaById,
  dhootaMoveCost,
  canAfford,
  formatCost
} from "@/lib/game-helpers";
import { PieceIcon, SEAT_TEXT } from "./icons";

const HEX_CLIP = "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)";
const ELEMENT_VAR: Record<string, string> = {
  Earth: "var(--earth)",
  Water: "var(--water)",
  Fire: "var(--fire)",
  Air: "var(--air)",
  Akasha: "var(--akasha)"
};

export function Board({ api }: { api: GameApi }) {
  const { state, viewerId, ui, setUi, act, online } = api;

  const layout = useMemo(() => {
    const pts = state.tiles.map((t) => axialToPixel(t.q, t.r));
    const minX = Math.min(...pts.map((p) => p.x));
    const minY = Math.min(...pts.map((p) => p.y));
    const maxX = Math.max(...pts.map((p) => p.x));
    const maxY = Math.max(...pts.map((p) => p.y));
    return {
      pts,
      minX,
      minY,
      width: maxX - minX + 130,
      height: maxY - minY + 150
    };
  }, [state.tiles]);

  const selectedDhoota = dhootaById(state, ui.selectedDhoota);
  const dhootaMine =
    selectedDhoota && selectedDhoota.ownerId === state.activePlayerId && viewerId === state.activePlayerId;

  // setup placement
  const setupPlacer = state.phase === "setup" ? state.setupQueue[0] : null;
  const iPlace = setupPlacer !== null && (!online || viewerId === setupPlacer) && state.alignmentLocked[setupPlacer];
  const placerElements =
    setupPlacer !== null ? new Set(playerTiles(state, setupPlacer).map((t) => t.element)) : new Set<string>();

  // alignment "lose jeeva" decision
  const asuraDecider =
    state.phase === "alignmentDecision" && state.pending?.type === "asuraElement"
      ? state.pending.decisions[0]?.playerId ?? null
      : null;
  const iDecide = asuraDecider !== null && (!online || viewerId === asuraDecider);

  function tileState(tile: Tile) {
    if (iPlace && tile.ownerId === null && !placerElements.has(tile.element)) {
      return { kind: "place" as const };
    }
    if (
      iDecide &&
      tile.ownerId === asuraDecider &&
      tile.element === state.pending?.element &&
      tile.jeeva > 0
    ) {
      return { kind: "lose" as const };
    }
    if (selectedDhoota && dhootaMine) {
      const from = state.tiles.find((t) => t.id === selectedDhoota.tileId);
      if (from && areAdjacent(from, tile)) {
        const cost = dhootaMoveCost(tile, selectedDhoota.ownerId);
        const payer = state.players[selectedDhoota.ownerId];
        return {
          kind: "reach" as const,
          affordable: canAfford(payer.resources, cost),
          label: tile.ownerId === null ? "unclaimed" : formatCost(cost)
        };
      }
    }
    return { kind: "idle" as const };
  }

  function onTile(tile: Tile) {
    const ts = tileState(tile);
    if (ts.kind === "place") act("placeStartingHouse", setupPlacer, tile.id);
    else if (ts.kind === "lose")
      act("resolveAsuraDecision", asuraDecider, { kind: "loseJeeva", tileId: tile.id });
    else if (ts.kind === "reach" && ts.affordable)
      act("moveDhoota", ui.selectedDhoota, [tile.id]);
  }

  return (
    <div className="relative h-full overflow-auto p-4">
      <div className="relative mx-auto" style={{ width: layout.width, height: layout.height }}>
        {state.tiles.map((tile, i) => {
          const p = layout.pts[i];
          const x = p.x - layout.minX + 8;
          const y = p.y - layout.minY + 8;
          const owned = tile.ownerId !== null;
          const active = !!tile.establishmentType && tileActive(tile, GAME_CONFIG);
          const producing =
            active && owned && (state.lastRoll?.elementCounts?.[tile.element] ?? 0) > 0;
          const ts = tileState(tile);
          const clickable = ts.kind !== "idle";
          const seatText = owned ? SEAT_TEXT[tile.ownerId as number] : "text-ink-faint";
          const dhootaHere = state.players.flatMap((pl) => pl.dhoota).filter((d) => d.tileId === tile.id);

          return (
            <button
              key={tile.id}
              type="button"
              disabled={!clickable}
              onClick={() => onTile(tile)}
              className={`absolute flex flex-col items-center justify-center gap-1 text-center transition-transform ${
                clickable ? "cursor-pointer hover:scale-[1.04]" : "cursor-default"
              }`}
              style={{
                left: x,
                top: y,
                width: 116,
                height: 134,
                clipPath: HEX_CLIP,
                background: `color-mix(in srgb, ${ELEMENT_VAR[tile.element]} ${owned ? 34 : 26}%, var(--panel))`,
                boxShadow: `inset 0 0 0 3px ${
                  ts.kind === "reach"
                    ? ts.affordable
                      ? "var(--accent)"
                      : "var(--asura)"
                    : ts.kind === "place" || ts.kind === "lose"
                      ? "var(--accent)"
                      : owned
                        ? `var(--p${tile.ownerId})`
                        : "var(--line)"
                }${producing ? ", 0 0 22px var(--accent)" : ""}`,
                outline: ts.kind === "reach" ? "2px dashed var(--accent)" : undefined,
                outlineOffset: "-6px"
              }}
            >
              <span className="text-[11px] font-medium text-ink-dim">{tile.element}</span>
              {tile.establishmentType ? (
                <span className={`flex flex-col items-center ${seatText}`}>
                  <PieceIcon type={tile.establishmentType} className="h-7 w-7" />
                  <span className="text-[10px] font-semibold">
                    {tile.establishmentType}
                    {tile.establishmentType === "City" ? " 2×" : ""}
                  </span>
                </span>
              ) : owned ? (
                <PieceIcon type="ruins" className={`h-6 w-6 ${seatText}`} />
              ) : null}
              {tile.establishmentType && (
                <span className="flex gap-0.5">
                  {Array.from({ length: GAME_CONFIG.maxJeevaPerEstablishment }, (_, k) => (
                    <span
                      key={k}
                      className={`h-1.5 w-1.5 rounded-full ${
                        k < tile.jeeva ? "bg-accent" : "bg-ink-faint/30"
                      }`}
                    />
                  ))}
                </span>
              )}
              {tile.establishmentType && !active && (
                <span className="text-[9px] uppercase tracking-wide text-ink-faint">Inactive</span>
              )}
              {ts.kind === "reach" && (
                <span className="absolute bottom-3 text-[9px] font-semibold text-accent">
                  {ts.label}
                </span>
              )}
              {dhootaHere.length > 0 && (
                <span className="absolute right-3 top-8 flex flex-col gap-0.5">
                  {dhootaHere.map((d) => (
                    <span
                      key={d.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (d.ownerId === state.activePlayerId && viewerId === state.activePlayerId)
                          setUi((u) => ({ ...u, selectedDhoota: u.selectedDhoota === d.id ? null : d.id }));
                      }}
                      className={`grid h-4 w-4 place-items-center rounded-full border-2 border-white/80 text-[8px] font-bold text-black ${
                        SEAT_TEXT[d.ownerId]
                      } ${ui.selectedDhoota === d.id ? "ring-2 ring-accent" : ""}`}
                      style={{ background: `var(--p${d.ownerId})` }}
                    >
                      {d.id.split(":")[1].replace("D", "")}
                    </span>
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
