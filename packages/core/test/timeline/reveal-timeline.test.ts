// Tests for src/timeline/reveal-timeline.ts, from the spec's grid timeline and photo fade.

import { describe, expect, it } from "vitest";
import { effectOpacity, gridProgress, photoOpacity } from "../../src/timeline/reveal-timeline.ts";

describe("gridProgress", () => {
  it("follows p / 0.8", () => {
    expect(gridProgress(0)).toBe(0);
    expect(gridProgress(0.2)).toBeCloseTo(0.25, 10);
    expect(gridProgress(0.4)).toBeCloseTo(0.5, 10);
  });

  it("finishes at p = 0.8 and holds", () => {
    expect(gridProgress(0.8)).toBe(1);
    expect(gridProgress(0.9)).toBe(1);
    expect(gridProgress(1)).toBe(1);
  });
});

describe("photoOpacity", () => {
  it("stays hidden until p = 0.8", () => {
    expect(photoOpacity(0)).toBe(0);
    expect(photoOpacity(0.5)).toBe(0);
    expect(photoOpacity(0.8)).toBe(0);
  });

  it("follows a smoothstep from p = 0.8 to p = 1", () => {
    expect(photoOpacity(0.85)).toBeCloseTo(0.15625, 10);
    expect(photoOpacity(0.9)).toBeCloseTo(0.5, 10);
    expect(photoOpacity(0.95)).toBeCloseTo(0.84375, 10);
  });

  it("is fully shown at p = 1", () => {
    expect(photoOpacity(1)).toBe(1);
  });
});

describe("effectOpacity", () => {
  it("is fully shown until p = 0.8", () => {
    expect(effectOpacity(0)).toBe(1);
    expect(effectOpacity(0.8)).toBe(1);
  });

  it("is exactly 0 at p = 1, where the layer clears", () => {
    expect(effectOpacity(1)).toBe(0);
  });

  it("always adds up to 1 with the photo", () => {
    for (let p = 0; p <= 1; p += 0.01) {
      expect(effectOpacity(p) + photoOpacity(p)).toBeCloseTo(1, 10);
    }
  });
});
