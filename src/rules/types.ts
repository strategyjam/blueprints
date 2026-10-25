import type { CellType } from "../shared/types";
import type { HexCoord } from "./hex";

export type PlayerColor = "blue" | "red";

export interface BoardCell {
  readonly type: CellType;
  readonly owner: PlayerColor;
}

export type BoardState = ReadonlyMap<string, BoardCell>;

export interface BlueprintCell {
  readonly offset: HexCoord;
  readonly type: CellType;
}

export type BlueprintCells = ReadonlyArray<BlueprintCell>;

export interface BlueprintTemplate {
  readonly id: number;
  readonly cells: BlueprintCells;
}

export type BlueprintTemplates = readonly [
  BlueprintTemplate,
  BlueprintTemplate,
  BlueprintTemplate,
];

export type GameStateBlueprints = readonly [
  blue: BlueprintTemplates,
  red: BlueprintTemplates,
];

export interface GameRuleState {
  readonly board: BoardState;
  readonly scores: { readonly blue: number; readonly red: number };
  readonly starCounts: { readonly blue: number; readonly red: number };
  readonly currentTurn: PlayerColor;
  readonly movesRemainingInTurn: number;
  readonly ply: number;
  readonly blueprints: GameStateBlueprints;
}
