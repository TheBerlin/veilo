// Tests for src/index.ts: the public API is a re-export of core, not a second copy.

import * as core from "@veilo/core/loader";
import { describe, expect, expectTypeOf, it } from "vitest";
import * as api from "../src/index.ts";
import type { LoaderCssOptions, Settings } from "../src/index.ts";
import { cssProblems } from "./support/parse-css.ts";

describe("@veilo/css public API", () => {
  it("exports exactly these values; changing the list is an API change", () => {
    expect(Object.keys(api).sort()).toEqual([
      "defaultSettings",
      "generateLoaderCss",
      "parseSettings",
    ]);
  });

  it("re-exports core's functions instead of copying them", () => {
    expect(api.generateLoaderCss).toBe(core.generateLoaderCss);
    expect(api.defaultSettings).toBe(core.defaultSettings);
    expect(api.parseSettings).toBe(core.parseSettings);
  });

  it("generates loader CSS in Node from plain JSON", () => {
    expect(typeof document).toBe("undefined");
    const { settings } = api.parseSettings({ effect: "pulse" });
    expect(api.generateLoaderCss(settings)).toContain("@keyframes veilo-pulse");
  });

  it("exports the types the functions use", () => {
    expectTypeOf(api.generateLoaderCss).parameter(0).toEqualTypeOf<Settings>();
    expectTypeOf(api.generateLoaderCss).parameter(1).toEqualTypeOf<LoaderCssOptions | undefined>();
  });

  // Every effect with both repeat modes, the easing presets and a custom curve, with and
  // without color overrides: the generator's output must always be valid CSS.
  const effects = ["shimmer", "wave", "pulse"] as const;
  const variants = [
    {},
    { repeat: "once" },
    { lEase: "inOut", angle: 0, lWidth: 60, lGap: 0 },
    { lEase: "custom", lx1: 0.1, ly1: 0.9, lx2: 0.2, ly2: 1 },
    { baseColor: "#27373c", highlightColor: "#3d5259", radius: 0 },
  ];
  it.each(effects.flatMap((effect) => variants.map((variant) => ({ effect, ...variant }))))(
    "generates CSS that parses cleanly for %o",
    (input) => {
      const { settings } = api.parseSettings(input);
      expect(cssProblems(api.generateLoaderCss(settings))).toEqual([]);
      const hex = { base: "#dcdcdc", highlight: "#f7f7f7", selector: ".card > .bar" };
      expect(cssProblems(api.generateLoaderCss(settings, hex))).toEqual([]);
    },
  );
});
