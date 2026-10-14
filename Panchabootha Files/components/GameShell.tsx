"use client";

import type { SessionUser } from "@/lib/session";
import { useGame } from "@/hooks/useGame";
import { TopBar } from "./TopBar";
import { OnlineBar } from "./OnlineBar";
import { PlayerRail } from "./PlayerRail";
import { Board } from "./Board";
import { InfoRail } from "./InfoRail";
import { ResourceBar } from "./ResourceBar";
import { ActionDock } from "./ActionDock";
import { SetupScreen } from "./SetupScreen";
import { Scoreboard } from "./Scoreboard";
import { MenuModal } from "./MenuModal";
import { ToastView } from "./Toast";
import { TradePanel } from "./panels/TradePanel";
import { BuildPanel } from "./panels/BuildPanel";
import { DhootaPanel } from "./panels/DhootaPanel";
import { CardsPanel } from "./panels/CardsPanel";

export function GameShell({
  user,
  onSignOut
}: {
  user?: SessionUser;
  onSignOut: () => void;
}) {
  const api = useGame();
  const { state, ui, setUi } = api;

  if (api.joinError) {
    return (
      <div className="grid h-screen place-items-center p-6">
        <div className="text-center">
          <p className="text-asura">{api.joinError}</p>
          <p className="mt-1 text-sm text-ink-dim">
            The room may have ended, or the code is wrong. Create or join another from the lobby.
          </p>
          <a href="/" className="btn btn-accent mt-4 inline-flex">
            Back to lobby
          </a>
        </div>
      </div>
    );
  }

  if (!api.ready) {
    return <div className="grid h-screen place-items-center text-ink-dim">Joining room&hellip;</div>;
  }

  if (state.phase === "setup") {
    return (
      <>
        <SetupScreen api={api} />
        <ToastView toast={api.toast} onDismiss={api.dismissToast} />
      </>
    );
  }

  if (state.phase === "gameover") {
    return (
      <>
        <Scoreboard api={api} />
        <ToastView toast={api.toast} onDismiss={api.dismissToast} />
      </>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <TopBar api={api} onMenu={() => setUi((u) => ({ ...u, showMenu: true }))} />
      <OnlineBar api={api} onSignOut={onSignOut} />

      <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[260px_minmax(0,1fr)_300px]">
        <div className="hidden border-r border-line lg:block">
          <PlayerRail api={api} />
        </div>

        <div className="relative overflow-hidden">
          <Board api={api} />
          {ui.panel === "trade" && <TradePanel api={api} />}
          {ui.panel === "build" && <BuildPanel api={api} />}
          {ui.panel === "dhoota" && <DhootaPanel api={api} />}
          {ui.panel === "cards" && <CardsPanel api={api} />}
        </div>

        <div className="hidden border-l border-line lg:block">
          <InfoRail api={api} />
        </div>
      </div>

      <ResourceBar api={api} />
      <ActionDock api={api} />

      {ui.showMenu && <MenuModal api={api} onClose={() => setUi((u) => ({ ...u, showMenu: false }))} />}
      <ToastView toast={api.toast} onDismiss={api.dismissToast} />
    </div>
  );
}
