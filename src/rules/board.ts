import { getHexKey, getNeighbors, parseHexKey } from "./hex";
import type { BoardState, HexCoord, PlayerColor } from "./types";

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

export function getPlayerComponents(
  board: BoardState,
  player: PlayerColor,
): Array<Set<string>> {
  const playerCells = new Set<string>();
  for (const [key, cell] of board.entries()) {
    if (cell.owner === player) {
      playerCells.add(key);
    }
  }

  const components: Array<Set<string>> = [];
  const visited = new Set<string>();

  for (const key of playerCells) {
    if (!visited.has(key)) {
      const comp = new Set<string>();
      const queue: HexCoord[] = [parseHexKey(key)];
      visited.add(key);
      comp.add(key);

      while (queue.length > 0) {
        const current = queue.pop()!;
        for (const neighbor of getNeighbors(current)) {
          const nKey = getHexKey(neighbor);
          if (playerCells.has(nKey) && !visited.has(nKey)) {
            visited.add(nKey);
            comp.add(nKey);
            queue.push(neighbor);
          }
        }
      }
      components.push(comp);
    }
  }

  return components;
}

export function isConnected(board: BoardState, player: PlayerColor): boolean {
  return getPlayerComponents(board, player).length > 0;
}
