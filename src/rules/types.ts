import type { CellType } from "../shared/types";

export type PlayerColor = "blue" | "red";

export interface HexCoord {
  readonly q: number;
  readonly r: number;
}

export interface BoardCell {
  readonly type: CellType;
  readonly owner: PlayerColor;
}

export type BoardState = ReadonlyMap<string, BoardCell>;

export interface BlueprintCellTemplate {
  readonly offset: HexCoord;
  readonly type: CellType;
}

export interface BlueprintTemplate {
  readonly id: number;
  readonly cells: ReadonlyArray<BlueprintCellTemplate>;
}

export type MoveType =
  | {
      readonly kind: "place";
      readonly blueprintId: number;
      readonly target: HexCoord;
    }
  | {
      readonly kind: "edit";
      readonly blueprintIdFrom: number;
      readonly from: HexCoord;
      readonly blueprintIdTo: number;
      readonly to: HexCoord;
    };

export interface GameRuleState {
  readonly board: BoardState;
  readonly scores: Readonly<Record<PlayerColor, number>>;
  readonly starCounts: Readonly<Record<PlayerColor, number>>;
  readonly currentTurn: PlayerColor;
  readonly movesRemainingInTurn: number;
  readonly ply: number;
  readonly maxPlies: number;
  readonly blueprints: ReadonlyArray<BlueprintTemplate>;
}
