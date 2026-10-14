"use client";

import { useState } from "react";
import type { GameApi } from "@/hooks/useGame";
import type { Element } from "@/lib/types";
import { ELEMENTS, GAME_CONFIG } from "@/lib/config.js";
import { resourceTotal } from "@/lib/engine.js";
import { PanelShell } from "./PanelShell";
import { ElementIcon, ELEMENT_CLASS } from "../icons";

const els = ELEMENTS as Element[];

function ElSelect({ value, onChange }: { value: Element; onChange: (e: Element) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Element)}
      className="rounded-lg border border-line bg-panel-2 px-2 py-1.5 text-sm"
    >
      {els.map((el) => (
        <option key={el} value={el}>
          {el}
        </option>
      ))}
    </select>
  );
}

export function TradePanel({ api }: { api: GameApi }) {
  const { state, viewerId, act, setUi } = api;
  const me = state.players[viewerId];
  const close = () => setUi((u) => ({ ...u, panel: null }));

  const [bankGive, setBankGive] = useState<Element>("Fire");
  const [bankGain, setBankGain] = useState<Element>("Akasha");

  const partners = state.players.filter((p) => p.id !== viewerId);
  const [partnerId, setPartnerId] = useState<number>(partners[0]?.id ?? 0);
  const [giveEl, setGiveEl] = useState<Element>("Fire");
  const [giveQty, setGiveQty] = useState(1);
  const [getEl, setGetEl] = useState<Element>("Air");
  const [getQty, setGetQty] = useState(1);

  const rate = GAME_CONFIG.bankTradeRate;
  const total = resourceTotal(me);
  const bankOk = state.phase === "trade" || state.phase === "action";
  const playerOk = state.phase === "trade";

  return (
    <PanelShell title={state.phase === "action" ? "Trade (Actions phase)" : "Trade phase"} onClose={close}>
      {!playerOk && (
        <p className="mb-3 text-xs text-ink-dim">
          Player-to-player trades happen only in the Trade phase. Bank exchange is still available now.
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <section className="panel p-3">
          <h3 className="text-sm font-semibold">Bank exchange</h3>
          <p className="mt-0.5 text-xs text-ink-faint">Locked at {rate} : 1</p>
          <div className="mt-3 flex items-center gap-2 text-sm">
            <span>Give {rate}</span>
            <ElSelect value={bankGive} onChange={setBankGive} />
            <span className="text-ink-faint">&rarr;</span>
            <span>get 1</span>
            <ElSelect value={bankGain} onChange={setBankGain} />
          </div>
          <p className="mt-2 text-xs text-ink-dim">
            You hold {me.resources[bankGive]} {bankGive}.
          </p>
          <button
            type="button"
            className="btn mt-2"
            disabled={bankGive === bankGain || me.resources[bankGive] < rate || !bankOk}
            onClick={() => act("bankTrade", bankGive, bankGain)}
          >
            Exchange
          </button>
          {bankGive !== bankGain && me.resources[bankGive] < rate && (
            <p className="mt-1 text-xs text-asura">Need {rate} {bankGive}, you have {me.resources[bankGive]}.</p>
          )}
        </section>

        <section className="panel p-3">
          <h3 className="text-sm font-semibold">Player trade</h3>
          <label className="mt-2 block text-xs text-ink-dim">
            Trade with
            <select
              value={partnerId}
              onChange={(e) => setPartnerId(Number(e.target.value))}
              className="mt-1 block w-full rounded-lg border border-line bg-panel-2 px-2 py-1.5 text-sm"
            >
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-16 text-ink-dim">You give</span>
              <Stepper qty={giveQty} setQty={setGiveQty} />
              <ElSelect value={giveEl} onChange={setGiveEl} />
            </div>
            <div className="flex items-center gap-2">
              <span className="w-16 text-ink-dim">You get</span>
              <Stepper qty={getQty} setQty={setGetQty} />
              <ElSelect value={getEl} onChange={setGetEl} />
            </div>
          </div>
          <p className="mt-2 text-xs text-ink-dim">
            After this your hand is {total - giveQty + getQty} (threshold {GAME_CONFIG.handRiskThreshold}).
          </p>
          <button
            type="button"
            className="btn btn-accent mt-2"
            disabled={!playerOk || partners.length === 0 || me.resources[giveEl] < giveQty}
            onClick={() =>
              act("playerTrade", partnerId, { [giveEl]: giveQty }, { [getEl]: getQty })
            }
          >
            Complete trade
          </button>
          <p className="mt-2 text-xs text-ink-faint">
            {playerOk
              ? "The trade executes immediately; the partner's resources are debited."
              : "Only in the Trade phase."}
          </p>
        </section>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {els.map((el) => (
          <span key={el} className={`chip bg-panel-2 ${ELEMENT_CLASS[el]}`}>
            <ElementIcon element={el} className="h-3 w-3" />
            {el} {me.resources[el]}
          </span>
        ))}
      </div>
    </PanelShell>
  );
}

function Stepper({ qty, setQty }: { qty: number; setQty: (n: number) => void }) {
  return (
    <span className="flex items-center gap-1">
      <button type="button" className="btn h-7 w-7 !p-0" onClick={() => setQty(Math.max(1, qty - 1))}>
        &minus;
      </button>
      <span className="w-5 text-center">{qty}</span>
      <button type="button" className="btn h-7 w-7 !p-0" onClick={() => setQty(qty + 1)}>
        +
      </button>
    </span>
  );
}
