import { describe, expect, it } from "bun:test";
import { convertRawBlueprints, ruleStateFromGameState } from "#rules/validator";

import { getStateAfterMove, getStateAfterMoves } from "#rules/board";
import { parseMove } from "#rules/moves";

import * as example1 from "./fixtures/example1";
import * as example2 from "./fixtures/example2";

describe("getStateAfterMove", () => {
  it("should correctly apply a single place move (example 1)", () => {
    const { initialState, move, gameStateViewAfterMove } = example1;

    const before = ruleStateFromGameState(initialState);
    const after = getStateAfterMove(before, parseMove(move));

    expect(after.blueprints).toEqual([
      convertRawBlueprints(gameStateViewAfterMove.blueprints[0]),
      convertRawBlueprints(gameStateViewAfterMove.blueprints[1]),
    ]);
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
  });

  it("should correctly apply a sequence of moves (example 2)", () => {
    const { initialState, moves, gameStateViewAfterMove } = example2;

    const before = ruleStateFromGameState(initialState);
    const after = getStateAfterMoves(before, moves);

    expect(after.blueprints).toEqual([
      convertRawBlueprints(gameStateViewAfterMove.blueprints[0]),
      convertRawBlueprints(gameStateViewAfterMove.blueprints[1]),
    ]);
  });
});
