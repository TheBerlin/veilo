// Tests for src/schema/types.ts. The file holds only types, so these are type checks:
// `pnpm typecheck` fails when one is wrong, and at run time they only confirm the file loads.

import { describe, expectTypeOf, it } from "vitest";
import type { ColorKey, SettingKey, Settings } from "../../src/schema/types.ts";

describe("Settings", () => {
  it("types numeric settings as numbers", () => {
    expectTypeOf<Settings["cols"]>().toEqualTypeOf<number>();
    expectTypeOf<Settings["rDur"]>().toEqualTypeOf<number>();
  });

  it("types option settings as the union of their options", () => {
    expectTypeOf<Settings["origin"]>().toEqualTypeOf<
      "left" | "right" | "top" | "bottom" | "center" | "diagonal" | "random"
    >();
    expectTypeOf<Settings["unit"]>().toEqualTypeOf<"char" | "word">();
    expectTypeOf<Settings["lEase"]>().toEqualTypeOf<
      "out" | "outSoft" | "inOut" | "in" | "linear" | "back" | "custom"
    >();
  });

  it("fixes the version to the current one", () => {
    expectTypeOf<Settings["version"]>().toEqualTypeOf<1>();
  });

  it("makes the color overrides optional strings", () => {
    expectTypeOf<Settings["baseColor"]>().toEqualTypeOf<string | undefined>();
    expectTypeOf<Settings>().toHaveProperty("highlightColor");
  });
});

describe("keys", () => {
  it("names every table key and the two colors", () => {
    expectTypeOf<"cols" | "hold" | "effect">().toExtend<SettingKey>();
    expectTypeOf<ColorKey>().toEqualTypeOf<"baseColor" | "highlightColor">();
  });

  it("does not include the version or the colors in the table keys", () => {
    expectTypeOf<"version">().not.toExtend<SettingKey>();
    expectTypeOf<"baseColor">().not.toExtend<SettingKey>();
  });
});
