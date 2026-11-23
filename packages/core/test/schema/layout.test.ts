// Tests for src/schema/layout.ts: the layout JSON is read as safely as the settings.

import { describe, expect, it } from "vitest";
import { LAYOUT_VERSION, parseLayout, SLOT_ROLES } from "../../src/schema/layout.ts";
import { defaultSettings } from "../../src/schema/defaults.ts";

describe("parseLayout", () => {
  it("reads settings and slots", () => {
    const layout = parseLayout({
      version: 1,
      settings: { imageFx: "hex", cols: 40 },
      slots: { photo: { role: "image" }, title: { role: "text", lines: 2, width: 58 } },
    });
    expect(layout.version).toBe(LAYOUT_VERSION);
    expect([layout.settings.imageFx, layout.settings.cols]).toEqual(["hex", 40]);
    expect(layout.slots).toEqual({
      photo: { role: "image" },
      title: { role: "text", lines: 2, width: 58 },
    });
  });

  it("treats plain settings as a layout with no slots", () => {
    const layout = parseLayout({ imageFx: "mosaic" });
    expect(layout.settings.imageFx).toBe("mosaic");
    expect(layout.slots).toEqual({});
  });

  it.each([[null], [undefined], [3], ["{}"], [[]]])("gives defaults for %j", (input) => {
    expect(parseLayout(input)).toEqual({ version: 1, settings: defaultSettings(), slots: {} });
  });

  it("validates the settings inside like parseSettings", () => {
    const layout = parseLayout({ settings: { cols: 999, effect: "nope" }, slots: {} });
    expect([layout.settings.cols, layout.settings.effect]).toEqual([110, "shimmer"]);
  });

  it("clamps lines to 1..20 (whole) and width to 1..100", () => {
    const layout = parseLayout({
      slots: {
        a: { lines: 0, width: 0 },
        b: { lines: 2.6, width: 150 },
        c: { lines: 99, width: 33.5 },
      },
    });
    expect(layout.slots).toEqual({
      a: { lines: 1, width: 1 },
      b: { lines: 3, width: 100 },
      c: { lines: 20, width: 33.5 },
    });
  });

  it("drops unknown roles, wrong types and unknown fields", () => {
    const layout = parseLayout({
      slots: {
        a: { role: "video", lines: "2", width: Number.NaN, color: "red" },
        b: "text",
        c: null,
      },
    });
    expect(layout.slots).toEqual({ a: {}, b: {}, c: {} });
  });

  it("reports a newer layout version, or newer settings inside it, and still reads the layout", () => {
    const newerLayout = parseLayout({
      version: LAYOUT_VERSION + 1,
      settings: { imageFx: "mosaic" },
      slots: { photo: { role: "image" } },
    });
    expect(newerLayout.newerVersion).toBe(LAYOUT_VERSION + 1);
    expect(newerLayout.version).toBe(LAYOUT_VERSION);
    expect(newerLayout.slots.photo).toEqual({ role: "image" });
    expect(newerLayout.settings.imageFx).toBe("mosaic");
    expect(parseLayout({ settings: { version: 9 }, slots: {} }).newerVersion).toBe(9);
    expect(parseLayout({ version: 3, settings: { version: 9 } }).newerVersion).toBe(9);
  });

  it("reports nothing for a current, older or missing version", () => {
    expect("newerVersion" in parseLayout({ version: LAYOUT_VERSION, settings: {} })).toBe(false);
    expect("newerVersion" in parseLayout({ settings: {}, slots: {} })).toBe(false);
    expect("newerVersion" in parseLayout({})).toBe(false);
  });

  it("accepts every role", () => {
    for (const role of SLOT_ROLES)
      expect(parseLayout({ slots: { x: { role } } }).slots.x).toEqual({ role });
    expect(SLOT_ROLES).toEqual(["image", "text", "button", "block"]);
  });

  it("trims slot names and drops empty ones", () => {
    expect(parseLayout({ slots: { "  title ": {}, " ": {}, "": {} } }).slots).toEqual({
      title: {},
    });
  });

  it("ignores a slots value that is not an object", () => {
    expect(parseLayout({ slots: ["title"] }).slots).toEqual({});
  });

  it("keeps a __proto__ slot name as a plain slot", () => {
    const layout = parseLayout(JSON.parse('{"slots":{"__proto__":{"role":"text"}}}'));
    expect(Object.hasOwn(layout.slots, "__proto__")).toBe(true);
    expect(Object.getPrototypeOf(layout.slots)).toBe(Object.prototype);
    expect(({} as Record<string, unknown>).role).toBeUndefined();
  });

  it("does not change the input", () => {
    const input = { slots: { a: { lines: 99 } } };
    parseLayout(input);
    expect(input).toEqual({ slots: { a: { lines: 99 } } });
  });
});
