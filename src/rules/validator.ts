import {
  getHexKey,
  parseHexKey,
  getNeighbors,
  areCoordsEqual,
  type HexCoord,
} from "./hex";
import { countPlayerStars } from "./board";
import type {
  GameRuleState,
  PlayerColor,
  BoardCell,
  BoardState,
  GameStateBlueprints,
  BlueprintTemplates,
  BlueprintTemplate,
  BlueprintCell,
} from "./types";
import type { BlueprintShape, BlueprintShapes, GameStateView } from "../types";
import type { MoveType } from "./moves";

function convertRawBlueprint(
  shape: BlueprintShape,
  index: number,
): BlueprintTemplate {
  return {
    id: index + 1,
    cells: Object.entries(shape).map<BlueprintCell>(([key, type]) => ({
      offset: parseHexKey(key),
      type,
    })),
  };
}

export function convertRawBlueprints(
  shapes: BlueprintShapes,
): BlueprintTemplates {
  return [
    convertRawBlueprint(shapes[0], 0),
    convertRawBlueprint(shapes[1], 1),
    convertRawBlueprint(shapes[2], 2),
  ];
}

export type PartialGameStateView = Omit<GameStateView, "moves">;

export function ruleStateFromGameState(
  view: PartialGameStateView,
): GameRuleState {
  const board = new Map<string, BoardCell>();
  const cells = view.cells || {};
  for (const [key, val] of Object.entries(cells)) {
    if (Array.isArray(val) && val.length === 2) {
      const [ownerIndex, type] = val;
      const owner: PlayerColor = ownerIndex === 0 ? "blue" : "red";
      board.set(key, { type, owner });
    }
  }

  const scores = { blue: view.scores[0], red: view.scores[1] };

  const currentTurn: PlayerColor = view.turn === 1 ? "red" : "blue";

  const blueprints: GameStateBlueprints = [
    convertRawBlueprints(view.blueprints[0]),
    convertRawBlueprints(view.blueprints[1]),
  ];

  const ply = view.ply;
  const movesRemainingInTurn = ply % 2 === 1 ? 2 : 1;

  const starCounts = {
    blue: countPlayerStars(board, "blue"),
    red: countPlayerStars(board, "red"),
  };

  return {
    board,
    scores,
    starCounts,
    currentTurn,
    movesRemainingInTurn,
    ply,
    blueprints,
  };
}

function getValidPlaceMoves(
  board: BoardState,
  currentTurn: PlayerColor,
  blueprints: BlueprintTemplates,
  hasCells: boolean,
  adjacentEmptyKeys: ReadonlySet<string>,
): ReadonlyArray<MoveType> {
  const moves: MoveType[] = [];
  for (const [index, template] of blueprints.entries()) {
    const blueprintId = index + 1;
    const candidateCenters = new Set<string>();

    if (!hasCells) {
      candidateCenters.add("0,0");
      for (const neighbor of getNeighbors({ q: 0, r: 0 })) {
        candidateCenters.add(getHexKey(neighbor));
      }
    } else {
      for (const bpCell of template.cells) {
        for (const emptyKey of adjacentEmptyKeys) {
          const emptyCoord = parseHexKey(emptyKey);
          const centerCoord: HexCoord = {
            q: emptyCoord.q - bpCell.offset.q,
            r: emptyCoord.r - bpCell.offset.r,
          };
          candidateCenters.add(getHexKey(centerCoord));
        }
      }
    }

    for (const centerKey of candidateCenters) {
      const centerCoord = parseHexKey(centerKey);
      let canPlace = true;
      let touchesPlayer = !hasCells;

      for (const bpCell of template.cells) {
        const targetCoord: HexCoord = {
          q: centerCoord.q + bpCell.offset.q,
          r: centerCoord.r + bpCell.offset.r,
        };
        const targetKey = getHexKey(targetCoord);
        const existing = board.get(targetKey);
        if (existing) {
          canPlace = false;
          break;
        }

        if (!hasCells) {
          touchesPlayer = true;
        } else {
          for (const neighbor of getNeighbors(targetCoord)) {
            const neighborCell = board.get(getHexKey(neighbor));
            if (neighborCell && neighborCell.owner === currentTurn) {
              touchesPlayer = true;
            }
          }
        }
      }

      if (canPlace && touchesPlayer) {
        moves.push({ kind: "place", blueprintId, target: centerCoord });
      }
    }
  }
  return moves;
}

