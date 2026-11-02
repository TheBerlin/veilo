// Tests for src/timeline/text-windows.ts, from the spec's text timeline.

import { describe, expect, it } from "vitest";
import { textProgress } from "../../src/timeline/text-windows.ts";

// The spec says 7 elements but lists 6, so both must meet its timing rules.
const COUNTS = [2, 3, 6, 7, 12];

describe("textProgress", () => {
  it("uses windows of 0.55, spaced 0.05 apart for 7 elements", () => {
    expect(textProgress(0.275, 0, 7)).toBeCloseTo(0.5, 10);
    expect(textProgress(0.375, 2, 7)).toBeCloseTo(0.5, 10);
    expect(textProgress(0.575, 6, 7)).toBeCloseTo(0.5, 10);
  });

  it("spaces 6 elements 0.06 apart", () => {
    expect(textProgress(0.395, 2, 6)).toBeCloseTo(0.5, 10);
    expect(textProgress(0.575, 5, 6)).toBeCloseTo(0.5, 10);
  });

  it.each(COUNTS)("starts the first of %d elements at p = 0", (count) => {
    expect(textProgress(0, 0, count)).toBe(0);
    expect(textProgress(0.001, 0, count)).toBeGreaterThan(0);
  });

  it.each(COUNTS)("finishes the first of %d elements at p = 0.55", (count) => {
    expect(textProgress(0.55, 0, count)).toBeCloseTo(1, 10);
  });

  it.each(COUNTS)("starts the last of %d elements at p = 0.3", (count) => {
    expect(textProgress(0.29, count - 1, count)).toBe(0);
    expect(textProgress(0.31, count - 1, count)).toBeGreaterThan(0);
  });

  it.each(COUNTS)("finishes the last of %d elements at p = 0.85", (count) => {
    expect(textProgress(0.84, count - 1, count)).toBeLessThan(1);
    expect(textProgress(0.85, count - 1, count)).toBeCloseTo(1, 10);
  });

  it.each(COUNTS)("has every one of %d elements finished at p = 1", (count) => {
    for (let index = 0; index < count; index++) {
      expect(textProgress(1, index, count)).toBe(1);
    }
  });

  it("holds each element at 0 before its window", () => {
    expect(textProgress(0.04, 1, 7)).toBe(0);
  });

  it("runs elements in reading order", () => {
    for (let index = 1; index < 7; index++) {
      expect(textProgress(0.4, index, 7)).toBeLessThan(textProgress(0.4, index - 1, 7));
    }
  });

  it("starts a lone element at p = 0, with no division by zero", () => {
    expect(textProgress(0, 0, 1)).toBe(0);
    expect(textProgress(0.275, 0, 1)).toBeCloseTo(0.5, 10);
    expect(textProgress(1, 0, 1)).toBe(1);
  });
});
