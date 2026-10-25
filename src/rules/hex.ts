export interface HexCoord {
  readonly q: number;
  readonly r: number;
}

export type HexCoords = ReadonlyArray<HexCoord>;

export function getHexKey(coord: HexCoord): string {
  return `${coord.q},${coord.r}`;
}

export function parseHexKey(key: string): HexCoord {
  const parts = key.split(",");
  const qVal = parts[0];
  const rVal = parts[1];
  return {
    q: qVal !== undefined ? parseInt(qVal, 10) : 0,
    r: rVal !== undefined ? parseInt(rVal, 10) : 0,
  };
}

const HEX_DIRECTIONS: HexCoords = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
];

export function getNeighbors(coord: HexCoord): HexCoords {
  return HEX_DIRECTIONS.map((dir) => ({
    q: coord.q + dir.q,
    r: coord.r + dir.r,
  }));
}

export function areCoordsEqual(a: HexCoord, b: HexCoord): boolean {
  return a.q === b.q && a.r === b.r;
}
