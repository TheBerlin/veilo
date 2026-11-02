import { describe, expect, it } from "vitest";
import { type BezierCurve, cubicBezier, EASING_CURVES, resolveEasing } from "./easing.ts";
import { defaultSettings } from "./settings/settings.ts";
import { EASING_KEYS } from "./settings/spec.ts";

/** Evaluates one axis of the Bezier directly from its definition, independent of the solver. */
const bezierAxis = (a: number, b: number, t: number) =>
  3 * (1 - t) ** 2 * t * a + 3 * (1 - t) * t ** 2 * b + t ** 3;

// Curves that are flat or vertical at an end, which is where Newton's method struggles.
const STEEP_CURVES: BezierCurve[] = [
  [0, 1, 0, 1],
  [1, 0, 1, 0],
  [0, 0, 0, 1],
  [1, 0, 1, 1],
  [0.99, 0.01, 0.99, 0.01],
];

const CURVES = [...Object.values(EASING_CURVES), ...STEEP_CURVES];
const STEPS = Array.from({ length: 49 }, (_, index) => (index + 1) / 50);

describe("EASING_CURVES", () => {
  it("covers every easing key except custom", () => {
    expect(Object.keys(EASING_CURVES).sort()).toEqual(
      EASING_KEYS.filter((key) => key !== "custom").sort(),
    );
  });

  it("matches the spec's easing table", () => {
    expect(EASING_CURVES).toEqual({
      out: [0.22, 1, 0.36, 1],
      outSoft: [0.33, 1, 0.68, 1],
      inOut: [0.65, 0, 0.35, 1],
      in: [0.5, 0, 0.75, 0],
      linear: [0, 0, 1, 1],
      back: [0.34, 1.56, 0.64, 1],
    });
  });
});

describe("cubicBezier", () => {
  it.each(CURVES)("hits exact end points for (%d, %d, %d, %d)", (x1, y1, x2, y2) => {
    const ease = cubicBezier(x1, y1, x2, y2);
    expect(ease(0)).toBe(0);
    expect(ease(1)).toBe(1);
  });

  it.each(CURVES)("lands on the curve for (%d, %d, %d, %d)", (x1, y1, x2, y2) => {
    const ease = cubicBezier(x1, y1, x2, y2);
    for (const t of STEPS) {
      const x = bezierAxis(x1, x2, t);
      expect(ease(x)).toBeCloseTo(bezierAxis(y1, y2, t), 3);
    }
  });

  it("returns linear input unchanged", () => {
    const ease = cubicBezier(...EASING_CURVES.linear);
    for (const p of STEPS) expect(ease(p)).toBe(p);
  });

  it("matches the known value of the CSS ease curve at the midpoint", () => {
    expect(cubicBezier(0.25, 0.1, 0.25, 1)(0.5)).toBeCloseTo(0.8024, 4);
  });

  it("puts a symmetric curve on 0.5 at the midpoint", () => {
    expect(cubicBezier(...EASING_CURVES.inOut)(0.5)).toBeCloseTo(0.5, 6);
  });

  it("keeps the overshoot of back", () => {
    const ease = cubicBezier(...EASING_CURVES.back);
    expect(Math.max(...STEPS.map(ease))).toBeGreaterThan(1);
  });

  it.each(CURVES)("treats out-of-range input as an end for (%d, %d, %d, %d)", (x1, y1, x2, y2) => {
    const ease = cubicBezier(x1, y1, x2, y2);
    expect(ease(-1)).toBe(0);
    expect(ease(2)).toBe(1);
    expect(ease(Number.NaN)).toBe(0);
  });

  it("limits input on the linear shortcut too", () => {
    const ease = cubicBezier(...EASING_CURVES.linear);
    expect(ease(-1)).toBe(0);
    expect(ease(2)).toBe(1);
    expect(ease(Number.NaN)).toBe(0);
  });

  it("gives the same result on repeated calls", () => {
    const ease = cubicBezier(...EASING_CURVES.out);
    expect(ease(0.3)).toBe(ease(0.3));
  });
});

describe("resolveEasing", () => {
  it("uses the default curve of each target", () => {
    const settings = defaultSettings();
    expect(resolveEasing(settings, "l")(0.4)).toBe(cubicBezier(...EASING_CURVES.out)(0.4));
    expect(resolveEasing(settings, "r")(0.4)).toBe(cubicBezier(...EASING_CURVES.outSoft)(0.4));
  });

  it("reads each target's own preset", () => {
    const settings = { ...defaultSettings(), lEase: "in", rEase: "back" } as const;
    expect(resolveEasing(settings, "l")(0.4)).toBe(cubicBezier(...EASING_CURVES.in)(0.4));
    expect(resolveEasing(settings, "r")(0.4)).toBe(cubicBezier(...EASING_CURVES.back)(0.4));
  });

  it("reads the loader's custom curve for the loader", () => {
    const settings = {
      ...defaultSettings(),
      lEase: "custom",
      lx1: 0.1,
      ly1: 0.2,
      lx2: 0.3,
      ly2: 0.9,
    } as const;
    expect(resolveEasing(settings, "l")(0.4)).toBe(cubicBezier(0.1, 0.2, 0.3, 0.9)(0.4));
  });

  it("reads the reveal's custom curve for the reveal", () => {
    const settings = {
      ...defaultSettings(),
      rEase: "custom",
      rx1: 0.4,
      ry1: 0.1,
      rx2: 0.8,
      ry2: 0.7,
    } as const;
    expect(resolveEasing(settings, "r")(0.4)).toBe(cubicBezier(0.4, 0.1, 0.8, 0.7)(0.4));
  });

  it("ignores stored curve points while a preset is selected", () => {
    const settings = { ...defaultSettings(), lx1: 0.9, ly1: 0.1 };
    expect(resolveEasing(settings, "l")(0.4)).toBe(cubicBezier(...EASING_CURVES.out)(0.4));
  });
});
