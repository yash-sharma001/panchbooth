"use client";

import { useState } from "react";
import type { GameApi } from "@/hooks/useGame";
import type { Card } from "@/lib/types";
import { GAME_CONFIG } from "@/lib/config.js";
import { playerTiles } from "@/lib/engine.js";
import { canAfford } from "@/lib/game-helpers";
import { describeCard } from "@/lib/cards";
import { PanelShell } from "./PanelShell";
import { CardModal } from "../modals/CardModal";

export function CardsPanel({ api }: { api: GameApi }) {
  const { state, viewerId, act, setUi } = api;
  const me = state.players[viewerId];
  const myTiles = playerTiles(state, viewerId);
  const hasFort = myTiles.some((t) => t.establishmentType === "Fort");
  const hasTemple = myTiles.some((t) => t.establishmentType === "Temple");
  const [playing, setPlaying] = useState<Card | null>(null);

  const close = () => setUi((u) => ({ ...u, panel: null }));
  const inSangrama = state.phase === "sangrama";
  const inAction = state.phase === "action";

  const hand: Card[] = [
    ...me.astraHand.map((c) => ({ ...c, kind: "astra" as const })),
    ...me.mantraHand.map((c) => ({ ...c, kind: "mantra" as const }))
  ];

  return (
    <PanelShell title="Cards" onClose={close}>
      <div className="grid gap-3 sm:grid-cols-2">
        <BuyBox
          title="Astra"
          note={hasFort ? "Unlocked by your Fort" : "Requires a Fort"}
          cost={GAME_CONFIG.costs.Astra}
          left={state.astraDeck.length}
          disabled={!inAction || !hasFort || !canAfford(me.resources, GAME_CONFIG.costs.Astra)}
          onBuy={() => act("purchaseAstra")}
        />
        <BuyBox
          title="Mantra"
          note={hasTemple ? "Unlocked by your Temple" : "Requires a Temple"}
          cost={GAME_CONFIG.costs.Mantra}
          left={state.mantraDeck.length}
          disabled={!inAction || !hasTemple}
          onBuy={() => act("purchaseMantra")}
        />
      </div>

      <h3 className="mt-5 text-xs font-semibold uppercase tracking-wide text-ink-faint">Your hand</h3>
      {hand.length === 0 && <p className="mt-2 text-sm text-ink-dim">No cards yet.</p>}
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {hand.map((card) => {
          const isNew = card.purchasedTurn === state.turnNumber;
          const playable = card.kind === "astra" ? inSangrama : inAction;
          return (
            <div key={card.id} className={`panel p-3 ${card.super ? "border-accent" : ""}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{card.name}</span>
                <span className="text-[10px] uppercase text-ink-faint">
                  {card.kind}
                  {isNew ? " · new" : ""}
                </span>
              </div>
              <p className="mt-1 text-xs text-ink-dim">{describeCard(card.name)}</p>
              <button
                type="button"
                className="btn mt-2 w-full"
                disabled={isNew || !playable}
                onClick={() => setPlaying(card)}
              >
                {card.kind === "astra" && inSangrama ? "Attack" : "Play"}
              </button>
            </div>
          );
        })}
      </div>

      {playing && <CardModal api={api} card={playing} onClose={() => setPlaying(null)} />}
    </PanelShell>
  );
}

function BuyBox({
  title,
  note,
  cost,
  left,
  disabled,
  onBuy
}: {
  title: string;
  note: string;
  cost: Record<string, number>;
  left: number;
  disabled: boolean;
  onBuy: () => void;
}) {
  const costStr = Object.entries(cost)
    .map(([el, n]) => `${n} ${el}`)
    .join(" + ");
  return (
    <section className="panel p-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="text-xs text-ink-faint">{left} left</span>
      </div>
      <p className="mt-0.5 text-xs text-ink-dim">{note}</p>
      <p className="mt-2 text-xs text-ink-dim">Cost: {costStr || "—"}</p>
      <button type="button" className="btn mt-2 w-full" disabled={disabled} onClick={onBuy}>
        Draw {title} · usable next turn
      </button>
    </section>
  );
}
