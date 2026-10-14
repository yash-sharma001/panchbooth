"use client";

import { useState } from "react";
import type { GameApi } from "@/hooks/useGame";

export function OnlineBar({ api }: { api: GameApi; onSignOut?: () => void }) {
  const [copied, setCopied] = useState(false);
  if (!api.online) return null;
  const { code, playerId } = api.online;
  const seat = api.state.players[playerId];
  const link = typeof window !== "undefined" ? `${window.location.origin}/?room=${code}` : "";

  return (
    <div className="flex flex-wrap items-center gap-4 border-b border-line bg-panel-2 px-5 py-2 text-xs">
      <span>
        Room <strong className="text-accent">{code}</strong>
      </span>
      <span className="text-ink-dim">
        You are <strong className="text-ink">{seat?.name ?? `Seat ${playerId + 1}`}</strong>
        {seat && ` (${seat.alignment})`}
      </span>
      <span className="ml-auto flex items-center gap-2">
        <button
          type="button"
          className="btn !py-1 !text-xs"
          onClick={() => {
            navigator.clipboard?.writeText(link).then(
              () => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              },
              () => api.pushToast("Copy failed — select the link manually.")
            );
          }}
        >
          {copied ? "Copied" : "Copy invite link"}
        </button>
        <button
          type="button"
          className="btn !py-1 !text-xs"
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            window.location.href = "/";
          }}
        >
          Sign out
        </button>
      </span>
    </div>
  );
}
