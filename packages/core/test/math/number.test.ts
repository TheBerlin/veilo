// Tests for src/math/number.ts, with values worked out by hand from the formulas.

import { describe, expect, it } from "vitest";
import { clamp, cssNumber, lerp, smoothstep } from "../../src/math/number.ts";

describe("clamp", () => {
  it("defaults to the range 0 to 1", () => {
    expect(clamp(-0.5)).toBe(0);
    expect(clamp(0.5)).toBe(0.5);
    expect(clamp(1.5)).toBe(1);
  });

  it("uses a custom range", () => {
    expect(clamp(5, 10, 20)).toBe(10);
    expect(clamp(15, 10, 20)).toBe(15);
    expect(clamp(25, 10, 20)).toBe(20);
  });

  it("keeps the values at the limits", () => {
    expect(clamp(0)).toBe(0);
    expect(clamp(1)).toBe(1);
  });
});

describe("lerp", () => {
  it.each([
    [2.5, 1],
    [0.1, 0.7],
    [-3, 3],
  ])("lands exactly on both ends from %d to %d", (from, to) => {
    expect(lerp(from, to, 0)).toBe(from);
    expect(lerp(from, to, 1)).toBe(to);
  });

  it("finds the midpoint", () => {
    expect(lerp(2.5, 1, 0.5)).toBe(1.75);
  });

  it("passes overshoot through, as the back easing needs", () => {
    expect(lerp(0, 10, 1.2)).toBeCloseTo(12, 10);
    expect(lerp(0, 10, -0.1)).toBeCloseTo(-1, 10);
  });
});

describe("smoothstep", () => {
  it("is flat outside the edges", () => {
    expect(smoothstep(0, 1, -1)).toBe(0);
    expect(smoothstep(0, 1, 2)).toBe(1);
  });

  it("follows 3t^2 - 2t^3 between them", () => {
    expect(smoothstep(0, 1, 0.25)).toBe(0.15625);
    expect(smoothstep(0, 1, 0.5)).toBe(0.5);
    expect(smoothstep(0, 1, 0.75)).toBe(0.84375);
  });

  it("covers the spec's fade to the photo, from p = 0.8 to p = 1", () => {
    expect(smoothstep(0.8, 1, 0.8)).toBe(0);
    expect(smoothstep(0.8, 1, 0.9)).toBeCloseTo(0.5, 10);
    expect(smoothstep(0.8, 1, 1)).toBe(1);
  });
});

describe("cssNumber", () => {
  it("writes whole numbers and short decimals as they are", () => {
    expect(cssNumber(18)).toBe("18");
    expect(cssNumber(0.5)).toBe("0.5");
    expect(cssNumber(-1.25)).toBe("-1.25");
  });

  it("rounds to 4 decimals, hiding float noise", () => {
    expect(cssNumber(0.1 + 0.2)).toBe("0.3");
    expect(cssNumber(1.4000000000000001)).toBe("1.4");
    expect(cssNumber(1 / 3)).toBe("0.3333");
  });

  it("never writes -0", () => {
    expect(cssNumber(-0)).toBe("0");
    expect(cssNumber(-0.00001)).toBe("0");
  });
});
