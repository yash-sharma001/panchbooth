"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import type { SessionUser } from "@/lib/session";
import { AuthPanel } from "./AuthPanel";
import { Lobby } from "./Lobby";
import { GameShell } from "./GameShell";

export function AppShell({ initialUser }: { initialUser: SessionUser | null }) {
  const [user, setUser] = useState<SessionUser | null>(initialUser);
  const params = useSearchParams();
  const room = params.get("room");
  const local = params.get("local");

  if (local) {
    // hot-seat on this device — no account needed
    return <GameShell onSignOut={() => (window.location.href = "/")} />;
  }

  if (!user) {
    return <AuthPanel onAuthed={setUser} pendingRoom={room} />;
  }

  if (room) {
    return <GameShell user={user} onSignOut={() => setUser(null)} />;
  }

  return <Lobby user={user} onSignOut={() => setUser(null)} />;
}
