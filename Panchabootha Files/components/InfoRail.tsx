"use client";

import type { GameApi } from "@/hooks/useGame";
import type { Element } from "@/lib/types";
import { GAME_CONFIG, ELEMENTS } from "@/lib/config.js";
import { isActive as tileActive } from "@/lib/engine.js";
import { elementCountLabel } from "@/lib/game-helpers";
import { ElementIcon, AlignIcon, SEAT_TEXT } from "./icons";

function alignmentEffect(api: GameApi): string {
  const roll = api.state.lastRoll;
  if (!roll) return "";
  switch (roll.type) {
    case "devaElement":
      return `Deva boon · +1 ${roll.element} to Deva players holding ${roll.element}`;
    case "asuraElement":
      return `Asura strike · Deva players on ${roll.element} pay 1 or lose a Jeeva`;
    case "devaAsura":
      return "Devasura Sangrama · hands over 7 discard half";
    default:
      return "no alignment effect";
  }
}

function productionFor(api: GameApi, playerId: number) {
  const counts = api.state.lastRoll?.elementCounts;
  if (!counts) return [] as { element: Element; amount: number }[];
  const gained: Partial<Record<Element, number>> = {};
  for (const t of api.state.tiles) {
    if (t.ownerId !== playerId || !t.establishmentType) continue;
    const n = counts[t.element] || 0;
    if (!n || !tileActive(t, GAME_CONFIG)) continue;
    gained[t.element] =
      (gained[t.element] || 0) + n * GAME_CONFIG.establishments[t.establishmentType].productionMultiplier;
  }
  return (Object.entries(gained) as [Element, number][]).map(([element, amount]) => ({ element, amount }));
}

export function InfoRail({ api }: { api: GameApi }) {
  const { state, viewerId } = api;
  const roll = state.lastRoll;
  const isMyTurn = viewerId === state.activePlayerId;
  const dhoota = state.players[viewerId].dhoota;
  const enRoute = dhoota.filter((d) => d.tileId !== d.homeTileId).length;

  return (
    <div className="flex flex-col gap-3 overflow-y-auto p-3">
      <div className="panel p-3">
        <div className="flex justify-center gap-3">
          <Die face={roll?.deva ?? "Deva"} side="deva" />
          <Die face={roll?.asura ?? "Asura"} side="asura" />
        </div>
        {roll ? (
          <>
            <p className="mt-2 text-center text-sm font-semibold">
              {elementCountLabel(roll.elementCounts) || `${roll.deva} + ${roll.asura}`}
            </p>
            <p className="mt-0.5 text-center text-xs text-ink-dim">{alignmentEffect(api)}</p>
          </>
        ) : (
          <p className="mt-2 text-center text-xs text-ink-dim">Roll to begin the turn.</p>
        )}
        {state.phase === "roll" && (
          <button
            type="button"
            disabled={!isMyTurn}
            onClick={() => api.act("rollDice")}
            className="btn btn-accent mt-3 w-full"
          >
            Roll elemental dice
          </button>
        )}
      </div>

      {roll && (
        <div className="panel p-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Production</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {state.players.map((p) => {
              const gains = productionFor(api, p.id);
              return (
                <li key={p.id} className="flex items-center justify-between">
                  <span className={SEAT_TEXT[p.id]}>{p.name}</span>
                  <span className="flex items-center gap-1.5 text-ink-dim">
                    {gains.length === 0
                      ? "—"
                      : gains.map((g) => (
                          <span key={g.element} className="flex items-center gap-0.5">
                            +{g.amount}
                            <ElementIcon element={g.element} className="h-3 w-3" />
                          </span>
                        ))}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="panel p-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Dhoota</h3>
        <p className="mt-1 text-sm text-ink-dim">
          {enRoute} en route &middot; {dhoota.length - enRoute} home
        </p>
      </div>

      {roll?.type === "devaAsura" && state.sangrama && (
        <div className="panel border-asura/40 p-3">
          <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-asura">
            <AlignIcon alignment="Asura" className="h-3.5 w-3.5" /> Devasura Sangrama
          </h3>
          <p className="mt-1 text-xs text-ink-dim">
            Attacked: {state.sangrama.attackUsedBy.map((id) => state.players[id].name).join(", ") || "none"}
          </p>
        </div>
      )}
    </div>
  );
}

function Die({ face, side }: { face: string; side: "deva" | "asura" }) {
  const isElement = (ELEMENTS as string[]).includes(face);
  return (
    <div
      className="grid h-16 w-16 place-items-center rounded-xl border-2"
      style={
        side === "deva"
          ? { background: "#f3ecd9", borderColor: "var(--accent)", color: "#7a5f28" }
          : { background: "#15130f", borderColor: "var(--asura)", color: "var(--asura)" }
      }
    >
      {isElement ? (
        <ElementIcon element={face as Element} className="h-8 w-8" />
      ) : (
        <AlignIcon alignment={face as "Deva" | "Asura"} className="h-8 w-8" />
      )}
    </div>
  );
}
