// Tests for src/math.ts: the hash, the noise and the easing the effects share.

import { describe, expect, it } from "vitest";
import { clamp, easeInOut, easeOut, hash, lerp, vnoise } from "../src/math.ts";

describe("hash", () => {
  it("returns the same number for the same input and stays within 0 to 1", () => {
    for (let i = 0; i < 200; i++) {
      const value = hash(i, i * 3, i * 7);
      expect(value).toBe(hash(i, i * 3, i * 7));
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }
  });

  it("changes when any of the three inputs changes", () => {
    const base = hash(5, 6, 7);
    expect(hash(6, 6, 7)).not.toBe(base);
    expect(hash(5, 7, 7)).not.toBe(base);
    expect(hash(5, 6, 8)).not.toBe(base);
  });

  it("spreads over the range instead of clustering", () => {
    let sum = 0;
    for (let i = 0; i < 2000; i++) sum += hash(i, 1, 1);
    expect(sum / 2000).toBeGreaterThan(0.4);
    expect(sum / 2000).toBeLessThan(0.6);
  });
});

describe("vnoise", () => {
  it("is smooth: a small step changes the value a little", () => {
    for (let x = 0; x < 10; x += 0.37) {
      expect(Math.abs(vnoise(x, 2.5) - vnoise(x + 0.01, 2.5))).toBeLessThan(0.05);
    }
  });

  it("stays within 0 to 1", () => {
    for (let i = 0; i < 300; i++) {
      const value = vnoise(i * 0.31, i * 0.17);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }
  });
});

describe("clamp, easing and lerp", () => {
  it("clamps to the range", () => {
    expect(clamp(-1, 0, 1)).toBe(0);
    expect(clamp(2, 0, 1)).toBe(1);
    expect(clamp(0.4, 0, 1)).toBe(0.4);
  });

  it("starts at 0, ends at 1 and clamps its input", () => {
    for (const ease of [easeOut, easeInOut]) {
      expect(ease(0)).toBe(0);
      expect(ease(1)).toBe(1);
      expect(ease(-3)).toBe(0);
      expect(ease(9)).toBe(1);
    }
  });

  it("eases out fast at the start and in-out slowly at both ends", () => {
    expect(easeOut(0.2)).toBeGreaterThan(0.2);
    expect(easeInOut(0.2)).toBeLessThan(0.2);
    expect(easeInOut(0.5)).toBeCloseTo(0.5);
  });

  it("interpolates linearly", () => {
    expect(lerp(10, 20, 0)).toBe(10);
    expect(lerp(10, 20, 0.5)).toBe(15);
    expect(lerp(10, 20, 1)).toBe(20);
  });
});
