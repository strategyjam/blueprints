import { callApi, stopped } from "./api";
import { config } from "./config";
import { selectMove } from "./engine";
import type { GameState, WebSocketMessage } from "./types";

const rooms = new Map<string, string | undefined>();
const timers = new Map<string, Timer>();
const pending = new Map<string, number>();
const checkedIn = new Set<string>();
const lastPongs = new Map<WebSocket, number>();

export function send(ws: WebSocket, message: unknown): void {
  if (!stopped && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

export function watch(
  ws: WebSocket,
  room: string,
  tournamentId?: string,
): void {
  if (tournamentId) {
    rooms.set(room, tournamentId);
  } else {
    rooms.set(room, undefined);
  }
  const msg: { type: string; room: string; tournament?: string } = {
    type: "watch-game",
    room,
  };
  if (tournamentId) {
    msg.tournament = tournamentId;
  }
  send(ws, msg);
}

export async function play(
  ws: WebSocket,
  room: string,
  state: GameState,
): Promise<void> {
  timers.delete(room);
  if (
    state.view.result ||
    !state.turn ||
    !state.you?.includes(state.turn) ||
    !state.view.moves?.length
  ) {
    return;
  }
  if (pending.get(room) === state.ply) {
    return;
  }

  const startsAt = state.startsAt || 0;
  const delay = Math.max(0, (startsAt - Date.now()) / 1000);
  if (delay > 0) {
    const timer = setTimeout(
      () => {
        void play(ws, room, state);
      },
      (delay + 0.1) * 1000,
    );
    timers.set(room, timer);
    return;
  }

  pending.set(room, state.ply);
  const tournamentId = rooms.get(room);
  const path = tournamentId
    ? `/api/engine/tournaments/${tournamentId}`
    : `/api/engine/games/${room}`;

  const chosenMove = selectMove(state);
  if (!chosenMove) {
    pending.delete(room);
    return;
  }

  const result = await callApi(`${path}/move`, {
    ply: state.ply,
    move: chosenMove,
  });
  if (result === null) {
    pending.delete(room);
    watch(ws, room, tournamentId);
  }
}

function isWebSocketMessage(value: unknown): value is WebSocketMessage {
  return typeof value === "object" && value !== null && "type" in value;
}

export async function handleMessage(ws: WebSocket, raw: string): Promise<void> {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return;
  }

  // console.log(data);

  if (!isWebSocketMessage(data)) {
    return;
  }

  const kind = data.type;
  if (kind === "pong") {
    lastPongs.set(ws, Date.now());
    return;
  }

  if (kind === "ready") {
    if (config.tournament) {
      send(ws, { type: "watch-tournament", tournament: config.tournament });
    }
  } else if (kind === "inbox") {
    for (const job of data.games || []) {
      watch(ws, job.room);
    }
  } else if (kind === "challenge") {
    watch(ws, data.room);
  } else if (kind === "tournament") {
    const state = data.state;
    const tourneyId = data.tournament;
    if (!state || !tourneyId) return;
    const key = `${tourneyId}:${state.round}`;
    if (state.status === "playing" && state.active && !state.withdrawn) {
      if (
        !state.checkedIn &&
        !checkedIn.has(key) &&
        (state.closesAt || 0) > Date.now()
      ) {
        checkedIn.add(key);
        const res = await callApi(
          `/api/engine/tournaments/${tourneyId}/check-in`,
          {},
        );
        if (res === null) {
          checkedIn.delete(key);
          send(ws, { type: "watch-tournament", tournament: tourneyId });
        }
      }
      const job = state.game;
      if (job && job.ready && job.room && job.round === state.round) {
        const already = rooms.has(job.room);
        if (!already) {
          watch(ws, job.room, tourneyId);
        }
      }
    }
  } else if (kind === "state") {
    const room = data.room;
    const state = data.state;
    if (!room || !state) return;
    const old = timers.get(room);
    if (old) {
      clearTimeout(old);
      timers.delete(room);
    }
    void play(ws, room, state);
  } else if (kind === "error") {
    console.log(
      "Subscription refused; check tournament enrollment and supported games.",
    );
  }
}

export function setupHeartbeat(ws: WebSocket): void {
  lastPongs.set(ws, Date.now());
  const interval = setInterval(() => {
    if (stopped || ws.readyState !== WebSocket.OPEN) {
      clearInterval(interval);
      lastPongs.delete(ws);
      return;
    }
    const lastPong = lastPongs.get(ws) || 0;
    if (Date.now() - lastPong > 45000) {
      ws.close();
      clearInterval(interval);
      lastPongs.delete(ws);
      return;
    }
    send(ws, { type: "ping" });
  }, 25000);
}

export function cleanup(): void {
  for (const timer of timers.values()) {
    clearTimeout(timer);
  }
  timers.clear();
  pending.clear();
  rooms.clear();
  checkedIn.clear();
  lastPongs.clear();
}
