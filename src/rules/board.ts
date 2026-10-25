import { areCoordsEqual, getHexKey, getNeighbors, type HexCoord } from "./hex";
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

function normalizeBlueprintCells(cells: BlueprintCells): BlueprintCells {
  if (cells.length === 0) return cells;

  const r = Math.min(...cells.map((c) => c.offset.r));
  const cellsWithMinR = cells.filter((c) => c.offset.r === r);
  const q = Math.min(...cellsWithMinR.map((c) => c.offset.q));

  if (q === 0 && r === 0) return cells;

  return cells.map((cell) => ({
    type: cell.type,
    offset: { q: cell.offset.q - q, r: cell.offset.r - r },
  }));
}

export function getStateAfterMove(
  state: GameRuleState,
  move: MoveType,
): GameRuleState {
  const playerIndex = state.currentTurn === "blue" ? 0 : 1;

  const nextBoard = new Map(state.board);
  let nextPlayerBlueprints = state.blueprints[playerIndex].map(
    cloneBlueprint,
  ) as [BlueprintTemplate, BlueprintTemplate, BlueprintTemplate];
  const otherPlayerBlueprints = state.blueprints[1 - playerIndex]!;

  if (move.kind === "place") {
    const template = nextPlayerBlueprints.find(
      (bp) => bp.id === move.blueprintId,
    );
    if (!template) {
      throw new Error(`Blueprint ${move.blueprintId} not found`);
    }

    const newlyPlaced: HexCoord[] = [];
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
      newlyPlaced.push(abs);
    }

    const opponent: PlayerColor = state.currentTurn === "blue" ? "red" : "blue";

    const toRemove = new Set<string>();
    for (const placed of newlyPlaced) {
      for (const neighbor of getNeighbors(placed)) {
        const nKey = getHexKey(neighbor);
        const cell = nextBoard.get(nKey);
        if (cell && cell.owner === opponent && cell.type !== "wall") {
          toRemove.add(nKey);
        }
      }
    }

    for (const key of toRemove) {
      nextBoard.delete(key);
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

    const removedCell = fromBp.cells.find((c) =>
      areCoordsEqual(c.offset, move.from),
    );
    if (!removedCell) {
      throw new Error("Source cell not found");
    }

    if (move.blueprintIdFrom === move.blueprintIdTo) {
      const filteredCells = fromBp.cells.filter(
        (c) => !areCoordsEqual(c.offset, move.from),
      );
      const updatedCells: BlueprintCells = [
        ...filteredCells,
        { offset: { q: move.to.q, r: move.to.r }, type: removedCell.type },
      ];
      const newCells = normalizeBlueprintCells(updatedCells);

      nextPlayerBlueprints = nextPlayerBlueprints.map((bp) =>
        bp.id === move.blueprintIdFrom ? { id: bp.id, cells: newCells } : bp,
      ) as [BlueprintTemplate, BlueprintTemplate, BlueprintTemplate];
    } else {
      const filteredFromCells = fromBp.cells.filter(
        (c) => !areCoordsEqual(c.offset, move.from),
      );
      const newFromCells = normalizeBlueprintCells(filteredFromCells);

      const alreadyExists = toBp.cells.some((c) =>
        areCoordsEqual(c.offset, move.to),
      );

      const updatedToCells = alreadyExists
        ? toBp.cells
        : [
            ...toBp.cells,
            { offset: { q: move.to.q, r: move.to.r }, type: removedCell.type },
          ];
      const newToCells = normalizeBlueprintCells(updatedToCells);

      nextPlayerBlueprints = nextPlayerBlueprints.map((bp) => {
        if (bp.id === move.blueprintIdFrom) {
          return { id: bp.id, cells: newFromCells };
        }
        if (bp.id === move.blueprintIdTo) {
          return { id: bp.id, cells: newToCells };
        }
        return bp;
      }) as [BlueprintTemplate, BlueprintTemplate, BlueprintTemplate];
    }
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