function areOffsetsConnected(offsets: ReadonlyArray<HexCoord>): boolean {
  if (offsets.length <= 1) return true;
  const set = new Set(offsets.map(getHexKey));
  const visited = new Set<string>();
  const queue: HexCoord[] = [offsets[0]!];
  visited.add(getHexKey(offsets[0]!));

  while (queue.length > 0) {
    const curr = queue.pop()!;
    for (const neighbor of getNeighbors(curr)) {
      const key = getHexKey(neighbor);
      if (set.has(key) && !visited.has(key)) {
        visited.add(key);
        queue.push(neighbor);
      }
    }
  }
  return visited.size === set.size;
}

function getValidEditMoves(
  blueprints: BlueprintTemplates,
): ReadonlyArray<MoveType> {
  const moves: MoveType[] = [];
  const seen = new Set<string>();

  for (const bpFrom of blueprints) {
    for (const cell of bpFrom.cells) {
      const fromCoord = cell.offset;
      const remainingFromCells = bpFrom.cells
        .filter((c) => !areCoordsEqual(c.offset, fromCoord))
        .map((c) => c.offset);

      for (const bpTo of blueprints) {
        if (bpFrom.id !== bpTo.id && !areOffsetsConnected(remainingFromCells)) {
          continue;
        }

        const existingToOffsets = new Set(
          bpTo.cells.map((c) => getHexKey(c.offset)),
        );
        const candidateTargets = new Set<string>();

        if (bpTo.cells.length === 0) {
          candidateTargets.add("0,0");
        } else {
          for (const c of bpTo.cells) {
            if (bpFrom.id === bpTo.id && areCoordsEqual(c.offset, fromCoord)) {
              continue;
            }
            for (const neighbor of getNeighbors(c.offset)) {
              const nKey = getHexKey(neighbor);
              const isFromPos =
                bpFrom.id === bpTo.id && areCoordsEqual(neighbor, fromCoord);
              if (!existingToOffsets.has(nKey) || isFromPos) {
                candidateTargets.add(nKey);
              }
            }
          }
        }

        for (const targetKey of candidateTargets) {
          const toCoord = parseHexKey(targetKey);
          if (bpFrom.id === bpTo.id && areCoordsEqual(toCoord, fromCoord)) {
            continue;
          }

          let newTargetOffsets: HexCoord[];
          if (bpFrom.id === bpTo.id) {
            newTargetOffsets = remainingFromCells.concat([toCoord]);
          } else {
            newTargetOffsets = bpTo.cells
              .map((c) => c.offset)
              .concat([toCoord]);
          }

          if (areOffsetsConnected(newTargetOffsets)) {
            const moveKey = `${bpFrom.id}:${fromCoord.q},${fromCoord.r}>${bpTo.id}:${toCoord.q},${toCoord.r}`;
            if (!seen.has(moveKey)) {
              seen.add(moveKey);
              moves.push({
                kind: "edit",
                blueprintIdFrom: bpFrom.id,
                from: fromCoord,
                blueprintIdTo: bpTo.id,
                to: toCoord,
              });
            }
          }
        }
      }
    }
  }
  return moves;
}

function getAdjacentEmptyKeys(
  playerCells: HexCoord[],
  board: BoardState,
): Set<string> {
  const adjacentEmptyKeys = new Set<string>();
  for (const pCell of playerCells) {
    for (const neighbor of getNeighbors(pCell)) {
      const nKey = getHexKey(neighbor);
      if (!board.has(nKey)) {
        adjacentEmptyKeys.add(nKey);
      }
    }
  }
  return adjacentEmptyKeys;
}

export function getValidMoves(
  view: PartialGameStateView,
): ReadonlyArray<MoveType> {
  const { board, currentTurn, blueprints } = ruleStateFromGameState(view);
  const playerIndex = currentTurn === "blue" ? 0 : 1;
  const blueprintsForPlayer = blueprints[playerIndex];

  const playerCells: HexCoord[] = [];
  for (const [key, cell] of board.entries()) {
    if (cell.owner === currentTurn) {
      playerCells.push(parseHexKey(key));
    }
  }

  const hasCells = playerCells.length > 0;
  const adjacentEmptyKeys = getAdjacentEmptyKeys(playerCells, board);

  const placeMoves = getValidPlaceMoves(
    board,
    currentTurn,
    blueprintsForPlayer,
    hasCells,
    adjacentEmptyKeys,
  );
  const editMoves = getValidEditMoves(blueprintsForPlayer);

  return [...placeMoves, ...editMoves];
}
