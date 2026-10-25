import type { BlueprintTemplate } from "./types";

export const BLUEPRINT_TEMPLATES: ReadonlyArray<BlueprintTemplate> = [
  {
    id: 1,
    cells: [
      { offset: { q: 0, r: 0 }, type: "star" },
      { offset: { q: 1, r: 0 }, type: "plain" },
      { offset: { q: 1, r: -1 }, type: "plain" },
      { offset: { q: 0, r: -1 }, type: "plain" },
      { offset: { q: -1, r: 0 }, type: "plain" },
      { offset: { q: -1, r: 1 }, type: "plain" },
      { offset: { q: 0, r: 1 }, type: "plain" },
    ],
  },
  {
    id: 2,
    cells: [
      { offset: { q: 0, r: 0 }, type: "star" },
      { offset: { q: 1, r: 0 }, type: "wall" },
      { offset: { q: 1, r: -1 }, type: "star" },
      { offset: { q: 0, r: -1 }, type: "wall" },
      { offset: { q: -1, r: 0 }, type: "star" },
      { offset: { q: -1, r: 1 }, type: "wall" },
      { offset: { q: 0, r: 1 }, type: "star" },
    ],
  },
  {
    id: 3,
    cells: [
      { offset: { q: 0, r: 0 }, type: "star" },
      { offset: { q: 1, r: 0 }, type: "plain" },
      { offset: { q: 1, r: -1 }, type: "plain" },
      { offset: { q: 0, r: -1 }, type: "plain" },
      { offset: { q: -1, r: 0 }, type: "plain" },
      { offset: { q: -1, r: 1 }, type: "plain" },
      { offset: { q: 0, r: 1 }, type: "plain" },
    ],
  },
];
