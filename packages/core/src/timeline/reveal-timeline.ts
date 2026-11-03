// reveal-timeline.ts: splits reveal progress into the grid phase and the fade to the photo.
// Layer 1 (pure). Must not import DOM code.

import { clamp, smoothstep } from "../math/number.ts";

// The grid plays over the first 80% of the reveal, and the photo fades in over the rest.
const GRID_END = 0.8;

/**
 * Finds the grid timeline `gp` at a reveal progress.
 *
 * @param p - Reveal progress, from 0 to 1.
 * @returns The grid progress, reaching 1 at `p = 0.8`.
 */
export function gridProgress(p: number): number {
  return clamp(p / GRID_END);
}

/**
 * Finds the opacity of the real photo at a reveal progress.
 *
 * @param p - Reveal progress, from 0 to 1.
 * @returns 0 until `p = 0.8`, then a smoothstep up to 1 at `p = 1`.
 */
export function photoOpacity(p: number): number {
  return smoothstep(GRID_END, 1, p);
}

/**
 * Finds the opacity of the grid effect layer at a reveal progress. It is the inverse of
 * {@link photoOpacity}, so the two cross-fade.
 *
 * @param p - Reveal progress, from 0 to 1.
 * @returns 1 until `p = 0.8`, then a smoothstep down to 0 at `p = 1`, where the layer clears.
 */
export function effectOpacity(p: number): number {
  return 1 - photoOpacity(p);
}
