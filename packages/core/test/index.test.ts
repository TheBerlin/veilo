// Tests for src/index.ts: the public API is exactly what the README documents.
// Runs in Node, which also shows the entry point loads without a browser (server rendering).

import { describe, expect, expectTypeOf, it } from "vitest";
import * as api from "../src/index.ts";
import type {
  ColorKey,
  LoaderCssOptions,
  ParsedSettings,
  Reveal,
  RevealEvents,
  RevealOptions,
  RevealState,
  RevealTargets,
  Scheduler,
  SettingKey,
  Settings,
  Skeleton,
  SkeletonOptions,
} from "../src/index.ts";

describe("@veilo/core public API", () => {
  it("exports exactly these values; changing the list is an API change", () => {
    expect(Object.keys(api).sort()).toEqual([
      "SETTINGS_VERSION",
      "createReveal",
      "createSkeleton",
      "defaultSettings",
      "generateLoaderCss",
      "parseSettings",
      "settingsJsonSchema",
    ]);
  });

  it("loads without a browser and works with plain JSON there", () => {
    expect(typeof document).toBe("undefined");
    const { settings } = api.parseSettings({ effect: "pulse", lDur: 99 });
    expect(settings.lDur).toBe(4);
    expect(api.generateLoaderCss(settings)).toContain("@keyframes veilo-pulse");
    expect(api.defaultSettings().version).toBe(api.SETTINGS_VERSION);
    expect(api.settingsJsonSchema()).toHaveProperty("properties");
  });

  it("exports the types the functions use", () => {
    expectTypeOf(api.createReveal).parameter(0).toEqualTypeOf<RevealTargets>();
    expectTypeOf(api.createReveal).parameter(2).toEqualTypeOf<RevealOptions | undefined>();
    expectTypeOf(api.createReveal).returns.toEqualTypeOf<Reveal>();
    expectTypeOf<Reveal["state"]>().toEqualTypeOf<RevealState>();
    expectTypeOf<RevealEvents["progress"]>().toEqualTypeOf<[p: number]>();
    expectTypeOf<NonNullable<RevealOptions["scheduler"]>>().toEqualTypeOf<Scheduler>();
    expectTypeOf(api.createSkeleton).parameter(2).toEqualTypeOf<SkeletonOptions | undefined>();
    expectTypeOf(api.createSkeleton).returns.toEqualTypeOf<Skeleton>();
    expectTypeOf(api.generateLoaderCss).parameter(1).toEqualTypeOf<LoaderCssOptions | undefined>();
    expectTypeOf(api.parseSettings).returns.toEqualTypeOf<ParsedSettings>();
    expectTypeOf(api.defaultSettings).returns.toEqualTypeOf<Settings>();
    expectTypeOf<"cols">().toExtend<SettingKey>();
    expectTypeOf<"baseColor">().toExtend<ColorKey>();
  });
});
