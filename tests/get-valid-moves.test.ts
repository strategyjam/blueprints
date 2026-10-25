import { describe, expect, it } from "bun:test";

import {
  getValidMoves,
  ruleStateFromGameState,
  serializeMove,
} from "../src/rules/validator";

import * as example1 from "./fixtures/example1";
import * as example2 from "./fixtures/example2";

describe("getValidMoves", () => {
  it("should generate valid moves for example 1", () => {
    const { gameState, validMoves } = example1;

    const ruleState = ruleStateFromGameState(gameState);

    expect(getValidMoves(ruleState).map(serializeMove).toSorted()).toEqual(
      validMoves,
    );
  });

  it("should generate valid moves for example 2", () => {
    const { gameState, validMoves } = example2;

    const ruleState = ruleStateFromGameState(gameState);

    expect(getValidMoves(ruleState).map(serializeMove).toSorted()).toEqual(
      validMoves,
    );
  });
});
