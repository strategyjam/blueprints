import { describe, expect, it } from "bun:test";

import {
  getValidMoves,
  ruleStateFromGameState,
  serializeMove,
} from "../src/rules/validator";

import * as example1 from "./fixtures/example1";

describe("getValidMoves", () => {
  it("should generate valid moves for example 1", () => {
    const { gameState, validMoves } = example1;

    const ruleState = ruleStateFromGameState(gameState);

    expect(getValidMoves(ruleState).map(serializeMove).toSorted()).toEqual(
      validMoves,
    );
  });
});
