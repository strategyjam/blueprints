import { BLUEPRINT_TEMPLATES } from "./templates";
import { getHexKey, parseHexKey, getNeighbors } from "./hex";
import { countPlayerStars } from "./board";
import type {
  GameRuleState,
  HexCoord,
  MoveType,
  PlayerColor,
  BlueprintTemplate,
  BoardCell,
  BoardState,
} from "./types";
import type { GameStateView, InitialState } from "../types";
import type { CellType } from "../shared/types";

function convertRawBlueprints(
  rawList: Array<Record<string, CellType>>,
): ReadonlyArray<BlueprintTemplate> {
  return rawList.map((record, index) => {
    const cells = Object.entries(record).map(([key, type]) => {
      const offset = parseHexKey(key);
      return { offset, type };
    });
    return { id: index + 1, cells };
  });
}

export type PartialGameState = {
  view?: Omit<GameStateView, "moves">;
  initial?: InitialState;
  ply: number;
};

export function ruleStateFromGameState(state: PartialGameState): GameRuleState {
  const board = new Map<string, BoardCell>();

  const cells = state.view?.cells || state.initial?.cells || {};
  for (const [key, val] of Object.entries(cells)) {
    if (Array.isArray(val) && val.length === 2) {
      const [ownerIndex, type] = val;
      const owner: PlayerColor = ownerIndex === 0 ? "blue" : "red";
      board.set(key, { type, owner });
    }
  }

  const scoresList = state.view?.scores || state.initial?.scores || [0, 0];
  const scores = {
    blue: scoresList[0] ?? 0,
    red: scoresList[1] ?? 0,
  };

  const currentTurn: PlayerColor = state.view?.turn === 0 ? "blue" : "red";
  const ply = state.view?.ply ?? state.ply ?? 0;

  const playerIndex = state.view?.turn ?? 0;
  const rawBlueprints =
    state.view?.blueprints || state.initial?.blueprints || [];
  const playerRawBlueprints = rawBlueprints[playerIndex] || rawBlueprints[0];
  const blueprints = playerRawBlueprints
    ? convertRawBlueprints(playerRawBlueprints)
    : BLUEPRINT_TEMPLATES;

  return {
    board,
    scores,
    starCounts: {
      blue: countPlayerStars(board, "blue"),
      red: countPlayerStars(board, "red"),
    },
    currentTurn,
    movesRemainingInTurn: 2,
    ply,
    maxPlies: 120,
    blueprints,
  };
}

export function serializeMove(move: MoveType): string {
  if (move.kind === "place") {
    return `${move.blueprintId}@${move.target.q},${move.target.r}`;
  }
  return `${move.blueprintIdFrom}:${move.from.q},${move.from.r}>${move.blueprintIdTo}:${move.to.q},${move.to.r}`;
}

function getValidPlaceMoves(
  board: BoardState,
  currentTurn: PlayerColor,
  blueprints: ReadonlyArray<BlueprintTemplate>,
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
  const set = new Set(offsets.map((o) => `${o.q},${o.r}`));
  const visited = new Set<string>();
  const queue: HexCoord[] = [offsets[0]!];
  visited.add(`${offsets[0]!.q},${offsets[0]!.r}`);

  while (queue.length > 0) {
    const curr = queue.pop()!;
    for (const neighbor of getNeighbors(curr)) {
      const key = `${neighbor.q},${neighbor.r}`;
      if (set.has(key) && !visited.has(key)) {
        visited.add(key);
        queue.push(neighbor);
      }
    }
  }
  return visited.size === set.size;
}

function getValidEditMoves(
  blueprints: ReadonlyArray<BlueprintTemplate>,
): ReadonlyArray<MoveType> {
  const moves: MoveType[] = [];
  const seen = new Set<string>();

  for (const bpFrom of blueprints) {
    for (const cell of bpFrom.cells) {
      const fromCoord = cell.offset;

      const remainingFromCells = bpFrom.cells
        .filter(
          (c) => !(c.offset.q === fromCoord.q && c.offset.r === fromCoord.r),
        )
        .map((c) => c.offset);

      if (!areOffsetsConnected(remainingFromCells)) continue;

      for (const bpTo of blueprints) {
        const existingToOffsets = new Set(
          bpTo.cells.map((c) => `${c.offset.q},${c.offset.r}`),
        );
        const candidateTargets = new Set<string>();

        for (const c of bpTo.cells) {
          if (
            bpFrom.id === bpTo.id &&
            c.offset.q === fromCoord.q &&
            c.offset.r === fromCoord.r
          ) {
            continue;
          }
          for (const neighbor of getNeighbors(c.offset)) {
            const nKey = `${neighbor.q},${neighbor.r}`;
            const isFromPos =
              bpFrom.id === bpTo.id &&
              neighbor.q === fromCoord.q &&
              neighbor.r === fromCoord.r;
            if (!existingToOffsets.has(nKey) || isFromPos) {
              candidateTargets.add(nKey);
            }
          }
        }

        for (const targetKey of candidateTargets) {
          const toCoord = parseHexKey(targetKey);

          if (
            bpFrom.id === bpTo.id &&
            toCoord.q === fromCoord.q &&
            toCoord.r === fromCoord.r
          ) {
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

export function getValidMoves(state: GameRuleState): ReadonlyArray<MoveType> {
  const { board, currentTurn } = state;
  const blueprints = state.blueprints || BLUEPRINT_TEMPLATES;

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
    blueprints,
    hasCells,
    adjacentEmptyKeys,
  );

  const editMoves = getValidEditMoves(blueprints);

  return [...placeMoves, ...editMoves];
}
