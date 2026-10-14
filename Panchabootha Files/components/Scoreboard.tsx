"use client";

import type { GameApi } from "@/hooks/useGame";
import { GAME_CONFIG } from "@/lib/config.js";
import { vpBreakdown } from "@/lib/game-helpers";
import { TrophyIcon, SEAT_TEXT } from "./icons";

export function Scoreboard({ api }: { api: GameApi }) {
  const { state, newGame, online } = api;
  const ranked = [...state.players].sort((a, b) => b.vp - a.vp);
  const winner = state.players[state.winnerId ?? ranked[0].id];

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center p-6">
      <div className="panel p-6">
        <div className="flex items-center gap-3">
          <TrophyIcon className="h-8 w-8 text-accent" />
          <div>
            <h1 className="text-xl font-semibold">
              {winner.name} wins with {winner.vp}
            </h1>
            <p className="text-sm text-ink-dim">
              {winner.alignment} &middot; {state.turnNumber} turns &middot; seed {state.seed}
            </p>
          </div>
        </div>

        <ul className="mt-5 space-y-3">
          {ranked.map((p) => {
            const lines = vpBreakdown(state, p.id);
            return (
              <li key={p.id} className={`border-l-4 pl-3 ${SEAT_TEXT[p.id]} border-current`}>
                <div className="flex items-baseline justify-between text-ink">
                  <span className="font-semibold">{p.name}</span>
                  <span className="text-lg font-semibold text-accent">{p.vp}</span>
                </div>
                <div className="mt-1 flex gap-1">
                  {Array.from({ length: GAME_CONFIG.vpTarget }, (_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 flex-1 rounded-full ${i < p.vp ? "bg-accent" : "bg-panel-2"}`}
                    />
                  ))}
                </div>
                <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-ink-dim">
                  {lines.length === 0 && <span>no scoring establishments</span>}
                  {lines.map((l, i) => (
                    <span key={i} className={l.bonus ? "text-accent" : l.muted ? "text-ink-faint" : ""}>
                      {l.label} &middot; {l.vp}
                    </span>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>

        {!online && (
          <button
            type="button"
            className="btn btn-accent mt-6"
            onClick={() => newGame(state.playerCount, state.seed)}
          >
            Rematch, same seed
          </button>
        )}
      </div>
    </div>
  );
}
