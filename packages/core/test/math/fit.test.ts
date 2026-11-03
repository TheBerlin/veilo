// Tests for src/math/fit.ts, against what CSS object-fit: cover shows.

import { describe, expect, it } from "vitest";
import { coverCrop } from "../../src/math/fit.ts";

describe("coverCrop", () => {
  it("uses the whole source when the shapes match", () => {
    expect(coverCrop(400, 200, 100, 50)).toEqual({ x: 0, y: 0, width: 400, height: 200 });
  });

  it("cuts the sides of a wide source equally", () => {
    expect(coverCrop(400, 200, 100, 100)).toEqual({ x: 100, y: 0, width: 200, height: 200 });
  });

  it("cuts the top and bottom of a tall source equally", () => {
    expect(coverCrop(200, 600, 300, 300)).toEqual({ x: 0, y: 200, width: 200, height: 200 });
  });

  it("works when the source is smaller than the box", () => {
    expect(coverCrop(50, 100, 200, 200)).toEqual({ x: 0, y: 25, width: 50, height: 50 });
  });
});
