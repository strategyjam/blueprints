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
    // edit
    const fromBp = nextPlayerBlueprints.find(
      (bp) => bp.id === move.blueprintIdFrom,
    );
    const toBp = nextPlayerBlueprints.find(
      (bp) => bp.id === move.blueprintIdTo,
    );
    if (!fromBp || !toBp) {
      throw new Error("Blueprint not found for edit");
    }

    // Remove the cell from the source blueprint (immutable)
    const removedCell = fromBp.cells.find(
      (c) => c.offset.q === move.from.q && c.offset.r === move.from.r,
    );
    if (!removedCell) {
      throw new Error("Source cell not found");
    }

    const newFromCells = fromBp.cells.filter(
      (c) => !(c.offset.q === move.from.q && c.offset.r === move.from.r),
    );

    // Add the cell (same type) to the target blueprint (immutable)
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

    // Rebuild the player's blueprint list with the updated ones
    nextPlayerBlueprints = nextPlayerBlueprints.map((bp) => {
      if (bp.id === move.blueprintIdFrom) {
        return { id: bp.id, cells: newFromCells };
      }
      if (bp.id === move.blueprintIdTo) {
        return { id: bp.id, cells: newToCells };
      }
      return bp;
    });
  }

  const nextBlueprints: GameStateBlueprints =
    playerIndex === 0
      ? [nextPlayerBlueprints, otherPlayerBlueprints]
      : [otherPlayerBlueprints, nextPlayerBlueprints];

  // Recompute star counts after a possible place
  const starCounts = {
    blue: countPlayerStars(nextBoard, "blue"),
    red: countPlayerStars(nextBoard, "red"),
  };

  return {
    ...state,
    board: nextBoard,
    blueprints: nextBlueprints,
    starCounts,
    // currentTurn / movesRemainingInTurn / ply left unchanged
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
