"use client";

import type { GameApi } from "@/hooks/useGame";
import { STEPPER, stepIndex } from "@/lib/game-helpers";
import { GAME_CONFIG } from "@/lib/config.js";
import { AlignIcon, TrophyIcon } from "./icons";

export function TopBar({ api, onMenu }: { api: GameApi; onMenu: () => void }) {
  const { state } = api;
  const active = state.players[state.activePlayerId];
  const step = stepIndex(state.phase);
  const isDeva = active.alignment === "Deva";

  return (
    <header className="flex items-center gap-4 border-b border-line px-5 py-3">
      <div className="flex items-center gap-2.5">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ background: isDeva ? "var(--deva)" : "var(--asura)" }}
        />
        <span className="text-[15px] font-semibold">{active.name}&rsquo;s turn</span>
        <span
          className={`chip ${isDeva ? "bg-deva/15 text-deva" : "bg-asura/15 text-asura"}`}
        >
          <AlignIcon alignment={active.alignment} className="h-3 w-3" />
          {active.alignment}
        </span>
      </div>

      <nav className="mx-auto hidden items-center gap-1.5 text-sm text-ink-faint md:flex">
        {STEPPER.map((label, i) => (
          <span key={label} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-ink-faint/50">›</span>}
            <span
              className={
                i === step
                  ? "rounded-lg bg-accent/20 px-2 py-0.5 font-medium text-accent"
                  : i < step
                    ? "text-ink-dim"
                    : ""
              }
            >
              {label}
            </span>
          </span>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-3">
        <span className="flex items-center gap-1.5 text-sm font-semibold">
          <TrophyIcon className="h-4 w-4 text-accent" />
          {active.vp}
          <span className="text-ink-faint">/ {GAME_CONFIG.vpTarget} VP</span>
        </span>
        <button
          type="button"
          onClick={onMenu}
          aria-label="Menu"
          className="rounded-lg px-2 py-1 text-lg leading-none text-ink-dim hover:bg-panel-2"
        >
          &middot;&middot;&middot;
        </button>
      </div>
    </header>
  );
}
