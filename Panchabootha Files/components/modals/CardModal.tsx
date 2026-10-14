"use client";

import { useMemo, useState } from "react";
import type { GameApi } from "@/hooks/useGame";
import type { Card, Element } from "@/lib/types";
import { ELEMENTS, GAME_CONFIG } from "@/lib/config.js";
import { playerTiles } from "@/lib/engine.js";
import { areAdjacent, tileById } from "@/lib/game-helpers";
import { describeCard } from "@/lib/cards";
import { Modal } from "../Modal";

const els = ELEMENTS as Element[];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs text-ink-dim">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Select({
  value,
  onChange,
  options
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="block w-full rounded-lg border border-line bg-panel-2 px-2 py-1.5 text-sm"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

const RESPONSE_ONLY = new Set(["Raksha", "Maha-Raksha"]);

export function CardModal({ api, card, onClose }: { api: GameApi; card: Card; onClose: () => void }) {
  const { state, viewerId, act } = api;
  const me = state.players[viewerId];
  const isAstra = card.kind === "astra";
  const isResponse = RESPONSE_ONLY.has(card.name);

  const opponents = useMemo(
    () => state.players.filter((p) => p.alignment !== me.alignment),
    [state.players, me.alignment]
  );
  const [targetId, setTargetId] = useState<number>(opponents[0]?.id ?? -1);
  const target = state.players.find((p) => p.id === targetId);

  const [f, setF] = useState<Record<string, string>>({});
  const set = (k: string, v: string) => setF((prev) => ({ ...prev, [k]: v }));
  const val = (k: string, fallback = "") => f[k] ?? fallback;

  function buildMantraArgs(): Record<string, unknown> {
    switch (card.name) {
      case "Dhanavrishti":
        return { resources: [val("r1", "Earth"), val("r2", "Water")] };
      case "Sampatti":
        return { element: val("element", "Water") };
      case "Bhiksha":
        return { resource: val("resource", "Earth") };
      case "Parivartana":
        return { returnResource: val("returnResource", "Earth"), gainElement: val("gainElement", "Water") };
      case "Jeeva-Srishti":
      case "Nirman":
        return { tileId: val("tileId") };
      case "Vayu-Siddhi":
        return { dhootaId: val("dhootaId", me.dhoota[0]?.id ?? ""), path: [val("h1"), val("h2")] };
      default:
        return {};
    }
  }

  function submit() {
    if (isAstra) {
      const a: Record<string, unknown> = { attackerId: viewerId, targetPlayerId: targetId, cardId: card.id };
      for (const k of ["targetTileId", "targetDhootaId", "destinationTileId", "resourceElement"]) {
        if (f[k]) a[k] = f[k];
      }
      act("playAstra", a);
    } else {
      act("playMantra", card.id, buildMantraArgs());
    }
    onClose();
  }

  return (
    <Modal
      title={`${isAstra ? "Attack with" : "Play"} ${card.name}`}
      onClose={onClose}
      onSubmit={isResponse ? undefined : submit}
      submitLabel={isAstra ? (card.super ? "Unleash" : "Attack") : "Cast"}
    >
      <p className="border-l-2 border-accent/50 pl-2 text-ink-dim">{describeCard(card.name)}</p>

      {isResponse ? (
        <p className="text-ink-dim">Played only in response to an Astra aimed at you.</p>
      ) : isAstra ? (
        !target ? (
          <p className="text-asura">No opposing-alignment player to target.</p>
        ) : (
          <>
            <Field label="Target player">
              <Select
                value={String(targetId)}
                onChange={(v) => setTargetId(Number(v))}
                options={opponents.map((p) => ({ value: String(p.id), label: `${p.name} (${p.alignment})` }))}
              />
            </Field>
            <AstraFields card={card} tiles={playerTiles(state, target.id)} dhoota={target.dhoota} val={val} set={set} />
          </>
        )
      ) : (
        <MantraFields card={card} api={api} val={val} set={set} />
      )}
    </Modal>
  );
}

