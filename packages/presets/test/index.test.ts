// Tests for src/index.ts: the presets match spec section 1.5, and every value is one core accepts.

import { defaultSettings, parseSettings } from "@veilo/core/loader";
import { describe, expect, it } from "vitest";
import * as api from "../src/index.ts";
import { PRESETS, findPreset, matchingPreset, presetSettings } from "../src/index.ts";

// Spec 1.5, copied by hand: change only when the spec changes. Defaults are spelled out where
// the spec names them, so the row checks the full settings, not just the overrides.
const SPEC: Record<string, Record<string, unknown>> = {
  "Dot upscale": {
    effect: "shimmer",
    lDur: 1.2,
    lGap: 0.2,
    lEase: "out",
    repeat: "loop",
    angle: 100,
    lWidth: 30,
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
    hold: 1.2,
  },
  "Hex from center": {
    imageFx: "hex",
    origin: "center",
    cols: 70,
    textFx: "scramble",
    charset: "hex",
    unit: "word",
    rDur: 1.6,
  },
  "Matrix columns": {
    imageFx: "binary",
    origin: "left",
    cols: 84,
    textFx: "scramble",
    charset: "binary",
    unit: "char",
    rDur: 1.4,
  },
  "Cascade wave": {
    effect: "wave",
    lDur: 1,
    lGap: 0.4,
    stagger: 0.12,
    imageFx: "wipe",
    origin: "left",
    textFx: "rise",
    rDur: 1,
    rEase: "out",
  },
  "Soft pulse": {
    effect: "pulse",
    lDur: 1.4,
    depth: 0.45,
    lEase: "inOut",
    imageFx: "blur",
    textFx: "fade",
    rDur: 0.9,
    rEase: "out",
  },
  "Compact shimmer": {
    effect: "shimmer",
    lDur: 1.2,
    lGap: 0,
    repeat: "once",
    imageFx: "crossfade",
    textFx: "fade",
    rDur: 0.6,
    rEase: "out",
  },
  "Mosaic from edge": {
    imageFx: "mosaic",
    origin: "diagonal",
    cols: 36,
    startScale: 1.6,
    spread: 0.5,
    textFx: "typewriter",
    rDur: 1.5,
  },
};

describe("@veilo/presets", () => {
  it("exports exactly these values; changing the list is an API change", () => {
    expect(Object.keys(api).sort()).toEqual([
      "PRESETS",
      "findPreset",
      "matchingPreset",
      "presetSettings",
    ]);
  });

  it("lists the spec's presets in its order, with unique ids", () => {
    expect(PRESETS.map((preset) => preset.name)).toEqual(Object.keys(SPEC));
    expect(new Set(PRESETS.map((preset) => preset.id)).size).toBe(PRESETS.length);
  });

  it.each(PRESETS.map((preset) => [preset.name, preset] as const))(
    "%s matches the spec and is accepted by core unchanged",
    (name, preset) => {
      const full = presetSettings(preset);
      expect(full).toMatchObject(SPEC[name]!);
      // Every override is applied as written: no unknown key, wrong type or clamped number.
      const { settings, applied } = parseSettings(preset.settings);
      expect(applied.sort()).toEqual(Object.keys(preset.settings).sort());
      for (const [key, value] of Object.entries(preset.settings)) {
        expect(settings[key as keyof typeof settings]).toBe(value);
      }
      expect(Object.keys(preset.settings)).not.toContain("baseColor");
      expect(Object.keys(preset.settings)).not.toContain("highlightColor");
    },
  );

  it("starts with the defaults", () => {
    expect(presetSettings("dot-upscale")).toEqual(defaultSettings());
  });

  it("finds presets by id and returns fresh settings objects", () => {
    expect(findPreset("soft-pulse")?.name).toBe("Soft pulse");
    expect(findPreset("nope")).toBeUndefined();
    expect(presetSettings("nope")).toBeUndefined();
    expect(presetSettings("soft-pulse")).not.toBe(presetSettings("soft-pulse"));
  });

  it("matches settings to a preset only when every value is equal", () => {
    for (const preset of PRESETS) {
      expect(matchingPreset(presetSettings(preset)!)).toBe(preset);
    }
    const changed = { ...presetSettings("hex-from-center")!, cols: 72 };
    expect(matchingPreset(changed)).toBeUndefined();
    const colored = { ...defaultSettings(), baseColor: "#123456" };
    expect(matchingPreset(colored)).toBeUndefined();
  });
});
