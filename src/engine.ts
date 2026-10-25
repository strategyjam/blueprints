import {
  getValidMoves,
  ruleStateFromGameState,
  serializeMove,
} from "./rules/validator";
import type { GameState } from "./types";

export function selectMove(gameState: GameState): string | null {
  const serverMoves = gameState.view?.moves;
  if (!serverMoves || serverMoves.length === 0) {
    return null;
  }

  const ruleState = ruleStateFromGameState(gameState);

  const localMoves = getValidMoves(ruleState);
  const serializedLocal = new Set<string>();
  for (const localMove of localMoves) {
    serializedLocal.add(serializeMove(localMove));
  }

  // console.log(
  //   JSON.stringify({
  //     gameState,
  //     serverMoves: serverMoves.toSorted(),
  //     localMoves: Array.from(serializedLocal).toSorted(),
  //   }),
  // );

  const serializedServer = new Set<string>(serverMoves);

  for (const serverMove of serverMoves) {
    if (!serializedLocal.has(serverMove)) {
      console.warn(
        `[Rule Mismatch] Server allowed move not found locally: ${serverMove}`,
      );
    }
  }

  for (const localMove of localMoves) {
    const serialized = serializeMove(localMove);
    if (!serializedServer.has(serialized)) {
      console.warn(
        `[Rule Mismatch] Local rule found move not allowed by server: ${serialized}`,
      );
    }
  }

  const randomIndex = Math.floor(Math.random() * serverMoves.length);
  return serverMoves[randomIndex] ?? null;
}
