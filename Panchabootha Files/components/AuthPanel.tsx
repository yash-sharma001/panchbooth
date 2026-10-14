"use client";

import { useState } from "react";
import type { SessionUser } from "@/lib/session";
import { AlignIcon } from "./icons";

type Mode = "login" | "register" | "guest";

export function AuthPanel({
  onAuthed,
  pendingRoom
}: {
  onAuthed: (user: SessionUser) => void;
  pendingRoom: string | null;
}) {
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const path =
      mode === "login" ? "/api/auth/login" : mode === "register" ? "/api/auth/register" : "/api/auth/guest";
    const body = mode === "guest" ? { name } : { name, password };
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      onAuthed(data.user as SessionUser);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2">
          <AlignIcon alignment="Deva" className="h-6 w-6 text-accent" />
          <h1 className="text-xl font-semibold">Panchabhoota</h1>
        </div>

        <div className="panel p-5">
          <div className="mb-4 flex gap-1 text-sm">
            {(["login", "register", "guest"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setError(null);
                }}
                className={`flex-1 rounded-lg px-2 py-1.5 ${
                  mode === m ? "bg-accent/20 text-accent" : "text-ink-dim hover:bg-panel-2"
                }`}
              >
                {m === "login" ? "Sign in" : m === "register" ? "Register" : "Guest"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-3">
            <label className="block text-xs text-ink-dim">
              {mode === "guest" ? "Display name" : "Username"}
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                placeholder={mode === "guest" ? "Guest" : "2–20 chars"}
                className="mt-1 block w-full rounded-lg border border-line bg-panel-2 px-3 py-2 text-sm"
              />
            </label>

            {mode !== "guest" && (
              <label className="block text-xs text-ink-dim">
                Password
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "register" ? "at least 6 chars" : ""}
                  className="mt-1 block w-full rounded-lg border border-line bg-panel-2 px-3 py-2 text-sm"
                />
              </label>
            )}

            {error && <p className="text-xs text-asura">{error}</p>}

            <button type="submit" className="btn btn-accent w-full" disabled={busy}>
              {mode === "login" ? "Sign in" : mode === "register" ? "Create account" : "Continue as guest"}
            </button>
          </form>
        </div>

        <p className="mt-3 text-center text-xs text-ink-faint">
          {pendingRoom
            ? `You'll join room ${pendingRoom} after signing in.`
            : "Accounts are stored on this server. Guests are not saved."}
        </p>
      </div>
    </div>
  );
}
