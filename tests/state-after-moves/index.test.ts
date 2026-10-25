import { describe, expect, it } from "bun:test";

import { getStateAfterMove, getStateAfterMoves } from "#rules/board";
import { parseMove } from "#rules/moves";
import type { BoardState } from "#rules/types";
import {
  convertRawBlueprints,
  ruleStateFromGameState,
  type PartialGameStateView,
} from "#rules/validator";
import type { BoardCells, InitialState } from "../../src/types";

import * as example1 from "./fixtures/example1";
import * as example2 from "./fixtures/example2";
import * as example3 from "./fixtures/example3";
import * as example4 from "./fixtures/example4";
import * as example5 from "./fixtures/example5";

function boardToCells(board: BoardState) {
  const obj: BoardCells = {};
  for (const [key, cell] of board.entries()) {
    obj[key] = [cell.owner === "blue" ? 0 : 1, cell.type];
  }
  return obj;
}

interface FixtureExample {
  initialState: InitialState;
  gameStateViewAfterMove: PartialGameStateView;
  move: string;
  moves: string[];
}

const runSingleMoveTest = (example: FixtureExample) => {
  const { initialState, move, moves, gameStateViewAfterMove } = example;
  const before = moves
    ? getStateAfterMoves(
        ruleStateFromGameState(initialState),
        moves.slice(0, -1),
      )
    : ruleStateFromGameState(initialState);
  const after = getStateAfterMove(before, parseMove(move));

  expect(after.blueprints).toEqual([
    convertRawBlueprints(gameStateViewAfterMove.blueprints[0]),
    convertRawBlueprints(gameStateViewAfterMove.blueprints[1]),
  ]);
  expect(boardToCells(after.board)).toEqual(gameStateViewAfterMove.cells);
};

const runMoveSequenceTest = (example: FixtureExample) => {
  const { initialState, moves, gameStateViewAfterMove } = example;
  const before = ruleStateFromGameState(initialState);
  const after = getStateAfterMoves(before, moves);

  expect(after.blueprints).toEqual([
    convertRawBlueprints(gameStateViewAfterMove.blueprints[0]),
    convertRawBlueprints(gameStateViewAfterMove.blueprints[1]),
  ]);
  expect(boardToCells(after.board)).toEqual(gameStateViewAfterMove.cells);
};

describe("getStateAfterMove", () => {
  it("should correctly apply a single place move (example 1)", () => {
    runSingleMoveTest(example1);
  });

  it("should correctly apply a single edit move (example 2)", () => {
    runSingleMoveTest(example2);
  });

  it("should correctly apply a single edit move (example 3)", () => {
    runSingleMoveTest(example3);
  });

  it("should correctly apply a single edit move (example 4)", () => {
    runSingleMoveTest(example4);
  });

  it("should correctly apply a single edit move (example 5)", () => {
    runSingleMoveTest(example5);
  });
});

describe("getStateAfterMoves", () => {
  it("should correctly apply a sequence of moves (example 1)", () => {
    runMoveSequenceTest(example1);
  });

  it("should correctly apply a sequence of moves (example 2)", () => {
    runMoveSequenceTest(example2);
  });

  it("should correctly apply a sequence of moves (example 3)", () => {
    runMoveSequenceTest(example3);
  });

  it("should correctly apply a sequence of moves (example 4)", () => {
    runMoveSequenceTest(example4);
  });

  it("should correctly apply a sequence of moves (example 5)", () => {
    runMoveSequenceTest(example5);
  });
});
