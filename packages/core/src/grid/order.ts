/**
 * order.ts: when each grid cell starts, from the spec's seven origins.
 * Layer 1 (pure). Must not import DOM code.
 */

import { clamp } from "../math/number.ts";
import { createRandom, DEFAULT_SEED, type RandomGenerator } from "../math/random.ts";
import type { Settings } from "../schema/types.ts";

/** Where a grid reveal starts. */
export type Origin = Settings["origin"];

// The corner distance from the center, as the spec rounds it.
const MAX_DISTANCE = 0.7071;
const CENTER_DISTANCE_WEIGHT = 0.85;
const CENTER_JITTER_WEIGHT = 0.15;

/**
 * Picks the order formula for an origin.
 *
 * @param origin - The reveal origin.
 * @param random - Source of randomness for `center` and `random`.
 * @returns A function from cell position (`u`, `v`, both 0 to 1) to order.
 */
function orderFormula(origin: Origin, random: RandomGenerator): (u: number, v: number) => number {
  switch (origin) {
    case "left":
      return (u) => u;
    case "right":
      return (u) => 1 - u;
    case "top":
      return (_u, v) => v;
    case "bottom":
      return (_u, v) => 1 - v;
    case "center":
      return (u, v) => {
        const distance = Math.hypot(u - 0.5, v - 0.5);
        const spread = (distance / MAX_DISTANCE) * CENTER_DISTANCE_WEIGHT;
        // Clamped because 0.7071 is slightly below the real corner distance, so a corner
        // with high jitter would land a hair above 1.
        return clamp(spread + random() * CENTER_JITTER_WEIGHT);
      };
    case "diagonal":
      return (u, v) => (u + v) / 2;
    case "random":
      return () => random();
  }
}

/**
 * Computes every cell's order value: 0 starts first and 1 starts last.
 *
 * The generator is created here with the spec's seed, so equal input gives an equal result.
 *
 * @param cols - Columns in the grid, at least 1.
 * @param rows - Rows in the grid, at least 1.
 * @param origin - Where the reveal starts.
 * @returns One value per cell, row by row: the cell at (col, row) is at `row * cols + col`.
 */
export function cellOrder(cols: number, rows: number, origin: Origin): Float64Array {
  const orderAt = orderFormula(origin, createRandom(DEFAULT_SEED));
  const order = new Float64Array(cols * rows);

  for (let row = 0; row < rows; row++) {
    // A single row or column sits at 0, where the spec's formula would divide by zero.
    const v = rows > 1 ? row / (rows - 1) : 0;
    for (let col = 0; col < cols; col++) {
      const u = cols > 1 ? col / (cols - 1) : 0;
      order[row * cols + col] = orderAt(u, v);
    }
  }
  return order;
}
