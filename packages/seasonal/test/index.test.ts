// Tests for src/index.ts. Runs in Node, which also shows the entries can be imported on a server.

import { describe, expect, it } from "vitest";
import * as element from "../src/element.ts";
import * as api from "../src/index.ts";

describe("@veilo-ui/seasonal exports", () => {
  // An API change must update this list and the README.
  it("exports exactly the public API", () => {
    expect(Object.keys(api).sort()).toEqual([
      "EFFECT_IDS",
      "FLAKE_SHAPES",
      "REPLAY_PAUSE_MS",
      "loadEffectFonts",
      "mountEffect",
      "usesFlakeShape",
    ]);
    expect(Object.keys(element).sort()).toEqual(["SEASONAL_EFFECT_TAG", "defineSeasonalEffect"]);
  });

  it("can be imported with no browser: nothing touches window or document", () => {
    expect(typeof window).toBe("undefined");
    expect(typeof document).toBe("undefined");
    expect(api.EFFECT_IDS).toHaveLength(10);
  });

  it("resolves the font promise at once with no document", async () => {
    await expect(api.loadEffectFonts()).resolves.toBeUndefined();
  });

  it("knows which effects the flake form changes", () => {
    expect(api.usesFlakeShape("frost")).toBe(true);
    expect(api.usesFlakeShape("bars")).toBe(false);
    expect(api.usesFlakeShape("blizzard")).toBe(false);
  });
});
