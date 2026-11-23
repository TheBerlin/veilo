// math.ts: the small numeric helpers the seasonal effects share: a seeded hash, smooth noise, easing.

/**
 * A deterministic hash of three integers, in 0 to 1. A frame that uses it depends only on its
 * time, so the same time always draws the same picture.
 *
 * @param x - First integer (a column, for example).
 * @param y - Second integer (a row).
 * @param z - Third integer (a time step or a salt).
 * @returns A number from 0 up to and including 1.
 */
export function hash(x: number, y: number, z: number): number {
  let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(z | 0, 2147483629);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

/**
 * Smooth two-dimensional value noise, built from {@link hash}.
 *
 * @param x - Horizontal position; its fraction blends between lattice points.
 * @param y - Vertical position.
 * @returns A number from 0 to 1.
 */
export function vnoise(x: number, y: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi, 1);
  const b = hash(xi + 1, yi, 1);
  const c = hash(xi, yi + 1, 1);
  const d = hash(xi + 1, yi + 1, 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

/**
 * Limits a number to a range.
 *
 * @param v - The number.
 * @param lo - The lowest allowed value.
 * @param hi - The highest allowed value.
 * @returns `v`, or the nearest limit.
 */
export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/**
 * Cubic ease-out: a fast start and a soft landing.
 *
 * @param x - Progress, clamped to 0 to 1.
 * @returns The eased progress, 0 to 1.
 */
export function easeOut(x: number): number {
  return 1 - Math.pow(1 - clamp(x, 0, 1), 3);
}

/**
 * Cubic ease-in-out: slow at both ends.
 *
 * @param x - Progress, clamped to 0 to 1.
 * @returns The eased progress, 0 to 1.
 */
export function easeInOut(x: number): number {
  const t = clamp(x, 0, 1);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Linear interpolation.
 *
 * @param a - The value at `k = 0`.
 * @param b - The value at `k = 1`.
 * @param k - The blend, usually 0 to 1.
 * @returns The blended value.
 */
export function lerp(a: number, b: number, k: number): number {
  return a + (b - a) * k;
}
