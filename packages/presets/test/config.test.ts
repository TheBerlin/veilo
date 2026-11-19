// Tests for the shared config helpers of src/index.ts: how a preset, settings and a layout combine.

import { LAYOUT_VERSION, defaultSettings, type Layout } from "@veilo-ui/core";
import { describe, expect, it } from "vitest";
import { configKey, presetSettings, resolveConfig, type LayoutInput } from "../src/index.ts";

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

  it("accepts a layout whose settings hold only the changed keys", () => {
    // The playground's layout JSON is written like this; it must typecheck as a prop.
    const short: LayoutInput = { version: LAYOUT_VERSION, settings: { imageFx: "hex" }, slots: {} };
    expect(resolveConfig({ layout: short })).toEqual({
      version: LAYOUT_VERSION,
      settings: { imageFx: "hex" },
      slots: {},
    });
    // Settings are optional too.
    const bare: LayoutInput = { version: LAYOUT_VERSION, slots: { photo: { role: "image" } } };
    expect(resolveConfig({ layout: bare })).toMatchObject({ slots: bare.slots });
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
