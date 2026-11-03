// Tests for src/render/grid-style.ts.

import { describe, expect, it } from "vitest";
import { isGridStyle } from "../../src/render/grid-style.ts";
import type { Settings } from "../../src/schema/types.ts";

describe("isGridStyle", () => {
  it("is true for the four grid effects only", () => {
    const all: Settings["imageFx"][] = [
      "dots",
      "hex",
      "binary",
      "mosaic",
      "blur",
      "crossfade",
      "wipe",
      "zoom",
    ];
    expect(all.filter(isGridStyle)).toEqual(["dots", "hex", "binary", "mosaic"]);
  });
});
