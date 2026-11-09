// Tests for src/loader-entry.ts: the `@veilo/core/loader` entry exports exactly the browser-free
// loader and settings helpers. Runs in Node.

import { describe, expect, it } from "vitest";
import * as loader from "../src/loader-entry.ts";
import * as main from "../src/index.ts";

describe("@veilo/core/loader", () => {
  it("exports exactly these values; changing the list is an API change", () => {
    expect(Object.keys(loader).sort()).toEqual([
      "EASING_CURVES",
      "SETTINGS_VERSION",
      "defaultSettings",
      "generateLoaderCss",
      "parseSettings",
      "settingsJsonSchema",
    ]);
  });

  it("exports the same functions as the main entry, not copies", () => {
    for (const name of Object.keys(loader) as (keyof typeof loader)[]) {
      expect(loader[name]).toBe(main[name]);
    }
  });

  it("works without a browser", () => {
    expect(typeof document).toBe("undefined");
    expect(loader.generateLoaderCss(loader.defaultSettings())).toContain("@keyframes veilo-sweep");
  });
});
