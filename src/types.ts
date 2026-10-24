export interface GameStateView {
  result?: string;
  moves?: string[];
}

export interface GameState {
  ply: number;
  turn?: string;
  you?: string[];
  startsAt?: number;
  view?: GameStateView;
}

export interface TournamentGameJob {
  room: string;
  ready: boolean;
  round: number;
}

export interface TournamentState {
  status: string;
  active: boolean;
  withdrawn: boolean;
  checkedIn: boolean;
  closesAt?: number;
  round: number;
  game?: TournamentGameJob;
}

export type WebSocketMessage =
  | { type: "pong" }
  | { type: "ready" }
  | { type: "inbox"; games?: Array<{ room: string }> }
  | { type: "challenge"; room: string }
  | { type: "tournament"; tournament: string; state: TournamentState }
  | { type: "state"; room: string; state: GameState }
  | { type: "error" };
