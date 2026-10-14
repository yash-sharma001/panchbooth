"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SessionUser } from "@/lib/session";
import { AlignIcon } from "./icons";

export function Lobby({ user, onSignOut }: { user: SessionUser; onSignOut: () => void }) {
  const router = useRouter();
  const [players, setPlayers] = useState("4");
  const [seed, setSeed] = useState("panchabhoota");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function createGame() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/room", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ playerCount: Number(players), seed })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create game.");
      router.push(`/?room=${data.code}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  function joinGame(e: React.FormEvent) {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 4) {
      setError("Room codes are 4 characters.");
      return;
    }
    router.push(`/?room=${code}`);
  }

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    onSignOut();
  }

  return (
    <div className="grid min-h-screen place-items-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlignIcon alignment="Deva" className="h-6 w-6 text-accent" />
            <h1 className="text-xl font-semibold">Panchabhoota</h1>
          </div>
          <span className="text-sm text-ink-dim">
            {user.name}
            {user.guest && <span className="text-ink-faint"> (guest)</span>}
            <button type="button" onClick={signOut} className="ml-3 text-accent hover:underline">
              Sign out
            </button>
          </span>
        </div>

        <section className="panel p-5">
          <h2 className="text-sm font-semibold">Create a game</h2>
          <div className="mt-3 flex gap-2">
            <label className="flex-1 text-xs text-ink-dim">
              Players
              <select
                value={players}
                onChange={(e) => setPlayers(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-line bg-panel-2 px-2 py-2 text-sm"
              >
                <option>2</option>
                <option>3</option>
                <option>4</option>
              </select>
            </label>
            <label className="flex-[2] text-xs text-ink-dim">
              Seed
              <input
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-line bg-panel-2 px-3 py-2 text-sm"
              />
            </label>
          </div>
          <button type="button" className="btn btn-accent mt-3 w-full" disabled={busy} onClick={createGame}>
            Create game
          </button>
        </section>

        <section className="panel mt-4 p-5">
          <h2 className="text-sm font-semibold">Join a game</h2>
          <form onSubmit={joinGame} className="mt-3 flex gap-2">
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={4}
              placeholder="ROOM CODE"
              className="flex-1 rounded-lg border border-line bg-panel-2 px-3 py-2 text-sm tracking-widest"
            />
            <button type="submit" className="btn">
              Join
            </button>
          </form>
        </section>

        {error && <p className="mt-3 text-center text-xs text-asura">{error}</p>}

        <p className="mt-4 text-center text-xs text-ink-faint">
          <a href="/?local=1" className="hover:underline">
            Or play hot-seat on this device
          </a>
        </p>
      </div>
    </div>
  );
}
