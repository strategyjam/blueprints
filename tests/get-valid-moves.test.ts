import { describe, expect, it } from "bun:test";

import { getValidMoves } from "../src/rules/validator";

import * as example1 from "./fixtures/example1";
import * as example2 from "./fixtures/example2";
import * as example3 from "./fixtures/example3";
import type { GameState } from "../src/types";
import { serializeMove } from "../src/rules/moves";

describe("getValidMoves", () => {
  it("should generate valid moves for example 1", () => {
    const { gameState, validMoves } = example1;

    expect(getValidMoves(gameState).map(serializeMove).toSorted()).toEqual(
      validMoves,
    );
  });

  it("should generate valid moves for example 2", () => {
    const { gameState, validMoves } = example2;

    expect(getValidMoves(gameState).map(serializeMove).toSorted()).toEqual(
      validMoves,
    );
  });

  it("should generate valid moves for example 3", () => {
    const { gameState, validMoves } = example3;

    expect(getValidMoves(gameState).map(serializeMove).toSorted()).toEqual(
      validMoves,
    );
  });
});
