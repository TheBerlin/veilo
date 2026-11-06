// Tests for src/panel/controls.ts: the control table matches core's settings and spec 1.3/1.4.

import { defaultSettings, type Settings } from "@veilo/core";
import { describe, expect, it } from "vitest";
import {
  boundsOf,
  LOADER_GROUPS,
  LOADER_KEYS,
  optionsOf,
  REVEAL_GROUPS,
  type Control,
  type ControlGroup,
} from "../../src/panel/controls.ts";

const all: Control[] = [...LOADER_GROUPS, ...REVEAL_GROUPS].flatMap((group) => [...group.controls]);

/**
 * The labels of the controls shown for some settings.
 *
 * @param groups - A tab's groups.
 * @param changes - Settings over the defaults.
 * @returns The visible labels.
 */
function shown(groups: readonly ControlGroup[], changes: Partial<Settings>): string[] {
  const settings = { ...defaultSettings(), ...changes };
  return groups.flatMap((group) =>
    group.controls.filter((c) => c.shown?.(settings) ?? true).map((c) => c.label),
  );
}

describe("control table", () => {
  it("has one control per setting, apart from the version", () => {
    const keys = all.map((control) => control.key).sort();
    const settingKeys = Object.keys(defaultSettings())
      .filter((key) => key !== "version")
      .sort();
    expect(keys).toEqual(settingKeys);
  });

  it("reads ranges and options from core's schema", () => {
    expect(boundsOf("lDur")).toEqual({ min: 0.3, max: 4 });
    expect(boundsOf("cols")).toEqual({ min: 16, max: 110 });
    expect(boundsOf("ly1")).toEqual({ min: -0.6, max: 1.6 });
    expect(optionsOf("effect")).toEqual(["shimmer", "wave", "pulse"]);
  });

  it("names every option", () => {
    for (const control of all) {
      if (control.kind !== "choice") continue;
      for (const option of optionsOf(control.key)) {
        expect(control.names[option], `${control.key}.${option}`).toBeTruthy();
      }
    }
  });

  it("shows only the loader controls that apply (spec 1.3)", () => {
    expect(shown(LOADER_GROUPS, { effect: "pulse" })).toEqual([
      "Effect",
      "Duration",
      "Easing",
      "Repeat",
      "Pulse depth",
      "Bar corner radius",
    ]);
    expect(shown(LOADER_GROUPS, { effect: "wave" })).toContain("Delay per element");
    expect(shown(LOADER_GROUPS, { lEase: "custom" })).toContain("Curve y2");
  });

  it("shows only the reveal controls that apply (spec 1.4)", () => {
    expect(shown(REVEAL_GROUPS, { imageFx: "crossfade", textFx: "fade" })).toEqual([
      "Image reveal",
      "Text reveal",
      "Reveal duration",
      "Easing",
      "Loading time before reveal",
    ]);
    expect(shown(REVEAL_GROUPS, { imageFx: "wipe" })).toContain("Origin");
    expect(shown(REVEAL_GROUPS, { imageFx: "wipe" })).not.toContain("Grid columns");
  });

  it("counts the colors as loader keys and the reveal keys as not", () => {
    expect(LOADER_KEYS.has("baseColor")).toBe(true);
    expect(LOADER_KEYS.has("lx1")).toBe(true);
    expect(LOADER_KEYS.has("hold")).toBe(false);
    expect(LOADER_KEYS.has("imageFx")).toBe(false);
  });
});
