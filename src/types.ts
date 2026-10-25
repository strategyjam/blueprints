import type { CellType } from "./shared/types";

export interface GameResult {
  winner: number;
  reason: string;
}

export type BlueprintShape = Record<string, CellType>;

export type Blueprints = [
  [BlueprintShape, BlueprintShape, BlueprintShape],
  [BlueprintShape, BlueprintShape, BlueprintShape],
];

export interface InitialState {
  ply: number;
  cells: Record<string, [number, CellType]>;
  blueprints: Blueprints;
  scores: number[];
}

export interface GameClock {
  remaining: [number, number];
  since: number;
  initialMs: number;
  incrementMs: number;
  startedAt: number;
  now: number;
}

export interface GameStateView {
  moves?: string[];
  result?: string | GameResult | null;
  turn?: number;
  ply?: number;
  left?: number;
  cells?: Record<string, [number, CellType]>;
  blueprints?: Blueprints;
  scores?: number[];
  stars?: number[];
}

export interface GameState {
  type: "state";
  game: "blueprints";
  rated?: boolean;
  ratings?: Array<{ rating: number; provisional: boolean }>;
  ratingChanges?: Record<string, unknown> | null;
  seats?: string[];
  modes?: string[];
  engineSelfTest?: boolean;
  ply: number;
  turn?: number | null;
  you?: Array<number | string>;
  startsAt?: number | null;
  view?: GameStateView;
  initial?: InitialState;
  history?: string[];
  times?: number[];
  archived?: boolean;
  clock?: GameClock;
  tournament: null;
  rematch: null;
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
  | { type: "ready"; heartbeatMs?: number }
  | { type: "inbox"; games?: Array<{ room: string }> }
  | { type: "challenge"; room: string; game?: string }
  | { type: "tournament"; tournament: string; state: TournamentState }
  | { type: "state"; room: string; state: GameState }
  | { type: "error" };
