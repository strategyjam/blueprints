import type { HexCoord } from "./hex";

export type MoveType =
  | {
      readonly kind: "place";
      readonly blueprintId: number;
      readonly target: HexCoord;
    }
  | {
      readonly kind: "edit";
      readonly blueprintIdFrom: number;
      readonly from: HexCoord;
      readonly blueprintIdTo: number;
      readonly to: HexCoord;
    };

export function serializeMove(move: MoveType): string {
  if (move.kind === "place") {
    return `${move.blueprintId}@${move.target.q},${move.target.r}`;
  }
  return `${move.blueprintIdFrom}:${move.from.q},${move.from.r}>${move.blueprintIdTo}:${move.to.q},${move.to.r}`;
}

export function parseMove(serialized: string): MoveType {
  if (serialized.includes("@")) {
    const [idStr, coordStr] = serialized.split("@");
    const blueprintId = Number(idStr);
    const [q, r] = coordStr!.split(",").map(Number) as [number, number];
    return {
      kind: "place",
      blueprintId,
      target: { q, r },
    };
  }

  const [fromPart, toPart] = serialized.split(">");
  const [fromIdStr, fromCoordStr] = fromPart!.split(":");
  const [toIdStr, toCoordStr] = toPart!.split(":");

  const [fq, fr] = fromCoordStr!.split(",").map(Number);
  const [tq, tr] = toCoordStr!.split(",").map(Number);

  return {
    kind: "edit",
    blueprintIdFrom: Number(fromIdStr),
    from: { q: fq!, r: fr! },
    blueprintIdTo: Number(toIdStr),
    to: { q: tq!, r: tr! },
  };
}
