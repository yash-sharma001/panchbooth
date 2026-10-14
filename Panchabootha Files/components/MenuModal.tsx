"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { GameApi } from "@/hooks/useGame";
import { Modal } from "./Modal";

export function MenuModal({ api, onClose }: { api: GameApi; onClose: () => void }) {
  const router = useRouter();
  const [players, setPlayers] = useState(String(api.state.playerCount));
  const [seed, setSeed] = useState(api.state.seed);
  const [busy, setBusy] = useState(false);

  async function createOnline() {
    setBusy(true);
    try {
      const res = await fetch("/api/room", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ playerCount: Number(players), seed })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create room.");
      router.push(`/?room=${data.code}`);
    } catch (e) {
      api.pushToast((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <Modal title="Game menu" onClose={onClose}>
      {api.online ? (
        <p className="text-ink-dim">
          You&rsquo;re in an online room. Open the base URL in a new tab to start or join another game.
        </p>
      ) : (
        <>
          <div className="flex gap-2">
            <label className="flex-1 text-xs text-ink-dim">
              Players
              <select
                value={players}
                onChange={(e) => setPlayers(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-line bg-panel-2 px-2 py-1.5 text-sm"
              >
                <option>2</option>
                <option>3</option>
                <option>4</option>
              </select>
            </label>
            <label className="flex-1 text-xs text-ink-dim">
              Seed
              <input
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-line bg-panel-2 px-2 py-1.5 text-sm"
              />
            </label>
          </div>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              className="btn btn-accent flex-1"
              onClick={() => {
                api.newGame(Number(players), seed);
                onClose();
              }}
            >
              New hot-seat game
            </button>
            <button type="button" className="btn flex-1" disabled={busy} onClick={createOnline}>
              Create online game
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
