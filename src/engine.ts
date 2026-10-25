import {
  getValidMoves,
  ruleStateFromGameState,
  serializeMove,
} from "./rules/validator";
import type { GameState } from "./types";

export function selectMove(gameState: GameState): string | null {
  const serverMoves = gameState.view?.moves;
  if (!serverMoves?.length) {
    return null;
  }

  const ruleState = ruleStateFromGameState(gameState);

  const localMoves = getValidMoves(ruleState);
  const serializedLocal = new Set<string>();
  for (const localMove of localMoves) {
    serializedLocal.add(serializeMove(localMove));
  }

  const serializedServer = new Set<string>(serverMoves);
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

  if (mismatches.length > 0) {
    console.warn("[Rule Mismatches Detected]");
    console.log(JSON.stringify({ gameState, serverMoves }));
    for (const mismatch of mismatches) {
      console.log(mismatch);
    }
    console.log("-----------------------");
  }

  const randomIndex = Math.floor(Math.random() * serverMoves.length);
  return serverMoves[randomIndex] ?? null;
}
