"use client";

import type { GameApi } from "@/hooks/useGame";
import { tileById } from "@/lib/game-helpers";
import { PanelShell } from "./PanelShell";
import { DhootaIcon } from "../icons";

export function DhootaPanel({ api }: { api: GameApi }) {
  const { state, viewerId, ui, setUi, act } = api;
  const me = state.players[viewerId];
  const close = () => setUi((u) => ({ ...u, panel: null, selectedDhoota: null }));
  const selected = me.dhoota.find((d) => d.id === ui.selectedDhoota);
  const onTile = selected ? tileById(state, selected.tileId) : undefined;
  const onUnclaimed = onTile && onTile.ownerId === null;

  return (
    <PanelShell title="Move Dhoota" onClose={close}>
      <div className="flex flex-col gap-2">
        {me.dhoota.map((d, i) => {
          const tile = tileById(state, d.tileId);
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => setUi((u) => ({ ...u, selectedDhoota: u.selectedDhoota === d.id ? null : d.id }))}
              className={`panel flex items-center gap-2 p-3 text-left ${
                ui.selectedDhoota === d.id ? "border-accent" : ""
              }`}
            >
              <DhootaIcon className="h-5 w-5 text-ink-dim" />
              <span className="text-sm">
                Dhoota {i + 1} · on {tile ? tile.element : "—"}
                {d.tileId === d.homeTileId ? " (home)" : ""}
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-sm text-ink-dim">
        {selected
          ? "Click a glowing adjacent tile on the board to move one hex (1 Air each; entering an occupied opponent tile also pays 1 matching resource as tribute)."
          : "Select a Dhoota, then move it hex by hex on the board."}
      </p>

      {selected && onUnclaimed && (
        <button
          type="button"
          className="btn btn-accent mt-3"
          onClick={() => act("establishWithDhoota", selected.id)}
        >
          Establish a House here
        </button>
      )}
    </PanelShell>
  );
}
