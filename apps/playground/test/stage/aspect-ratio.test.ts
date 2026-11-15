// Tests for src/stage/aspect-ratio.ts, in Node.

import { describe, expect, it } from "vitest";
import {
  ASPECT_RATIOS,
  DEFAULT_RATIO,
  OWN_RATIO_LIMITS,
  ratioValue,
  toRatioId,
} from "../../src/stage/aspect-ratio.ts";

describe("aspect ratios", () => {
  it("offer the agreed shapes, square first and by default", () => {
    expect(ASPECT_RATIOS.map((ratio) => ratio.id)).toEqual([
      "1:1",
      "4:3",
      "3:2",
      "16:9",
      "3:4",
      "2:3",
      "image",
    ]);
    expect(DEFAULT_RATIO).toBe("1:1");
  });

  it("give width over height for each fixed shape", () => {
    expect(ratioValue("1:1", null)).toBe(1);
    expect(ratioValue("16:9", null)).toBeCloseTo(16 / 9);
    expect(ratioValue("2:3", { width: 10, height: 10 })).toBeCloseTo(2 / 3);
  });

  it("follow the image for Image's own, square for the drawn placeholder", () => {
    expect(ratioValue("image", { width: 640, height: 480 })).toBeCloseTo(4 / 3);
    expect(ratioValue("image", null)).toBe(1);
    expect(ratioValue("image", { width: 0, height: 10 })).toBe(1);
  });

  it("keep an image's own ratio between 1:3 and 3:1", () => {
    expect(ratioValue("image", { width: 4000, height: 400 })).toBe(OWN_RATIO_LIMITS.max);
    expect(ratioValue("image", { width: 300, height: 3000 })).toBe(OWN_RATIO_LIMITS.min);
  });

  it("narrow saved values to a known id", () => {
    expect(toRatioId("16:9")).toBe("16:9");
    expect(toRatioId("image")).toBe("image");
    for (const value of ["5:4", "", null, 1, undefined]) expect(toRatioId(value)).toBeUndefined();
  });
});
