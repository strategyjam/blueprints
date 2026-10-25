import { getHexKey } from "./hex";
import { parseMove, type MoveType } from "./moves";
import type {
  BlueprintTemplate,
  BoardState,
  GameRuleState,
  PlayerColor,
  GameStateBlueprints,
  BlueprintCells,
} from "./types";

export function countPlayerStars(
  board: BoardState,
  player: PlayerColor,
): number {
  let count = 0;
  for (const cell of board.values()) {
    if (cell.owner === player && cell.type === "star") {
      count += 1;
    }
  }
  return count;
}

function cloneBlueprint(bp: BlueprintTemplate): BlueprintTemplate {
  return {
    id: bp.id,
    cells: bp.cells.map((c) => ({
      offset: { q: c.offset.q, r: c.offset.r },
      type: c.type,
    })),
  };
}

export function getStateAfterMove(
  state: GameRuleState,
  move: MoveType,
): GameRuleState {
  const playerIndex = state.currentTurn === "blue" ? 0 : 1;

  const nextBoard = new Map(state.board);
  let nextPlayerBlueprints = state.blueprints[playerIndex].map(cloneBlueprint);
  const otherPlayerBlueprints = state.blueprints[1 - playerIndex]!;

  if (move.kind === "place") {
    const template = nextPlayerBlueprints.find(
      (bp) => bp.id === move.blueprintId,
    );
    if (!template) {
      throw new Error(`Blueprint ${move.blueprintId} not found`);
    }

    for (const cell of template.cells) {
      const abs = {
        q: move.target.q + cell.offset.q,
        r: move.target.r + cell.offset.r,
      };
      const key = getHexKey(abs);
      if (nextBoard.has(key)) {
        throw new Error(`Cell ${key} already occupied`);
      }
      nextBoard.set(key, {
        type: cell.type,
        owner: state.currentTurn,
      });
    }
  } else {
    const fromBp = nextPlayerBlueprints.find(
      (bp) => bp.id === move.blueprintIdFrom,
    );
    const toBp = nextPlayerBlueprints.find(
      (bp) => bp.id === move.blueprintIdTo,
    );
    if (!fromBp || !toBp) {
      throw new Error("Blueprint not found for edit");
    }

    const removedCell = fromBp.cells.find(
      (c) => c.offset.q === move.from.q && c.offset.r === move.from.r,
    );
    if (!removedCell) {
      throw new Error("Source cell not found");
    }

    const newFromCells = fromBp.cells.filter(
      (c) => !(c.offset.q === move.from.q && c.offset.r === move.from.r),
    );

    const alreadyExists = toBp.cells.some(
      (c) => c.offset.q === move.to.q && c.offset.r === move.to.r,
    );

    const newToCells: BlueprintCells = alreadyExists
      ? toBp.cells
      : [
          ...toBp.cells,
          {
            offset: { q: move.to.q, r: move.to.r },
            type: removedCell.type,
          },
        ];

    const anchor = { q: move.to.q, r: move.to.r };
    const recenteredToCells: BlueprintCells = newToCells.map((c) => ({
      offset: {
        q: c.offset.q - anchor.q,
        r: c.offset.r - anchor.r,
      },
      type: c.type,
    }));

    nextPlayerBlueprints = nextPlayerBlueprints.map((bp) => {
      if (bp.id === move.blueprintIdFrom) {
        return { id: bp.id, cells: newFromCells };
      }
      if (bp.id === move.blueprintIdTo) {
        return { id: bp.id, cells: recenteredToCells };
      }
      return bp;
    });
  }

  const nextBlueprints: GameStateBlueprints =
    playerIndex === 0
      ? [nextPlayerBlueprints, otherPlayerBlueprints]
      : [otherPlayerBlueprints, nextPlayerBlueprints];

  const nextPly = state.ply + 1;
  let nextMovesRemaining = state.movesRemainingInTurn - 1;
  let nextTurn = state.currentTurn;

  if (nextMovesRemaining <= 0) {
    nextTurn = state.currentTurn === "blue" ? "red" : "blue";
    nextMovesRemaining = 2;
  }

  const starCounts = {
    blue: countPlayerStars(nextBoard, "blue"),
    red: countPlayerStars(nextBoard, "red"),
  };

  return {
    ...state,
    board: nextBoard,
    blueprints: nextBlueprints,
    starCounts,
    currentTurn: nextTurn,
    movesRemainingInTurn: nextMovesRemaining,
    ply: nextPly,
  };
}

export function getStateAfterMoves(
  state: GameRuleState,
  serializedMoves: string[],
): GameRuleState {
  return serializedMoves.reduce(
    (s, serialized) => getStateAfterMove(s, parseMove(serialized)),
    state,
  );
}
