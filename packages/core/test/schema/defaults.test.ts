// Tests for src/schema/defaults.ts, from the spec's example settings JSON.

import { describe, expect, it } from "vitest";
import { defaultSettings } from "../../src/schema/defaults.ts";
import { SETTINGS_SPEC } from "../../src/schema/ranges.ts";
import { SETTINGS_VERSION } from "../../src/schema/version.ts";

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
