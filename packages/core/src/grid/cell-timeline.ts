// cell-timeline.ts: progress, scale and alpha of one grid cell in a frame.
// Layer 1 (pure). Must not import DOM code.
//
// These run for every cell on every frame, so they return plain numbers and allocate nothing.

import type { EasingFunction } from "../math/easing.ts";
import { clamp, lerp } from "../math/number.ts";

// The spec's fade-in: a cell is fully opaque a quarter of the way through its own animation.
const ALPHA_RATE = 4;

/**
 * Finds how far a cell is through its own animation.
 *
 * @param gridProgress - The grid timeline `gp`, from 0 to 1.
 * @param order - The cell's order value, from 0 to 1.
 * @param spread - The `spread` setting. Higher starts cells further apart, and each one
 * animates for a shorter time. Must be below 1, as the settings range guarantees.
 * @returns The cell's progress `l`, from 0 to 1. A result of 0 means the cell is not drawn.
 */
export function cellProgress(gridProgress: number, order: number, spread: number): number {
  return clamp((gridProgress - order * spread) / (1 - spread));
}

/**
 * Finds a cell's scale at its own progress.
 *
 * @param progress - The cell's progress `l`, from {@link cellProgress}.
 * @param startScale - The `startScale` setting, the scale at the start of the animation.
 * @param ease - The reveal easing. Overshoot carries through, so scale can dip below 1.
 * @returns The scale, ending on exactly 1 at `l = 1`.
 */
export function cellScale(progress: number, startScale: number, ease: EasingFunction): number {
  return lerp(startScale, 1, ease(progress));
}

/**
 * Finds a cell's opacity at its own progress.
 *
 * @param progress - The cell's progress `l`, from {@link cellProgress}.
 * @returns The opacity, from 0 to 1.
 */
export function cellAlpha(progress: number): number {
  return Math.min(1, progress * ALPHA_RATE);
}
