import { LAYOUT_VERSION, defaultSettings, type Layout } from "@veilo/core";
import { presetSettings } from "@veilo/presets";
import { describe, expect, it } from "vitest";
import { configKey, resolveConfig } from "../src/config.ts";

const layout: Layout = {
  version: LAYOUT_VERSION,
  settings: { ...defaultSettings(), imageFx: "mosaic", rDur: 2 },
  slots: { photo: { role: "image" }, title: { role: "text", width: 60 } },
};

describe("resolveConfig", () => {
  it("passes plain settings when there is no layout", () => {
    expect(resolveConfig({ settings: { imageFx: "hex" } })).toEqual({ imageFx: "hex" });
    expect(resolveConfig({})).toEqual({});
  });

  it("uses a preset's complete settings, with overrides on top", () => {
    const resolved = resolveConfig({ preset: "hex-from-center", settings: { rDur: 3 } });
    expect(resolved).toEqual({ ...presetSettings("hex-from-center"), rDur: 3 });
  });

  it("keeps a layout's slots and settings", () => {
    expect(resolveConfig({ layout })).toEqual(layout);
  });

  it("lets a preset replace a layout's settings but keep its slots", () => {
    const resolved = resolveConfig({ layout, preset: "matrix-columns", settings: { hold: 0.5 } });
    expect(resolved).toEqual({
      version: LAYOUT_VERSION,
      settings: { ...presetSettings("matrix-columns"), hold: 0.5 },
      slots: layout.slots,
    });
  });
});

describe("configKey", () => {
  it("is equal for equal configs in new objects", () => {
    expect(configKey({ settings: { rDur: 2 } })).toBe(configKey({ settings: { rDur: 2 } }));
  });

  it("differs when the effect differs", () => {
    expect(configKey({ settings: { rDur: 2 } })).not.toBe(configKey({ settings: { rDur: 3 } }));
    expect(configKey({ preset: "dot-upscale" })).not.toBe(configKey({ preset: "soft-pulse" }));
  });
});