function MantraFields({
  card,
  api,
  val,
  set
}: {
  card: Card;
  api: GameApi;
  val: (k: string, f?: string) => string;
  set: (k: string, v: string) => void;
}) {
  const { state, viewerId } = api;
  const me = state.players[viewerId];
  const owned = els.filter((e) => me.resources[e] > 0);
  const tiles = playerTiles(state, viewerId);
  const elOpts = els.map((e) => ({ value: e, label: e }));

  switch (card.name) {
    case "Dhanavrishti":
      return (
        <>
          <Field label="First resource">
            <Select value={val("r1", "Earth")} onChange={(v) => set("r1", v)} options={elOpts} />
          </Field>
          <Field label="Second resource">
            <Select value={val("r2", "Water")} onChange={(v) => set("r2", v)} options={elOpts} />
          </Field>
        </>
      );
    case "Sampatti":
      return (
        <Field label="Element to collect from everyone">
          <Select value={val("element", "Water")} onChange={(v) => set("element", v)} options={elOpts} />
        </Field>
      );
    case "Bhiksha":
      return (
        <Field label="Resource to gain">
          <Select value={val("resource", "Earth")} onChange={(v) => set("resource", v)} options={elOpts} />
        </Field>
      );
    case "Parivartana":
      return (
        <>
          <Field label="Return one">
            <Select
              value={val("returnResource", owned[0] ?? "Earth")}
              onChange={(v) => set("returnResource", v)}
              options={(owned.length ? owned : els).map((e) => ({ value: e, label: `${e} (${me.resources[e]})` }))}
            />
          </Field>
          <Field label="Gain two of">
            <Select value={val("gainElement", "Water")} onChange={(v) => set("gainElement", v)} options={elOpts} />
          </Field>
        </>
      );
    case "Jeeva-Srishti": {
      const eligible = tiles.filter((t) => t.establishmentType && t.jeeva < GAME_CONFIG.maxJeevaPerEstablishment);
      return (
        <Field label="Establishment">
          <Select
            value={val("tileId", eligible[0]?.id ?? "")}
            onChange={(v) => set("tileId", v)}
            options={eligible.map((t) => ({ value: t.id, label: `${t.element} ${t.establishmentType} J${t.jeeva}` }))}
          />
        </Field>
      );
    }
    case "Nirman": {
      const eligible = tiles.filter((t) => !t.establishmentType && t.jeeva >= 1);
      return (
        <Field label="Tile">
          <Select
            value={val("tileId", eligible[0]?.id ?? "")}
            onChange={(v) => set("tileId", v)}
            options={eligible.map((t) => ({ value: t.id, label: `${t.element} J${t.jeeva}` }))}
          />
        </Field>
      );
    }
    case "Vayu-Siddhi": {
      const dId = val("dhootaId", me.dhoota[0]?.id ?? "");
      const d = me.dhoota.find((x) => x.id === dId);
      const from = d ? tileById(state, d.tileId) : undefined;
      const s1opts = from ? state.tiles.filter((t) => areAdjacent(from, t)) : [];
      const s1 = val("h1", s1opts[0]?.id ?? "");
      const mid = tileById(state, s1);
      const s2opts = mid ? state.tiles.filter((t) => areAdjacent(mid, t) && t.id !== from?.id) : [];
      return (
        <>
          <Field label="Dhoota">
            <Select
              value={dId}
              onChange={(v) => set("dhootaId", v)}
              options={me.dhoota.map((x, i) => ({ value: x.id, label: `Dhoota ${i + 1}` }))}
            />
          </Field>
          <Field label="First hex">
            <Select value={s1} onChange={(v) => set("h1", v)} options={s1opts.map((t) => ({ value: t.id, label: t.element }))} />
          </Field>
          <Field label="Second hex">
            <Select
              value={val("h2", s2opts[0]?.id ?? "")}
              onChange={(v) => set("h2", v)}
              options={s2opts.map((t) => ({ value: t.id, label: t.element }))}
            />
          </Field>
        </>
      );
    }
    default:
      return <p className="text-ink-faint">No inputs required.</p>;
  }
}

function AstraFields({
  card,
  tiles,
  dhoota,
  val,
  set
}: {
  card: Card;
  tiles: { id: string; element: string; establishmentType: string | null; jeeva: number }[];
  dhoota: { id: string }[];
  val: (k: string, f?: string) => string;
  set: (k: string, v: string) => void;
}) {
  const pick = (
    pred: (t: (typeof tiles)[number]) => boolean,
    label: string,
    key: string
  ) => {
    const opts = tiles.filter(pred);
    return (
      <Field label={label}>
        <Select
          value={val(key, opts[0]?.id ?? "")}
          onChange={(v) => set(key, v)}
          options={
            opts.length
              ? opts.map((t) => ({ value: t.id, label: `${t.element} ${t.establishmentType} J${t.jeeva}` }))
              : [{ value: "", label: "No eligible target" }]
          }
        />
      </Field>
    );
  };

  switch (card.name) {
    case "Agneyastra":
      return pick((t) => !!t.establishmentType && t.jeeva > 0, "Target establishment", "targetTileId");
    case "Varunastra":
      return pick((t) => t.establishmentType === "House", "Target House", "targetTileId");
    case "Brahmastra":
      return pick((t) => t.establishmentType === "City", "Target City", "targetTileId");
    case "Pashupatastra":
      return pick((t) => t.establishmentType === "Fort", "Target Fort", "targetTileId");
    case "Narayanastra":
      return pick((t) => t.establishmentType === "Temple", "Target Temple", "targetTileId");
    case "Vayavyastra":
      return (
        <Field label="Target Dhoota">
          <Select
            value={val("targetDhootaId", dhoota[0]?.id ?? "")}
            onChange={(v) => set("targetDhootaId", v)}
            options={
              dhoota.length
                ? dhoota.map((d, i) => ({ value: d.id, label: `Dhoota ${i + 1}` }))
                : [{ value: "", label: "No Dhoota" }]
            }
          />
        </Field>
      );
    case "Indrastra":
      return (
        <Field label="Resource they return">
          <Select
            value={val("resourceElement", "Earth")}
            onChange={(v) => set("resourceElement", v)}
            options={els.map((e) => ({ value: e, label: e }))}
          />
        </Field>
      );
    case "Parvathastra":
      return (
        <>
          {pick((t) => !!t.establishmentType && t.jeeva > 0, "Move a Jeeva from", "targetTileId")}
          <Field label="Move it to (optional)">
            <Select
              value={val("destinationTileId", "")}
              onChange={(v) => set("destinationTileId", v)}
              options={[
                { value: "", label: "— remove instead —" },
                ...tiles
                  .filter((t) => !!t.establishmentType)
                  .map((t) => ({ value: t.id, label: `${t.element} ${t.establishmentType} J${t.jeeva}` }))
              ]}
            />
          </Field>
        </>
      );
    default:
      return null;
  }
}
