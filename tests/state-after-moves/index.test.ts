import { describe, expect, it } from "bun:test";

import { getStateAfterMove, getStateAfterMoves } from "#rules/board";
import { parseMove } from "#rules/moves";
import type { BoardState } from "#rules/types";
import { convertRawBlueprints, ruleStateFromGameState } from "#rules/validator";

import * as example1 from "./fixtures/example1";
import * as example2 from "./fixtures/example2";
import type { BoardCells } from "../../src/types";

function boardToCells(board: BoardState) {
  const obj: BoardCells = {};
  for (const [key, cell] of board.entries()) {
    obj[key] = [cell.owner === "blue" ? 0 : 1, cell.type];
  }
  return obj;
}

describe("getStateAfterMove", () => {
  it("should correctly apply a single place move (example 1)", () => {
    const { initialState, move, gameStateViewAfterMove } = example1;

    const before = ruleStateFromGameState(initialState);
    const after = getStateAfterMove(before, parseMove(move));

    expect(after.blueprints).toEqual([
      convertRawBlueprints(gameStateViewAfterMove.blueprints[0]),
      convertRawBlueprints(gameStateViewAfterMove.blueprints[1]),
    ]);

    expect(boardToCells(after.board)).toEqual(gameStateViewAfterMove.cells);
  });

  it("should correctly apply a single edit move (example 2)", () => {
    const initialState = example1.gameStateViewAfterMove;
    const { move, gameStateViewAfterMove } = example2;

    const before = ruleStateFromGameState(initialState);
    const after = getStateAfterMove(before, parseMove(move));

    expect(after.blueprints).toEqual([
      convertRawBlueprints(gameStateViewAfterMove.blueprints[0]),
      convertRawBlueprints(gameStateViewAfterMove.blueprints[1]),
    ]);

    expect(boardToCells(after.board)).toEqual(gameStateViewAfterMove.cells);
  });
});

describe("getStateAfterMoves", () => {
  it("should correctly apply a sequence of moves (example 1)", () => {
    const { initialState, moves, gameStateViewAfterMove } = example1;

    const before = ruleStateFromGameState(initialState);
    const after = getStateAfterMoves(before, moves);

    expect(after.blueprints).toEqual([
      convertRawBlueprints(gameStateViewAfterMove.blueprints[0]),
      convertRawBlueprints(gameStateViewAfterMove.blueprints[1]),
    ]);

    expect(boardToCells(after.board)).toEqual(gameStateViewAfterMove.cells);
  });

  it("should correctly apply a sequence of moves (example 2)", () => {
    const { initialState, moves, gameStateViewAfterMove } = example2;

    const before = ruleStateFromGameState(initialState);
    const after = getStateAfterMoves(before, moves);

    expect(after.blueprints).toEqual([
      convertRawBlueprints(gameStateViewAfterMove.blueprints[0]),
      convertRawBlueprints(gameStateViewAfterMove.blueprints[1]),
    ]);

    expect(boardToCells(after.board)).toEqual(gameStateViewAfterMove.cells);
  });
});
