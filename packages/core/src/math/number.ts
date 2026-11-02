/**
 * number.ts: small numeric helpers shared by the timelines and renderers.
 * Layer 0 (pure). Must not import DOM code.
 */

/**
 * Limits a value to a range.
 *
 * @param value - The value to limit. `NaN` stays `NaN`.
 * @param min - Lower limit, 0 by default.
 * @param max - Upper limit, 1 by default.
 * @returns The value, moved to the nearest limit when outside the range.
 */
export function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Interpolates between two values.
 *
 * @param from - The result at `t = 0`.
 * @param to - The result at `t = 1`.
 * @param t - Position between them. Not limited, so overshoot easing carries through.
 * @returns The interpolated value.
 */
export function lerp(from: number, to: number, t: number): number {
  // This form lands exactly on `to` at t = 1, where `from + (to - from) * t` can drift.
  return from * (1 - t) + to * t;
}

/**
 * Hermite smoothstep between two edges: 0 at or below `edge0`, 1 at or above `edge1`.
 *
 * @param edge0 - Where the curve starts. Must be below `edge1`.
 * @param edge1 - Where the curve ends.
 * @param x - The input value.
 * @returns The smoothed position, from 0 to 1.
 */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}
