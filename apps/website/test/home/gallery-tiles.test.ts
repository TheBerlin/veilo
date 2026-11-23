// Tests for src/home/gallery-tiles.ts, in Node: the preview's three effects and the badges read from
// the presets' own settings.

import { PRESETS, presetSettings } from "@veilo-ui/presets";
import { describe, expect, it } from "vitest";
import { optionsOf } from "../../src/playground/panel/controls.ts";
import {
  BADGE_NAMES,
  GALLERY_PREVIEW,
  presetBadges,
  tileSpec,
  type BadgeKey,
} from "../../src/home/gallery-tiles.ts";

describe("GALLERY_PREVIEW", () => {
  it("shows three real presets, each once: a character grid, a loader with a sweep, a mosaic", () => {
    expect(GALLERY_PREVIEW.map((spec) => spec.id)).toEqual([
      "hex-from-center",
      "cascade-wave",
      "mosaic-from-edge",
    ]);
    const known = new Set(PRESETS.map((preset) => preset.id));
    for (const spec of GALLERY_PREVIEW) expect(known.has(spec.id)).toBe(true);
  });

  it("gives each tile a resting state that exists: the still skeleton, or a frame from 0 to 1", () => {
    for (const { rest } of GALLERY_PREVIEW) {
      if (rest !== "loading") {
        expect(rest).toBeGreaterThan(0);
        expect(rest).toBeLessThan(1);
      }
    }
    // The wave is mostly about its loader, so it rests on the still skeleton; the two grid
    // effects rest in the middle of their reveal, where the pattern is plain.
    expect(GALLERY_PREVIEW.map((spec) => spec.rest)).toEqual([0.45, "loading", 0.45]);
  });
});

describe("tileSpec", () => {
  it("rests a tile of a grid effect on a frame of its reveal, and every other on the still skeleton", () => {
    const grid = new Set(["dots", "hex", "binary", "mosaic"]);
    for (const preset of PRESETS) {
      const settings = presetSettings(preset.id)!;
      const { rest } = tileSpec(preset.id);
      if (grid.has(settings.imageFx)) expect(rest, preset.id).toBe(0.45);
      else expect(rest, preset.id).toBe("loading");
    }
  });
});

describe("badges", () => {
  const keys: BadgeKey[] = ["effect", "imageFx", "textFx"];

  it.each(keys)("has a short name for every option of %s in the settings schema", (key) => {
    for (const option of optionsOf(key)) {
      expect(BADGE_NAMES[key][option], `${key}: ${option}`).toBeTruthy();
    }
  });

  it("has no name for an option the schema does not have", () => {
    for (const key of keys) {
      expect(Object.keys(BADGE_NAMES[key]).sort()).toEqual([...optionsOf(key)].sort());
    }
  });

  it("reads each preset's own settings: its loader, its image effect and its text effect", () => {
    expect(presetBadges("hex-from-center")).toEqual(["Shimmer", "Hex", "Scramble"]);
    expect(presetBadges("cascade-wave")).toEqual(["Wave", "Wipe", "Rise"]);
    expect(presetBadges("mosaic-from-edge")).toEqual(["Shimmer", "Mosaic", "Typewriter"]);
  });

  it("agrees with the settings for every preset, so a change to a preset changes its badges", () => {
    for (const preset of PRESETS) {
      const settings = presetSettings(preset.id)!;
      expect(presetBadges(preset.id)).toEqual([
        BADGE_NAMES.effect[settings.effect],
        BADGE_NAMES.imageFx[settings.imageFx],
        BADGE_NAMES.textFx[settings.textFx],
      ]);
    }
  });
});
