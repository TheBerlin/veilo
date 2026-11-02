// Tests for src/grid/cell-timeline.ts, with values worked out by hand from the spec's formulas.

import { describe, expect, it } from "vitest";
import { cellAlpha, cellProgress, cellScale } from "../../src/grid/cell-timeline.ts";
import { cubicBezier, EASING_CURVES } from "../../src/math/easing.ts";
import { SETTINGS_SPEC } from "../../src/schema/ranges.ts";

const linear = (t: number) => t;

// Every value the spread control can produce, from 0.1 to 0.9 in steps of 0.05.
const { min, max, step } = SETTINGS_SPEC.spread;
const SPREADS = Array.from(
  { length: Math.round((max - min) / step) + 1 },
  (_, index) => min + index * step,
);

describe("cellProgress", () => {
  it("follows (gp - order x spread) / (1 - spread)", () => {
    expect(cellProgress(0.5, 0.5, 0.6)).toBeCloseTo(0.5, 10);
    expect(cellProgress(0.4, 0.25, 0.5)).toBeCloseTo(0.55, 10);
  });

  it("leaves a cell undrawn until its start, at order x spread", () => {
    expect(cellProgress(0.29, 0.5, 0.6)).toBe(0);
    expect(cellProgress(0.3, 0.5, 0.6)).toBeCloseTo(0, 10);
    expect(cellProgress(0.31, 0.5, 0.6)).toBeGreaterThan(0);
  });

  it("leaves the first cell undrawn at gp = 0", () => {
    expect(cellProgress(0, 0, 0.6)).toBe(0);
  });

  it("limits the result to 1 once a cell has finished", () => {
    expect(cellProgress(0.6, 0, 0.6)).toBe(1);
  });

  it.each(SPREADS)("finishes every cell by gp = 1 with spread %d", (spread) => {
    for (const order of [0, 0.25, 0.5, 0.75, 1]) {
      expect(cellProgress(1, order, spread)).toBe(1);
    }
  });

  it("starts cells further apart with a higher spread", () => {
    expect(cellProgress(0.2, 0.5, 0.2)).toBeGreaterThan(0);
    expect(cellProgress(0.2, 0.5, 0.8)).toBe(0);
  });

  it("makes each cell animate for a shorter time with a higher spread", () => {
    const steps = Array.from({ length: 101 }, (_, index) => index / 100);
    const animatedSteps = (spread: number) =>
      steps.filter((gp) => {
        const progress = cellProgress(gp, 0, spread);
        return progress > 0 && progress < 1;
      }).length;
    expect(animatedSteps(0.8)).toBeLessThan(animatedSteps(0.2));
  });

  it("never moves backward as the grid plays", () => {
    let previous = 0;
    for (let gp = 0; gp <= 1; gp += 0.01) {
      const progress = cellProgress(gp, 0.7, 0.6);
      expect(progress).toBeGreaterThanOrEqual(previous);
      previous = progress;
    }
  });
});

describe("cellScale", () => {
  it("runs from startScale to exactly 1", () => {
    expect(cellScale(0, 2.5, linear)).toBe(2.5);
    expect(cellScale(1, 2.5, linear)).toBe(1);
  });

  it("interpolates by eased progress", () => {
    expect(cellScale(0.5, 2.5, linear)).toBe(1.75);
    expect(cellScale(0.5, 2.5, () => 0.8)).toBeCloseTo(1.3, 10);
  });

  it("stays at 1 when startScale is 1", () => {
    expect(cellScale(0.5, 1, linear)).toBe(1);
  });

  it("dips below 1 with the back easing's overshoot", () => {
    const ease = cubicBezier(...EASING_CURVES.back);
    const scales = Array.from({ length: 99 }, (_, index) =>
      cellScale((index + 1) / 100, 2.5, ease),
    );
    expect(Math.min(...scales)).toBeLessThan(1);
    expect(cellScale(1, 2.5, ease)).toBe(1);
  });
});

describe("cellAlpha", () => {
  it("follows min(1, l x 4)", () => {
    expect(cellAlpha(0)).toBe(0);
    expect(cellAlpha(0.125)).toBe(0.5);
    expect(cellAlpha(0.25)).toBe(1);
    expect(cellAlpha(0.5)).toBe(1);
    expect(cellAlpha(1)).toBe(1);
  });
});
