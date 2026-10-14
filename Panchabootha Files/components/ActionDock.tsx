"use client";

import type { GameApi } from "@/hooks/useGame";
import type { UiState } from "@/lib/types";
import { playerTiles } from "@/lib/engine.js";

export function ActionDock({ api }: { api: GameApi }) {
  const { state, viewerId, ui, setUi, act } = api;
  const isMyTurn = viewerId === state.activePlayerId;
  const me = state.players[viewerId];
  const myTiles = playerTiles(state, viewerId);
  const hasFort = myTiles.some((t) => t.establishmentType === "Fort");
  const hasTemple = myTiles.some((t) => t.establishmentType === "Temple");

  const openPanel = (panel: UiState["panel"]) =>
    setUi((u) => ({ ...u, panel: u.panel === panel ? null : panel }));

  if (state.phase === "setup") {
    return (
      <div className="border-t border-line px-5 py-3 text-sm text-ink-dim">
        Setup in progress — place your starting Houses on the board.
      </div>
    );
  }

  if (state.phase === "alignmentDecision") {
    const dec = state.pending?.decisions[0];
    const mine = dec && (!api.online || dec.playerId === viewerId);
    return (
      <div className="flex items-center gap-3 border-t border-line px-5 py-3">
        <span className="text-sm text-ink-dim">
          {mine
            ? `Asura + ${state.pending?.element}: pay 1 ${state.pending?.element}, or click a matching Jeeva tile to lose one.`
            : `Waiting for ${state.players[dec?.playerId ?? 0].name} to resolve Asura + ${state.pending?.element}.`}
        </span>
        {mine && (
          <button
            type="button"
            className="btn btn-accent ml-auto"
            onClick={() => act("resolveAsuraDecision", dec!.playerId, { kind: "pay" })}
          >
            Pay 1 {state.pending?.element}
          </button>
        )}
      </div>
    );
  }

  if (state.phase === "roll") {
    return (
      <div className="border-t border-line px-5 py-3 text-sm text-ink-dim">
        {isMyTurn ? "Roll the elemental dice to start your turn." : `Waiting for ${state.players[state.activePlayerId].name} to roll.`}
      </div>
    );
  }

  if (state.phase === "sangrama") {
    return (
      <div className="flex items-center gap-2 border-t border-line px-5 py-3">
        <button type="button" className="btn" onClick={() => openPanel("cards")}>
          Attack with Astra
        </button>
        <span className="text-sm text-ink-dim">
          Any player may play one opposing-alignment Astra while the battle is open.
        </span>
        {isMyTurn && (
          <button type="button" className="btn btn-accent ml-auto" onClick={() => act("endSangrama")}>
            End Sangrama
          </button>
        )}
      </div>
    );
  }

  const canAct = isMyTurn && (state.phase === "trade" || state.phase === "action");
  const inAction = state.phase === "action";

  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-line px-5 py-3">
      <DockBtn label="Trade" active={ui.panel === "trade"} disabled={!canAct} onClick={() => openPanel("trade")} />
      <DockBtn label="Build" active={ui.panel === "build"} disabled={!canAct || !inAction} onClick={() => openPanel("build")} />
      <DockBtn
        label="Create Jeeva"
        disabled={!canAct || !inAction}
        onClick={() => setUi((u) => ({ ...u, panel: "build" }))}
      />
      <DockBtn
        label="Move Dhoota"
        active={ui.panel === "dhoota"}
        disabled={!canAct || !inAction}
        onClick={() => openPanel("dhoota")}
      />
      <DockBtn
        label={hasFort ? "Astra" : "Astra · needs Fort"}
        active={ui.panel === "cards"}
        disabled={!canAct || !inAction || (!hasFort && me.astraHand.length === 0)}
        onClick={() => openPanel("cards")}
      />
      <DockBtn
        label={hasTemple || me.mantraHand.length ? "Mantra" : "Mantra · needs Temple"}
        disabled={!canAct || !inAction || (!hasTemple && me.mantraHand.length === 0)}
        onClick={() => setUi((u) => ({ ...u, panel: "cards" }))}
      />
      <button
        type="button"
        className="btn btn-accent ml-auto"
        disabled={!canAct}
        onClick={() => act("advancePhase")}
      >
        {inAction ? "End turn" : "Go to Actions"}
      </button>
    </div>
  );
}

function DockBtn({
  label,
  active,
  disabled,
  onClick
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`btn ${active ? "border-accent text-accent" : ""}`}
    >
      {label}
    </button>
  );
}
