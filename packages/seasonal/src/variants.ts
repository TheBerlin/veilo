// variants.ts: the ten winter effects as drawing routines: how long one run lasts, which frame to
// rest on, the character grid each wants, and the function that draws a frame at a time.

import { FLAKE_PERIOD, flakeScene, renderAscii, type AsciiStyle } from "./ascii.ts";
import { BARS_PERIOD, renderBars } from "./bars.ts";
import { BLIZZARD_PERIOD, renderBlizzard } from "./blizzard.ts";
import { CELL_PERIOD, renderCellGrid, type CellMode } from "./cell-grid.ts";
import type { CanvasState, StateOptions } from "./state.ts";

/** The id of each winter effect. */
export const EFFECT_IDS = [
  "bars",
  "frost",
  "ice",
  "aurora",
  "curtains",
  "glow",
  "blizzard",
  "cell-dots",
  "cell-cells",
  "cell-frost",
] as const;

/** One winter effect's id. */
export type EffectId = (typeof EFFECT_IDS)[number];

/** How one effect draws. */
export interface Variant {
  /** Length of one full run, in seconds. */
  period: number;
  /** The time to rest on when it is not playing: a frame that shows the effect well. */
  still: number;
  /** The character grid it wants. */
  options: StateOptions;
  /** Draws the frame at time `t`. */
  draw: (st: CanvasState, t: number) => void;
}

/**
 * The draw function of a flake effect in one coloring style.
 *
 * @param style - How the characters are colored.
 * @returns A function that draws the frame at a time.
 */
function asciiDraw(style: AsciiStyle): Variant["draw"] {
  return (st, t) => renderAscii(st, t, flakeScene, style);
}

/**
 * The draw function of a cell-grid effect in one mode.
 *
 * @param mode - Dots, cells or frost cells.
 * @returns A function that draws the frame at a time.
 */
function cellDraw(mode: CellMode): Variant["draw"] {
  return (st, t) => renderCellGrid(st, t, mode);
}

const FLAKE_GRID: StateOptions = { font: 11, lineHeight: 12 };
const CELL_GRID: StateOptions = { font: 11, cell: 8 };

/** Every winter effect, by id. */
export const VARIANTS: Record<EffectId, Variant> = {
  bars: { period: BARS_PERIOD, still: 9, options: { font: 12 }, draw: renderBars },
  frost: {
    period: FLAKE_PERIOD,
    still: 4.6,
    options: FLAKE_GRID,
    draw: asciiDraw("ink"),
  },
  ice: {
    period: FLAKE_PERIOD,
    still: 4.6,
    options: FLAKE_GRID,
    draw: asciiDraw("cells"),
  },
  aurora: {
    period: FLAKE_PERIOD,
    still: 4.6,
    options: FLAKE_GRID,
    draw: asciiDraw("aurora"),
  },
  curtains: {
    period: FLAKE_PERIOD,
    still: 4.6,
    options: FLAKE_GRID,
    draw: asciiDraw("curtains"),
  },
  glow: {
    period: FLAKE_PERIOD,
    still: 4.6,
    options: FLAKE_GRID,
    draw: asciiDraw("glow"),
  },
  blizzard: { period: BLIZZARD_PERIOD, still: 5.4, options: { font: 13 }, draw: renderBlizzard },
  "cell-dots": {
    period: CELL_PERIOD,
    still: 4.6,
    options: CELL_GRID,
    draw: cellDraw("dots"),
  },
  "cell-cells": {
    period: CELL_PERIOD,
    still: 4.6,
    options: CELL_GRID,
    draw: cellDraw("cells"),
  },
  "cell-frost": {
    period: CELL_PERIOD,
    still: 4.6,
    options: CELL_GRID,
    draw: cellDraw("frost"),
  },
};

/** The effects that do not draw a flake, so the flake form does not change them. */
const NO_FLAKE: readonly EffectId[] = ["bars", "blizzard"];

/**
 * Whether the flake form (dendrite, fern, fir, sector) changes this effect.
 *
 * @param id - The effect.
 * @returns False for Snow on the bars and Blizzard dissolve, true for the rest.
 */
export function usesFlakeShape(id: EffectId): boolean {
  return !NO_FLAKE.includes(id);
}
