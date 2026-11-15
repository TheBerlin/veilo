// Tests for src/config.ts: config precedence and the JSON attribute parser.

import { LAYOUT_VERSION, type Layout } from "@veilo/core";
import { presetSettings } from "@veilo/presets";
import { afterEach, describe, expect, it, vi } from "vitest";
import { configKey, parseJsonAttribute, resolveConfig } from "../src/config.ts";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("resolveConfig", () => {
  it("applies the layout's settings, then the preset, then settings", () => {
    const layout = {
      version: LAYOUT_VERSION,
      settings: { effect: "pulse" as const, lDur: 2 },
      slots: { title: { role: "text" as const } },
      // A partial settings object, as a layout file may hold; core fills in the rest.
    } as unknown as Layout;
    expect(resolveConfig({ layout, settings: { lDur: 3 } })).toEqual({
      version: LAYOUT_VERSION,
      settings: { effect: "pulse", lDur: 3 },
      slots: layout.slots,
    });
    const preset = presetSettings("dot-upscale");
    expect(resolveConfig({ layout, preset: "dot-upscale" })).toMatchObject({
      settings: { ...preset },
    });
  });

  it("returns plain settings without a layout", () => {
    expect(resolveConfig({ settings: { effect: "wave" } })).toEqual({ effect: "wave" });
  });

  it("gives equal keys for equal configs", () => {
    expect(configKey({ settings: { effect: "wave" } })).toBe(
      configKey({ settings: { effect: "wave" } }),
    );
    expect(configKey({ settings: { effect: "wave" } })).not.toBe(
      configKey({ settings: { effect: "pulse" } }),
    );
  });
});

describe("parseJsonAttribute", () => {
  it("reads a JSON object", () => {
    expect(parseJsonAttribute('{"effect":"wave"}')).toEqual({ effect: "wave" });
  });

  it("treats an absent or empty attribute as unset", () => {
    expect(parseJsonAttribute(null)).toBeUndefined();
    expect(parseJsonAttribute("  ")).toBeUndefined();
  });

  it("ignores invalid JSON and non-objects with a warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    for (const value of ["{effect:wave}", "[1]", "3", "null"]) {
      expect(parseJsonAttribute(value)).toBeUndefined();
    }
    expect(warn).toHaveBeenCalledTimes(4);
  });
});
