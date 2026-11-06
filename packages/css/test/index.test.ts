// Tests for src/index.ts: the public API is a re-export of core, not a second copy.

import * as core from "@veilo/core/loader";
import { describe, expect, expectTypeOf, it } from "vitest";
import * as api from "../src/index.ts";
import type { LoaderCssOptions, Settings } from "../src/index.ts";

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
});
