"use client";

import type { GameApi } from "@/hooks/useGame";
import type { Element } from "@/lib/types";
import { ELEMENTS, GAME_CONFIG } from "@/lib/config.js";
import { resourceTotal } from "@/lib/engine.js";
import { ElementIcon, ELEMENT_CLASS, WarnIcon } from "./icons";

export function ResourceBar({ api }: { api: GameApi }) {
  const me = api.state.players[api.viewerId];
  const total = resourceTotal(me);
  const overThreshold = total > GAME_CONFIG.handRiskThreshold;

  return (
    <div className="flex items-center gap-2 border-t border-line px-5 py-2.5">
      {(ELEMENTS as Element[]).map((el) => (
        <span
          key={el}
          className={`chip bg-panel-2 ${ELEMENT_CLASS[el]}`}
          style={{ boxShadow: `inset 0 0 0 1px color-mix(in srgb, currentColor 35%, transparent)` }}
        >
          <ElementIcon element={el} className="h-3.5 w-3.5" />
          {el} {me.resources[el]}
        </span>
      ))}
      <span
        className={`ml-auto flex items-center gap-1.5 text-xs font-medium ${
          overThreshold ? "text-accent" : "text-ink-faint"
        }`}
      >
        <WarnIcon className="h-3.5 w-3.5" />
        {total} / {GAME_CONFIG.handRiskThreshold} &middot; discard-half risk
      </span>
    </div>
  );
}
