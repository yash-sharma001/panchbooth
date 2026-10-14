# Panchabhoota

A 2–4 player elemental territory game (Deva vs Asura), built on the
`Panchabhoota Codex Master Game Design Specification v1.0`.
Next.js App Router + React + Tailwind, with a deterministic rules engine
that stays plain JavaScript.

## Run

```bash
npm install
npm run dev          # http://localhost:3000
```

```bash
npm run build && npm start   # production
npm test                     # node --test — engine + room-server unit tests
npm run simulate             # batch simulation harness
```

## Play

Visiting the app shows a **sign-in screen**: register a username + password, sign in, or
continue as a guest (guests are not saved). After that you land in the **lobby**:

- **Create a game** — pick 2–4 players and a seed → you're dropped into `/?room=CODE`.
- **Join a game** — type a 4-letter room code.
- **Hot-seat** — a link to play everyone-on-one-device with no account.

In an online room each signed-in identity claims the next free seat (**Player 1–4**, in join
order); your username shows as your player name. The server is authoritative and pushes a
per-seat **redacted** state over SSE — you never receive opponents' hand contents or the draw
decks. Reload reconnects you to the same seat by identity. A full room is refused.

### Auth model

- `POST /api/auth/{register,login,guest,logout}`, `GET /api/me`. Session is an opaque token
  in an httpOnly cookie, looked up in an in-memory `Map` (`lib/auth.js`).
- Registered accounts are hashed with `node:crypto` scrypt and stored in `data/users.json`
  (gitignored) — they survive a restart. Live sessions and in-progress games do not.
- `POST /api/join` requires a session; `/api/room` is open (an empty room is cheap and gets
  swept after 10 min idle).
- Cookies are not `secure` (works over plain localhost and the HTTPS tunnel alike).

## Layout

| Path | Role |
|---|---|
| `lib/engine.js` | Deterministic rules engine + legal-action validation. Plain JS, spec-complete. |
| `lib/config.js` | `GAME_CONFIG` — every tunable value in one place. |
| `lib/rooms.js` | In-memory online-room store: `createRoom` / `claimSeat` (by identity) / `authorize` / `redactState` / `applyAction`. |
| `lib/auth.js`, `lib/session.ts` | Username/password (scrypt, `data/users.json`) + opaque session cookie. |
| `app/api/auth/*`, `app/api/me` | Register / login / guest / logout / whoami. |
| `components/AuthPanel.tsx`, `Lobby.tsx`, `AppShell.tsx` | Sign-in screen → lobby → game routing off `?room=` / `?local=`. |
| `lib/simulate.js` | Automated simulation batches. |
| `lib/types.ts`, `lib/*.d.ts` | Types for the state object and the engine's public API. |
| `lib/game-helpers.ts` | Board geometry, cost math, VP breakdown, phase stepper. |
| `app/api/{room,join,state,events,action}/route.ts` | Online endpoints (Node runtime, SSE). |
| `app/page.tsx` → `components/GameShell.tsx` | Client entry: routes between Setup / play / Scoreboard. |
| `hooks/useGame.ts` | The game store — local engine or online session; `act(method, ...args)`. |
| `components/` | `TopBar`, `PlayerRail`, `Board`, `InfoRail`, `ResourceBar`, `ActionDock`, `SetupScreen`, `Scoreboard`, panels, modals, `icons.tsx`. |
| `test/` | `engine.test.js`, `online.test.js` — run with `node --test`. |

## Changing GAME_CONFIG

Edit `lib/config.js`. Costs, dice faces, board sizes, starting resources, VP targets,
bonus VP, card stockpiles — all centralized there.

## Known gaps in this rebuild

- The 7-resource discard-half still resolves automatically in the engine (keeps the
  lowest); there is no interactive "choose which to discard" modal yet.
- Dhoota movement is one hex per click on the board; no multi-hop path planner.
- Player trades execute immediately (hot-seat semantics) — no offer / counter / accept.
- Online Sangrama resolves an Astra with no interactive defender counter (hidden hands
  hide the counter options).
- Scoreboard shows VP breakdown, turns and winner; per-game stat tiles (Sangramas,
  Astras played, etc.) are not tracked in engine state.
- Players are named "Player 1"–"Player 4".

## Security note

`next@14.2.35` is the latest patched 14.x; `npm audit` still flags framework DoS
advisories fixed only in Next 15/16 (major migration). They matter for a public,
load-bearing deployment — not for local or small-room play.
