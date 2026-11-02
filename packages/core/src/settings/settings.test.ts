import { describe, expect, it } from "vitest";
import { defaultSettings, parseSettings } from "./settings.ts";
import { SETTINGS_SPEC, SETTINGS_VERSION } from "./spec.ts";

// Copied from the spec, section 1.6 (example settings JSON).
const SPEC_EXAMPLE = {
  effect: "shimmer",
  lDur: 1.2,
  lGap: 0.2,
  lEase: "out",
  lx1: 0.22,
  ly1: 1,
  lx2: 0.36,
  ly2: 1,
  repeat: "loop",
  stagger: 0.12,
  angle: 100,
  lWidth: 30,
  depth: 0.5,
  radius: 6,
  imageFx: "dots",
  origin: "left",
  cols: 64,
  startScale: 2.5,
  spread: 0.6,
  textFx: "scramble",
  charset: "dots",
  unit: "char",
  rDur: 1.04,
  rEase: "outSoft",
  rx1: 0.33,
  ry1: 1,
  rx2: 0.68,
  ry2: 1,
  hold: 1.2,
};

const entries = Object.entries(SETTINGS_SPEC);
const numberRows = entries.filter(([, entry]) => entry.kind === "number");

describe("defaultSettings", () => {
  it("matches the spec's example JSON plus the version", () => {
    expect(defaultSettings()).toEqual({ version: SETTINGS_VERSION, ...SPEC_EXAMPLE });
  });

  it("returns a new object each time", () => {
    expect(defaultSettings()).not.toBe(defaultSettings());
  });

  it("keeps every default inside its own range or options", () => {
    for (const [, entry] of entries) {
      if (entry.kind === "number") {
        expect(entry.default).toBeGreaterThanOrEqual(entry.min);
        expect(entry.default).toBeLessThanOrEqual(entry.max);
      } else {
        expect(entry.options).toContain(entry.default);
      }
    }
  });
});

describe("parseSettings", () => {
  it("round-trips the defaults", () => {
    const { settings, applied } = parseSettings(defaultSettings());
    expect(settings).toEqual(defaultSettings());
    expect(applied).toHaveLength(entries.length);
  });

  it("uses a valid number and option and fills in the rest", () => {
    const { settings, applied } = parseSettings({ lDur: 2, effect: "wave" });
    expect(settings).toEqual({ ...defaultSettings(), lDur: 2, effect: "wave" });
    expect(applied).toEqual(["effect", "lDur"]);
  });

  it.each(numberRows)("clamps %s at both ends", (key, entry) => {
    if (entry.kind !== "number") throw new Error("number rows only");
    const low = parseSettings({ [key]: entry.min - 1 });
    const high = parseSettings({ [key]: entry.max + 1 });
    expect(low.settings).toMatchObject({ [key]: entry.min });
    expect(high.settings).toMatchObject({ [key]: entry.max });
    // A clamped value was still applied.
    expect(low.applied).toEqual([key]);
    expect(high.applied).toEqual([key]);
  });

  it("keeps in-range values that are off the step grid", () => {
    expect(parseSettings({ lDur: 1.234 }).settings.lDur).toBe(1.234);
  });

  it("ignores unknown keys", () => {
    const { settings, applied } = parseSettings({ nope: 1 });
    expect(settings).toEqual(defaultSettings());
    expect(applied).toEqual([]);
  });

  it.each([
    ["a string for a number", { lDur: "2" }],
    ["NaN", { lDur: Number.NaN }],
    ["Infinity", { lDur: Number.POSITIVE_INFINITY }],
    ["null", { lDur: null }],
    ["a number for an option", { effect: 1 }],
    ["an unlisted option", { effect: "sparkle" }],
  ])("ignores %s", (_name, input) => {
    const { settings, applied } = parseSettings(input);
    expect(settings).toEqual(defaultSettings());
    expect(applied).toEqual([]);
  });

  it.each([[null], [undefined], [1], ["{}"], [[{ lDur: 2 }]]])(
    "treats %j as an empty object",
    (input) => {
      const { settings, applied } = parseSettings(input);
      expect(settings).toEqual(defaultSettings());
      expect(applied).toEqual([]);
    },
  );

  it("does not touch the prototype through __proto__", () => {
    const { settings } = parseSettings(JSON.parse('{"__proto__": {"polluted": true}}'));
    expect(settings).toEqual(defaultSettings());
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it("accepts #rrggbb colors and counts them", () => {
    const { settings, applied } = parseSettings({
      baseColor: "#AABBCC",
      highlightColor: "#112233",
    });
    expect(settings.baseColor).toBe("#AABBCC");
    expect(settings.highlightColor).toBe("#112233");
    expect(applied).toEqual(["baseColor", "highlightColor"]);
  });

  it.each(["#abc", "#aabbcc00", "aabbcc", "red", "#gggggg", 123])(
    "ignores the color %j",
    (color) => {
      const { settings, applied } = parseSettings({ baseColor: color });
      expect(settings).not.toHaveProperty("baseColor");
      expect(applied).toEqual([]);
    },
  );

  it("always sets the current version and does not count it as applied", () => {
    const { settings, applied } = parseSettings({ version: 999 });
    expect(settings.version).toBe(SETTINGS_VERSION);
    expect(applied).toEqual([]);
  });
});
