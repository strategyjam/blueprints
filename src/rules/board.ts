import type { BoardState, PlayerColor } from "./types";

export function countPlayerStars(
  board: BoardState,
  player: PlayerColor,
): number {
  let count = 0;
  for (const cell of board.values()) {
    if (cell.owner === player && cell.type === "star") {
      count += 1;
    }
  }
  return count;
}
