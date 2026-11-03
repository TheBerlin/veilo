// text-windows.ts: when each text element animates during a reveal.
// Layer 1 (pure). Must not import DOM code.

import { clamp } from "../math/number.ts";

// Each element takes 55% of the reveal, and the last one finishes at 85%.
const WINDOW_LENGTH = 0.55;
const LAST_WINDOW_END = 0.85;

/**
 * Finds how far a text element is through its own window.
 *
 * Windows have a fixed length and their starts are evenly spaced, so the last element
 * always finishes at `p = 0.85`, however many elements there are.
 *
 * @param p - Reveal progress, from 0 to 1.
 * @param index - The element's position, where the first element is 0.
 * @param count - How many text elements animate, at least 1. A lone element starts at
 * `p = 0`, as there is nothing to space it from.
 * @returns The local progress `tp`, from 0 to 1, before the reveal easing is applied.
 */
export function textProgress(p: number, index: number, count: number): number {
  const spacing = count > 1 ? (LAST_WINDOW_END - WINDOW_LENGTH) / (count - 1) : 0;
  return clamp((p - index * spacing) / WINDOW_LENGTH);
}
