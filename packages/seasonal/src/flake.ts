// flake.ts: draws one snowflake in white on black, in one of four forms. The effects sample this
// picture into character cells, so only coverage (how white a spot is) matters, not color.

import { clamp } from "./math.ts";

/** The four flake forms the gallery offers. */
export const FLAKE_SHAPES = ["dendrite", "fern", "fir", "sector"] as const;

/** One flake form. */
export type FlakeShape = (typeof FLAKE_SHAPES)[number];

/**
 * A side branch: where along the arm it starts (0 to 1 of the radius), how long it is, when in
 * the growth it appears (0 to 1), and which way it points (1 forward, -1 back toward the center).
 */
type Branch = readonly [at: number, length: number, appears: number, direction?: number];

/** Branches of the default dendrite: two short pairs. */
const DENDRITE_BRANCHES: readonly Branch[] = [
  [0.45, 0.22, 0.1],
  [0.72, 0.17, 0.5],
];

/** Fine side branches that shorten toward the tip, like a fern leaf. */
const FERN_BRANCHES: readonly Branch[] = [
  [0.22, 0.3, 0, 1],
  [0.4, 0.27, 0.12, 1],
  [0.57, 0.22, 0.28, 1],
  [0.72, 0.16, 0.45, 1],
  [0.86, 0.09, 0.65, 1],
];

/** Branches that point back toward the center, like the needles of a fir. */
const FIR_BRANCHES: readonly Branch[] = [
  [0.32, 0.14, 0, -1],
  [0.5, 0.16, 0.15, -1],
  [0.68, 0.16, 0.3, -1],
  [0.86, 0.14, 0.5, -1],
];

/**
 * Strokes six arms with side branches, grown to `g`.
 *
 * @param c - The context to draw on, in white.
 * @param cx - Center x.
 * @param cy - Center y.
 * @param radius - Length of an arm.
 * @param rot - Rotation in radians.
 * @param g - Growth from 0 (nothing) to 1 (full).
 * @param lw - Stroke width.
 * @param branches - The side branches of each arm.
 */
function drawArms(
  c: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  rot: number,
  g: number,
  lw: number,
  branches: readonly Branch[],
): void {
  c.save();
  c.translate(cx, cy);
  c.rotate(rot);
  c.lineCap = "round";
  c.strokeStyle = "#fff";
  c.fillStyle = "#fff";
  c.lineWidth = lw;
  for (let arm = 0; arm < 6; arm++) {
    c.save();
    c.rotate((arm * Math.PI) / 3);
    const len = radius * Math.min(1, g * 1.25);
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(len, 0);
    c.stroke();
    for (const [at, length, appears, direction = 1] of branches) {
      const x = radius * at;
      const gg = clamp(((g - appears) / (1 - appears)) * 1.1, 0, 1);
      if (gg <= 0 || len < x) continue;
      const l = length * radius * gg;
      c.beginPath();
      c.moveTo(x, 0);
      c.lineTo(x + direction * l * 0.6, l * 0.8);
      c.moveTo(x, 0);
      c.lineTo(x + direction * l * 0.6, -l * 0.8);
      c.stroke();
    }
    c.restore();
  }
  c.beginPath();
  c.arc(0, 0, lw * 1.3, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

/**
 * Draws one flake in white, grown to `g`.
 *
 * Side effects: draws on `c`; the context's state is restored.
 *
 * @param c - The context to draw on (a black picture; the flake is white).
 * @param cx - Center x.
 * @param cy - Center y.
 * @param radius - Length of an arm.
 * @param rot - Rotation in radians; the default form points an arm up at `-Math.PI / 2`.
 * @param g - Growth from 0 (nothing) to 1 (full).
 * @param shape - The form.
 */
export function drawFlake(
  c: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  rot: number,
  g: number,
  shape: FlakeShape,
): void {
  const lw = radius * 0.075;
  if (shape === "fern") {
    drawArms(c, cx, cy, radius, rot, g, lw * 0.8, FERN_BRANCHES);
  } else if (shape === "fir") {
    drawArms(c, cx, cy, radius, rot, g, lw * 0.9, FIR_BRANCHES);
  } else if (shape === "sector") {
    drawSector(c, cx, cy, radius, rot, g, lw);
  } else {
    drawArms(c, cx, cy, radius, rot, g, lw, DENDRITE_BRANCHES);
  }
}

/**
 * Arms that widen into a diamond near the tip, like a sectored plate.
 *
 * @param c - The context to draw on.
 * @param cx - Center x.
 * @param cy - Center y.
 * @param radius - Length of an arm.
 * @param rot - Rotation in radians.
 * @param g - Growth from 0 to 1.
 * @param lw - Stroke width.
 */
function drawSector(
  c: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  rot: number,
  g: number,
  lw: number,
): void {
  c.save();
  c.translate(cx, cy);
  c.rotate(rot);
  c.lineCap = "round";
  c.lineJoin = "round";
  c.strokeStyle = "#fff";
  c.fillStyle = "#fff";
  c.lineWidth = lw;
  const len = radius * Math.min(1, g * 1.25);
  const diamond = clamp((g - 0.3) / 0.7, 0, 1);
  for (let arm = 0; arm < 6; arm++) {
    c.save();
    c.rotate((arm * Math.PI) / 3);
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(len, 0);
    c.stroke();
    if (diamond > 0) {
      c.beginPath();
      c.moveTo(radius * 0.42, 0);
      c.lineTo(radius * 0.7, radius * 0.17 * diamond);
      c.lineTo(radius * 0.98, 0);
      c.lineTo(radius * 0.7, -radius * 0.17 * diamond);
      c.closePath();
      c.fill();
    }
    c.restore();
  }
  c.beginPath();
  c.arc(0, 0, lw * 2, 0, Math.PI * 2);
  c.fill();
  c.restore();
}
