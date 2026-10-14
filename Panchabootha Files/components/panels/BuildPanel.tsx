"use client";

import { useState } from "react";
import type { GameApi } from "@/hooks/useGame";
import type { Element, EstablishmentType } from "@/lib/types";
import { GAME_CONFIG } from "@/lib/config.js";
import { playerTiles } from "@/lib/engine.js";
import { canAfford } from "@/lib/game-helpers";
import { PanelShell } from "./PanelShell";
import { ElementIcon, ELEMENT_CLASS, PieceIcon } from "../icons";

const UPGRADES: EstablishmentType[] = ["City", "Temple", "Fort"];

function CostRow({ cost }: { cost: Partial<Record<Element, number>> }) {
  return (
    <span className="flex flex-wrap gap-1">
      {(Object.entries(cost) as [Element, number][]).map(([el, n]) => (
        <span key={el} className={`chip bg-panel-2 ${ELEMENT_CLASS[el]}`}>
          <ElementIcon element={el} className="h-3 w-3" />
          {el} {n}
        </span>
      ))}
    </span>
  );
}

export function BuildPanel({ api }: { api: GameApi }) {
  const { state, viewerId, act, setUi } = api;
  const tiles = playerTiles(state, viewerId);
  const [tileId, setTileId] = useState<string>(tiles[0]?.id ?? "");
  const tile = tiles.find((t) => t.id === tileId) ?? tiles[0];
  const me = state.players[viewerId];

  const close = () => setUi((u) => ({ ...u, panel: null }));
  if (!tile) return <PanelShell title="Build" onClose={close}>You own no tiles yet.</PanelShell>;

  const jeevaCap = GAME_CONFIG.maxJeevaPerEstablishment;

  return (
    <PanelShell title="Build & grow" onClose={close}>
      <label className="block text-xs text-ink-dim">
        Owned tile
        <select
          value={tileId}
          onChange={(e) => setTileId(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-line bg-panel-2 px-2 py-1.5 text-sm"
        >
          {tiles.map((t) => (
            <option key={t.id} value={t.id}>
              {t.element} · {t.establishmentType ?? "empty"} · J{t.jeeva}
            </option>
          ))}
        </select>
      </label>

      <div className="mt-4 flex items-center gap-2">
        <PieceIcon type={tile.establishmentType ?? "ruins"} className="h-6 w-6 text-ink-dim" />
        <span className="text-sm font-semibold">
          {tile.element} · {tile.establishmentType ?? "empty tile"}
        </span>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-ink-dim">
          <span>Jeeva</span>
          <span>
            {tile.jeeva} / {jeevaCap}
          </span>
        </div>
        <div className="mt-1 flex gap-1">
          {Array.from({ length: jeevaCap }, (_, i) => (
            <span
              key={i}
              className={`h-2 flex-1 rounded-full ${i < tile.jeeva ? "bg-accent" : "bg-panel-2"}`}
            />
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="btn"
          disabled={tile.jeeva >= jeevaCap || !canAfford(me.resources, GAME_CONFIG.costs.Jeeva)}
          onClick={() => act("createJeeva", tile.id)}
        >
          Create Jeeva <CostRow cost={GAME_CONFIG.costs.Jeeva} />
        </button>
        {!tile.establishmentType && (
          <button
            type="button"
            className="btn"
            disabled={tile.jeeva < 1 || !canAfford(me.resources, GAME_CONFIG.costs.House)}
            onClick={() => act("buildHouse", tile.id)}
          >
            Build House <CostRow cost={GAME_CONFIG.costs.House} />
          </button>
        )}
      </div>

      {tile.establishmentType === "House" && (
        <div className="mt-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Upgrade to</h3>
          <div className="mt-2 space-y-2">
            {UPGRADES.map((type) => {
              const def = GAME_CONFIG.establishments[type];
              const affordable = canAfford(me.resources, GAME_CONFIG.costs[type]);
              const enoughJeeva = tile.jeeva >= def.minJeeva;
              return (
                <button
                  key={type}
                  type="button"
                  disabled={!affordable || !enoughJeeva}
                  onClick={() => act("upgradeEstablishment", tile.id, type)}
                  className="panel flex w-full flex-col items-start gap-1.5 p-3 text-left disabled:opacity-50"
                >
                  <span className="flex w-full items-center justify-between">
                    <span className="font-semibold">{type}</span>
                    <span className="text-xs text-ink-dim">
                      {def.vp} VP · {def.productionMultiplier}× yield
                    </span>
                  </span>
                  <CostRow cost={GAME_CONFIG.costs[type]} />
                  {!enoughJeeva && (
                    <span className="text-xs text-ink-faint">
                      Needs {def.minJeeva} Jeeva · you have {tile.jeeva}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </PanelShell>
  );
}
