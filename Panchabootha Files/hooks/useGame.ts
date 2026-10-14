"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PanchabhootaEngine } from "@/lib/engine.js";
import type { GameState, Session, UiState } from "@/lib/types";

const SESSION_KEY = "panchabhoota.session";
const POLL_MS = 1500;

function writeSession(s: Session) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
  } catch {
    /* private mode — reconnect just won't survive a reload */
  }
}

export interface Toast {
  msg: string;
  kind: "error" | "info";
  id: number;
}

export function useGame() {
  const params = useSearchParams();
  const roomCode = params.get("room")?.toUpperCase() ?? null;

  const engineRef = useRef<PanchabhootaEngine>();
  if (!engineRef.current) engineRef.current = new PanchabhootaEngine();

  const [state, setState] = useState<GameState>(() => engineRef.current!.newGame({ playerCount: 4 }));
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const [online, setOnline] = useState<Session | null>(null);
  // Online: not ready until the server's first state arrives — never render the
  // local placeholder game as if it were the room. Local: ready immediately.
  const [ready, setReady] = useState<boolean>(!roomCode);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [ui, setUi] = useState<UiState>({ selectedDhoota: null, panel: null, showMenu: false });
  const pollRef = useRef<(() => Promise<void>) | null>(null);

  const pushToast = useCallback((msg: string, kind: "error" | "info" = "error") => {
    setToast({ msg, kind, id: Date.now() });
  }, []);

  // Online = join once, then poll /api/state. Polling survives any proxy/tunnel;
  // a turn-based game does not need sub-second push.
  useEffect(() => {
    if (!roomCode) return;
    let timer: ReturnType<typeof setInterval> | undefined;
    let cancelled = false;
    let session: Session | null = null;

    const poll = async () => {
      if (!session || cancelled) return;
      try {
        const r = await fetch(`/api/state?code=${session.code}&token=${session.token}`, { cache: "no-store" });
        if (r.ok && !cancelled) {
          setState((await r.json()) as GameState);
          setReady(true);
        }
      } catch {
        /* transient — keep polling */
      }
    };

    (async () => {
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: roomCode })
      });
      if (res.status === 401) {
        window.location.reload();
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (!cancelled) setJoinError(data.error || `Could not join room (${res.status}).`);
        return;
      }
      session = { code: roomCode, playerId: data.playerId, token: data.token };
      writeSession(session);
      if (cancelled) return;
      setOnline(session);
      pollRef.current = poll;
      await poll();
      timer = setInterval(poll, POLL_MS);
    })().catch((e) => {
      if (!cancelled) setJoinError((e as Error).message || "Could not reach the game server.");
    });

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      pollRef.current = null;
    };
  }, [roomCode]);

  const viewerId = online ? online.playerId : state.activePlayerId;

  const act = useCallback(
    async (method: string, ...args: unknown[]) => {
      if (online) {
        try {
          const res = await fetch(`/api/action?code=${online.code}&token=${online.token}`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ method, args })
          });
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            pushToast(data.error || `Action failed (${res.status})`);
          } else {
            // reflect our own move immediately instead of waiting for the next poll
            pollRef.current?.();
          }
        } catch (e) {
          pushToast((e as Error).message);
        }
        return;
      }
      try {
        const next = (engineRef.current as unknown as Record<string, (...a: unknown[]) => GameState>)[method](
          stateRef.current,
          ...args
        );
        setState(next);
      } catch (e) {
        pushToast((e as Error).message, "error");
      }
    },
    [online, pushToast]
  );

  const newGame = useCallback(
    (playerCount: number, seed: string) => {
      if (online) return;
      setState(engineRef.current!.newGame({ playerCount, seed: seed || "panchabhoota" }));
      setUi({ selectedDhoota: null, panel: null, showMenu: false });
    },
    [online]
  );

  return {
    state,
    viewerId,
    online,
    ready,
    joinError,
    act,
    newGame,
    toast,
    dismissToast: () => setToast(null),
    pushToast,
    ui,
    setUi
  };
}

export type GameApi = ReturnType<typeof useGame>;
