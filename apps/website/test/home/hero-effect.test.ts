// Tests for src/home/hero-effect.ts: the effect exported from the playground.

import { parseSettings } from "@veilo-ui/core";
import { describe, expect, it } from "vitest";
import { HERO_SETTINGS } from "../../src/home/hero-effect.ts";

describe("HERO_SETTINGS", () => {
  it("is accepted by the engine exactly as exported: nothing ignored or clamped", () => {
    const { settings, applied } = parseSettings(HERO_SETTINGS);
    // `version` is not a setting to apply; every other key is, with its value unchanged.
    const keys = Object.keys(HERO_SETTINGS).filter((key) => key !== "version");
    expect([...applied].sort()).toEqual([...keys].sort());
    expect(settings).toMatchObject(HERO_SETTINGS);
  });

  it("is the looping shimmer with dots from random origins and rising text", () => {
    expect(HERO_SETTINGS).toMatchObject({
      effect: "shimmer",
      repeat: "loop",
      imageFx: "dots",
      origin: "random",
      textFx: "rise",
    });
  });
});
