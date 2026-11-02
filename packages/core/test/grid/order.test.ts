// Tests for src/grid/order.ts, from the spec's cell order table.

import { describe, expect, it } from "vitest";
import { cellOrder, type Origin } from "../../src/grid/order.ts";
import { createRandom } from "../../src/math/random.ts";
import { SETTINGS_SPEC } from "../../src/schema/ranges.ts";

const ORIGINS: readonly Origin[] = SETTINGS_SPEC.origin.options;

/** Reads one cell of a grid laid out row by row. */
const cell = (order: Float64Array, cols: number, col: number, row: number) =>
  order[row * cols + col] as number;

/** The spec's center distance term for a cell, with no jitter. */
const centerSpread = (u: number, v: number) => (Math.hypot(u - 0.5, v - 0.5) / 0.7071) * 0.85;

describe("cellOrder layout", () => {
  it.each(ORIGINS)("has one value per cell for %s", (origin) => {
    expect(cellOrder(4, 3, origin)).toHaveLength(12);
  });

  it.each(ORIGINS)("stays within 0 to 1 for %s, even on the largest grid", (origin) => {
    for (const value of cellOrder(110, 110, origin)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }
  });

  it.each(ORIGINS)("gives the same result every time for %s", (origin) => {
    expect(cellOrder(16, 9, origin)).toEqual(cellOrder(16, 9, origin));
  });

  it.each(ORIGINS)("has no gaps on a single row or column for %s", (origin) => {
    expect(cellOrder(1, 1, origin).every(Number.isFinite)).toBe(true);
    expect(cellOrder(8, 1, origin).every(Number.isFinite)).toBe(true);
    expect(cellOrder(1, 8, origin).every(Number.isFinite)).toBe(true);
  });
});

describe("cellOrder origins", () => {
  it("left: follows u, with whole columns together", () => {
    const order = cellOrder(5, 3, "left");
    for (let row = 0; row < 3; row++) {
      expect([0, 1, 2, 3, 4].map((col) => cell(order, 5, col, row))).toEqual([
        0, 0.25, 0.5, 0.75, 1,
      ]);
    }
  });

  it("right: follows 1 - u", () => {
    const order = cellOrder(5, 3, "right");
    expect([0, 1, 2, 3, 4].map((col) => cell(order, 5, col, 1))).toEqual([1, 0.75, 0.5, 0.25, 0]);
  });

  it("top: follows v, with whole rows together", () => {
    const order = cellOrder(3, 5, "top");
    for (let col = 0; col < 3; col++) {
      expect([0, 1, 2, 3, 4].map((row) => cell(order, 3, col, row))).toEqual([
        0, 0.25, 0.5, 0.75, 1,
      ]);
    }
  });

  it("bottom: follows 1 - v", () => {
    const order = cellOrder(3, 5, "bottom");
    expect([0, 1, 2, 3, 4].map((row) => cell(order, 3, 1, row))).toEqual([1, 0.75, 0.5, 0.25, 0]);
  });

  it("diagonal: follows (u + v) / 2", () => {
    const order = cellOrder(5, 5, "diagonal");
    expect(cell(order, 5, 0, 0)).toBe(0);
    expect(cell(order, 5, 4, 0)).toBe(0.5);
    expect(cell(order, 5, 0, 4)).toBe(0.5);
    expect(cell(order, 5, 2, 2)).toBe(0.5);
    expect(cell(order, 5, 4, 4)).toBe(1);
  });

  it("center: applies the spec's formula with seed 7 jitter, cell by cell", () => {
    const random = createRandom();
    const order = cellOrder(5, 3, "center");
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 5; col++) {
        const expected = centerSpread(col / 4, row / 2) + random() * 0.15;
        expect(cell(order, 5, col, row)).toBeCloseTo(Math.min(1, expected), 12);
      }
    }
  });

  it("center: keeps jitter within 0.15 of the distance term", () => {
    const order = cellOrder(21, 21, "center");
    for (let row = 0; row < 21; row++) {
      for (let col = 0; col < 21; col++) {
        const jitter = cell(order, 21, col, row) - centerSpread(col / 20, row / 20);
        expect(jitter).toBeGreaterThanOrEqual(-1e-9);
        expect(jitter).toBeLessThan(0.15);
      }
    }
  });

  it("center: starts in the middle and ends at the corners", () => {
    const order = cellOrder(21, 21, "center");
    expect(cell(order, 21, 10, 10)).toBeLessThan(0.15);
    expect(cell(order, 21, 0, 0)).toBeGreaterThanOrEqual(0.85);
    expect(cell(order, 21, 20, 20)).toBeGreaterThanOrEqual(0.85);
  });

  it("center: treats a non-square grid by position, not by cell count", () => {
    const order = cellOrder(21, 5, "center");
    expect(cell(order, 21, 10, 2)).toBeLessThan(0.15);
    expect(cell(order, 21, 0, 0)).toBeGreaterThanOrEqual(0.85);
  });

  it("random: uses the seed 7 sequence, cell by cell", () => {
    const random = createRandom();
    const expected = Array.from({ length: 12 }, () => random());
    expect([...cellOrder(4, 3, "random")]).toEqual(expected);
  });

  it("random: is not sorted by position", () => {
    const order = [...cellOrder(16, 16, "random")];
    const sorted = [...order].sort((a, b) => a - b);
    expect(order).not.toEqual(sorted);
  });
});
