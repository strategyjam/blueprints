import { serializeMove, parseMove } from "./rules/moves";
import { getValidMoves, ruleStateFromGameState } from "./rules/validator";
import { getStateAfterMove, getStateAfterMoves } from "./rules/board";
import type { GameState } from "./types";
import { getHexKey } from "#rules/hex";

export function selectMove(gameState: GameState): string | null {
  const serverMoves = gameState.view.moves;
  if (!serverMoves?.length) {
    return null;
  }

  const localMoves = getValidMoves(gameState.view);
  const serializedLocal = new Set(localMoves.map(serializeMove));
  const serializedServer = new Set(serverMoves);

  const mismatches: string[] = [];

  for (const serverMove of serverMoves) {
    if (!serializedLocal.has(serverMove)) {
      mismatches.push(`Server allowed move not found locally: ${serverMove}`);
    }
  }

  for (const localMove of localMoves) {
    const serialized = serializeMove(localMove);
    if (!serializedServer.has(serialized)) {
      mismatches.push(
        `Local rule found move not allowed by server: ${serialized}`,
      );
    }
  }

  if (gameState.history?.length) {
    try {
      const initialRuleState = ruleStateFromGameState(gameState.initial);

      // Replay everything up to (but not including) the last move
      const prevMoves = gameState.history.slice(0, -1);
      const lastMoveStr = gameState.history[gameState.history.length - 1]!;

      const stateBeforeLast = getStateAfterMoves(initialRuleState, prevMoves);
      const stateAfterLast = getStateAfterMove(
        stateBeforeLast,
        parseMove(lastMoveStr),
      );

      // Compare blueprints with the current view
      const expectedBlueprints = gameState.view.blueprints;
      const actualBlueprints = stateAfterLast.blueprints.map((playerBps) =>
        playerBps.map((bp) => {
          const obj: Record<string, string> = {};
          for (const cell of bp.cells) {
            obj[getHexKey(cell.offset)] = cell.type;
          }
          return obj;
        }),
      );

      // Simple deep equality check (order-independent for cells)
      const blueprintsMatch =
        JSON.stringify(normalizeBlueprints(actualBlueprints)) ===
        JSON.stringify(normalizeBlueprints(expectedBlueprints));

      if (!blueprintsMatch) {
        mismatches.push(`getStateAfterMove mismatch after "${lastMoveStr}"`);
        console.warn("[State After Move Mismatch]");
        console.log(
          "Expected blueprints:",
          JSON.stringify(expectedBlueprints, null, 2),
        );
        console.log(
          "Actual blueprints:  ",
          JSON.stringify(actualBlueprints, null, 2),
        );
      }
    } catch (err) {
      mismatches.push(`getStateAfterMove threw: ${(err as Error).message}`);
    }
  }

  if (mismatches.length > 0) {
    console.warn("[Rule / State Mismatches Detected]");
    console.log(JSON.stringify({ gameState, serverMoves }));
    for (const m of mismatches) {
      console.log(m);
    }
    console.log("-----------------------");
  } else {
    console.log("-----------------------");
    console.log(JSON.stringify(gameState));
    console.log("-----------------------");
  }

  const randomIndex = Math.floor(Math.random() * serverMoves.length);
  return serverMoves[randomIndex] ?? null;
}

function normalizeBlueprints(
  bps: Array<Array<Record<string, string>>>,
): Array<Array<Record<string, string>>> {
  return bps.map((player) =>
    player.map((shape) => {
      const sorted: Record<string, string> = {};
      for (const key of Object.keys(shape).sort()) {
        sorted[key] = shape[key]!;
      }
      return sorted;
    }),
  );
}
