/**
 * easing.ts: cubic-bezier solver (Newton's method, bisection fallback) and easing presets.
 * Layer 0 (pure). Must not import DOM code. Imports only types from schema/.
 */

import type { EASING_KEYS } from "../schema/ranges.ts";
import type { Settings } from "../schema/types.ts";

/** Name of an easing option, including `custom`. */
export type EasingKey = (typeof EASING_KEYS)[number];

/** The four numbers of a CSS `cubic-bezier(x1, y1, x2, y2)`. */
export type BezierCurve = readonly [x1: number, y1: number, x2: number, y2: number];

/** Maps linear progress to eased progress. */
export type EasingFunction = (p: number) => number;

/** Preset curves from the spec's easing table. `custom` reads its curve from the settings. */
export const EASING_CURVES: Readonly<Record<Exclude<EasingKey, "custom">, BezierCurve>> = {
  out: [0.22, 1, 0.36, 1],
  outSoft: [0.33, 1, 0.68, 1],
  inOut: [0.65, 0, 0.35, 1],
  in: [0.5, 0, 0.75, 0],
  linear: [0, 0, 1, 1],
  back: [0.34, 1.56, 0.64, 1],
};

// Accepted error in x. Tight, because steep curves turn a small x error into a large y error.
const TOLERANCE = 1e-9;
const NEWTON_STEPS = 8;
// Halving [0, 1] this many times narrows t to about 1e-12.
const BISECTION_STEPS = 40;

/**
 * Creates a function that evaluates a CSS cubic-bezier curve, as the canvas reveals need
 * the same result the browser computes for the CSS loaders.
 *
 * @param x1 - First control point x. Must be within 0 to 1, as in CSS.
 * @param y1 - First control point y. May leave 0 to 1 to overshoot.
 * @param x2 - Second control point x. Must be within 0 to 1, as in CSS.
 * @param y2 - Second control point y. May leave 0 to 1 to overshoot.
 * @returns A pure function. Input is limited to 0..1 (`NaN` counts as 0), while the output
 * is not limited, so effects can use the overshoot or clamp it themselves.
 */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): EasingFunction {
  // Control points on the diagonal make y equal x, so no solving is needed.
  if (x1 === y1 && x2 === y2) return (p) => Math.min(1, Math.max(0, p || 0));

  // Polynomial form of the Bezier with end points (0,0) and (1,1): a*t^3 + b*t^2 + c*t.
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;

  const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sampleSlopeX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  const sampleY = (t: number) => ((ay * t + by) * t + cy) * t;

  /** Finds the curve parameter t whose x is the given value. */
  const solveT = (x: number) => {
    let t = x;
    for (let step = 0; step < NEWTON_STEPS; step++) {
      const error = sampleX(t) - x;
      if (Math.abs(error) < TOLERANCE) return t;
      const slope = sampleSlopeX(t);
      // A flat spot would throw the next guess far away, so leave it to bisection.
      if (Math.abs(slope) < 1e-6) break;
      t -= error / slope;
    }

    // Newton can stall on steep curves. x only ever rises with t, so bisection always lands.
    let low = 0;
    let high = 1;
    t = x;
    for (let step = 0; step < BISECTION_STEPS; step++) {
      const error = sampleX(t) - x;
      if (Math.abs(error) < TOLERANCE) break;
      if (error > 0) high = t;
      else low = t;
      t = (low + high) / 2;
    }
    return t;
  };

  return (p) => {
    // Exact end points, so a finished reveal lands on 1 and not 0.9999999. `!(p > 0)` catches NaN.
    if (!(p > 0)) return 0;
    if (p >= 1) return 1;
    return sampleY(solveT(p));
  };
}

/**
 * Picks the easing for the loader or the reveal from the settings.
 *
 * @param settings - The settings to read.
 * @param target - `"l"` for the loader (`lEase`, `lx1`...) or `"r"` for the reveal (`rEase`, `rx1`...).
 * @returns The easing function. With `custom` it uses the curve stored in the settings.
 */
export function resolveEasing(settings: Settings, target: "l" | "r"): EasingFunction {
  const { lEase, lx1, ly1, lx2, ly2, rEase, rx1, ry1, rx2, ry2 } = settings;
  const key = target === "l" ? lEase : rEase;
  if (key !== "custom") return cubicBezier(...EASING_CURVES[key]);
  return target === "l" ? cubicBezier(lx1, ly1, lx2, ly2) : cubicBezier(rx1, ry1, rx2, ry2);
}
