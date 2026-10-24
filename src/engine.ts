import type { GameState } from "./types";

export function selectMove(state: GameState): string | null {
  const moves = state.view?.moves;
  if (!moves || moves.length === 0) {
    return null;
  }
  // TODO: Replace with proper engine evaluation logic in the future.
  return moves[Math.floor(Math.random() * moves.length)]!;
}
