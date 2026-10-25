import { describe, expect, it } from "bun:test";

import { serializeMove } from "#rules/moves";
import { getValidMoves } from "#rules/validator";

import * as example1 from "./fixtures/example1";
import * as example2 from "./fixtures/example2";
import * as example3 from "./fixtures/example3";

describe("getValidMoves", () => {
  it("should generate valid moves (example 1)", () => {
    const { gameStateView, validMoves } = example1;

    expect(getValidMoves(gameStateView).map(serializeMove).toSorted()).toEqual(
      validMoves,
    );
  });

  it("should generate valid moves (example 2)", () => {
    const { gameStateView, validMoves } = example2;

    expect(getValidMoves(gameStateView).map(serializeMove).toSorted()).toEqual(
      validMoves,
    );
  });

  it("should generate valid moves (example 3)", () => {
    const { gameStateView, validMoves } = example3;

    expect(getValidMoves(gameStateView).map(serializeMove).toSorted()).toEqual(
      validMoves,
    );
  });
});
