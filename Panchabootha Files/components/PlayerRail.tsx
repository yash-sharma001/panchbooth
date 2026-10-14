"use client";

import type { GameApi } from "@/hooks/useGame";
import { resourceTotal, playerTiles } from "@/lib/engine.js";
import type { Player } from "@/lib/types";
import { SEAT_BORDER } from "./icons";

function PlayerCard({ api, player }: { api: GameApi; player: Player }) {
  const { state, viewerId } = api;
  const isActive = player.id === state.activePlayerId;
  const isYou = player.id === viewerId && !!api.online;
  const tiles = playerTiles(state, player.id).length;
  const cards = player.astraHand.length + player.mantraHand.length;

  return (
    <div
      className={`panel border-l-4 p-3 ${SEAT_BORDER[player.id]} ${
        isActive ? "bg-panel-2" : "bg-panel/60"
      }`}
    >
      <div className="flex items-baseline justify-between">
        <span className="text-[15px] font-semibold">
          {player.name}
          {isYou && <span className="ml-1.5 text-xs font-normal text-ink-faint">you</span>}
        </span>
        <span className="text-sm font-semibold text-accent">{player.vp}</span>
      </div>
      <div className="mt-0.5 text-xs">
        <span className={player.alignment === "Deva" ? "text-deva" : "text-asura"}>
          {player.alignment}
        </span>
        {isActive && <span className="text-ink-faint"> &middot; active</span>}
      </div>
      <div className="mt-2 flex gap-3 text-xs text-ink-dim">
        <span title="resources">&#128101; {resourceTotal(player)}</span>
        <span title="establishments">&#127968; {tiles}</span>
        <span title="cards">&#127183; {cards}</span>
      </div>
    </div>
  );
}

export function PlayerRail({ api }: { api: GameApi }) {
  return (
    <div className="flex flex-col gap-2 overflow-y-auto p-3">
      {api.state.players.map((p) => (
        <PlayerCard key={p.id} api={api} player={p} />
      ))}
    </div>
  );
}
