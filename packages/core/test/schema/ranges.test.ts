// Tests for src/schema/ranges.ts, against the spec's control tables copied out by hand.
// The table is the source of truth for types, defaults, validation and the JSON Schema, so a
// typo there would pass every other test; this file is the independent check.

import { describe, expect, it } from "vitest";
import {
  COLOR_KEYS,
  COLOR_PATTERN,
  EASING_KEYS,
  SETTING_KEYS,
  SETTINGS_SPEC,
} from "../../src/schema/ranges.ts";

/** A numeric control as the spec writes it: range, step and default. */
const range = (min: number, max: number, step: number, value: number) => ({
  kind: "number",
  min,
  max,
  step,
  default: value,
});

/** An option control as the spec writes it. */
const options = (list: string[], value: string) => ({
  kind: "enum",
  options: list,
  default: value,
});

// Spec: Easing presets.
const EASINGS = ["out", "outSoft", "inOut", "in", "linear", "back", "custom"];

// Spec 1.3 Loader tab, 1.4 Reveal tab (image, card text and timing controls).
const SPEC = {
  effect: options(["shimmer", "wave", "pulse"], "shimmer"),
  lDur: range(0.3, 4, 0.05, 1.2),
  lGap: range(0, 2, 0.05, 0.2),
  lEase: options(EASINGS, "out"),
  lx1: range(0, 1, 0.01, 0.22),
  ly1: range(-0.6, 1.6, 0.01, 1),
  lx2: range(0, 1, 0.01, 0.36),
  ly2: range(-0.6, 1.6, 0.01, 1),
  repeat: options(["loop", "once"], "loop"),
  stagger: range(0, 0.4, 0.01, 0.12),
  angle: range(0, 180, 5, 100),
  lWidth: range(8, 70, 2, 30),
  depth: range(0.1, 0.9, 0.05, 0.5),
  radius: range(0, 24, 1, 6),
  imageFx: options(
    ["dots", "hex", "binary", "mosaic", "blur", "crossfade", "wipe", "zoom"],
    "dots",
  ),
  origin: options(["left", "right", "top", "bottom", "center", "diagonal", "random"], "left"),
  cols: range(16, 110, 2, 64),
  startScale: range(1, 4, 0.1, 2.5),
  spread: range(0.1, 0.9, 0.05, 0.6),
  textFx: options(["scramble", "typewriter", "rise", "fade"], "scramble"),
  charset: options(["hex", "binary", "symbols", "dots"], "dots"),
  unit: options(["char", "word"], "char"),
  rDur: range(0.4, 5, 0.05, 1.04),
  rEase: options(EASINGS, "outSoft"),
  rx1: range(0, 1, 0.01, 0.33),
  ry1: range(-0.6, 1.6, 0.01, 1),
  rx2: range(0, 1, 0.01, 0.68),
  ry2: range(-0.6, 1.6, 0.01, 1),
  hold: range(0, 5, 0.1, 1.2),
};

describe("SETTINGS_SPEC", () => {
  it("has exactly the spec's settings", () => {
    expect([...SETTING_KEYS].sort()).toEqual(Object.keys(SPEC).sort());
  });

  it.each(Object.entries(SPEC))("matches the spec for %s", (key, expected) => {
    expect(SETTINGS_SPEC[key as keyof typeof SETTINGS_SPEC]).toEqual(expected);
  });

  it("lists the keys in table order", () => {
    expect(SETTING_KEYS).toEqual(Object.keys(SETTINGS_SPEC));
  });
});

describe("EASING_KEYS", () => {
  it("matches the spec's easing presets", () => {
    expect(EASING_KEYS).toEqual(EASINGS);
  });
});

describe("colors", () => {
  it("has the skeleton's two overrides and the reveal's ink", () => {
    expect(COLOR_KEYS).toEqual(["baseColor", "highlightColor", "inkColor"]);
  });

  it.each(["#dde5e6", "#27373C", "#000000", "#FFFFFF"])("accepts %s", (color) => {
    expect(COLOR_PATTERN.test(color)).toBe(true);
  });

  it.each(["#abc", "#aabbcc00", "aabbcc", "red", "#gggggg", " #aabbcc", "#aabbcc "])(
    "rejects %j",
    (color) => {
      expect(COLOR_PATTERN.test(color)).toBe(false);
    },
  );
});
