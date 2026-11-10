// Tests for src/state/settings-store.ts: one checked, serializable settings object.

import { defaultSettings, SETTINGS_VERSION, type Settings } from "@veilo/core";
import { describe, expect, it, vi } from "vitest";
import { createSettingsStore } from "../../src/state/settings-store.ts";

describe("createSettingsStore", () => {
  it("starts from the default settings", () => {
    const store = createSettingsStore();
    expect(store.getState().settings).toEqual(defaultSettings());
    expect(store.getState().settings.version).toBe(SETTINGS_VERSION);
  });

  it("checks a starting input like load", () => {
    const store = createSettingsStore({ effect: "pulse", lDur: 99 });
    expect(store.getState().settings.effect).toBe("pulse");
    expect(store.getState().settings.lDur).toBe(4);
  });

  it("sets one value and keeps the others", () => {
    const store = createSettingsStore();
    store.getState().set("effect", "wave");
    expect(store.getState().settings).toEqual({ ...defaultSettings(), effect: "wave" });
  });

  it("clamps numbers to their range", () => {
    const store = createSettingsStore();
    store.getState().set("lDur", 99);
    expect(store.getState().settings.lDur).toBe(4);
  });

  it("ignores a wrong type or an unknown option and keeps the current value", () => {
    const store = createSettingsStore();
    // Non-default values first, so a reset to the default would show.
    store.getState().setMany({ lDur: 2, effect: "pulse" });
    const before = store.getState().settings;
    store.getState().set("lDur", "fast" as unknown as number);
    store.getState().set("effect", "sparkle" as Settings["effect"]);
    expect(store.getState().settings).toBe(before);
  });

  it("accepts and checks a color override", () => {
    const store = createSettingsStore();
    store.getState().set("baseColor", "#27373c");
    expect(store.getState().settings.baseColor).toBe("#27373c");
    store.getState().set("baseColor", "red");
    expect(store.getState().settings.baseColor).toBe("#27373c");
  });

  it("sets several values at once", () => {
    const store = createSettingsStore();
    store.getState().setMany({ effect: "pulse", depth: 0.3, radius: 99 });
    const { settings } = store.getState();
    expect([settings.effect, settings.depth, settings.radius]).toEqual(["pulse", 0.3, 24]);
  });

  it("loads input over the defaults and reports the applied keys", () => {
    const store = createSettingsStore();
    store.getState().set("radius", 12);
    const applied = store.getState().load({ effect: "wave", stagger: 0.2, nonsense: 1 });
    expect(applied.sort()).toEqual(["effect", "stagger"]);
    // Load replaces everything: the earlier radius change is gone.
    expect(store.getState().settings.radius).toBe(defaultSettings().radius);
    // Counted, so the stage can play the full sequence.
    expect(store.getState().loads).toBe(1);
  });

  it("resets to the defaults", () => {
    const store = createSettingsStore({ effect: "pulse" });
    store.getState().reset();
    expect(store.getState().settings).toEqual(defaultSettings());
  });

  it("round-trips through JSON", () => {
    const store = createSettingsStore();
    store.getState().setMany({ effect: "wave", angle: 45, baseColor: "#123456" });
    const json = JSON.stringify(store.getState().settings);
    const copy = createSettingsStore(JSON.parse(json));
    expect(copy.getState().settings).toEqual(store.getState().settings);
  });

  it("does not wake subscribers when a write changes nothing", () => {
    const store = createSettingsStore();
    const listener = vi.fn();
    store.subscribe(listener);
    store.getState().set("effect", defaultSettings().effect);
    store.getState().set("lDur", "fast" as unknown as number);
    expect(listener).not.toHaveBeenCalled();
    store.getState().set("effect", "pulse");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("keeps each store separate", () => {
    const a = createSettingsStore();
    const b = createSettingsStore();
    a.getState().set("effect", "pulse");
    expect(b.getState().settings.effect).toBe(defaultSettings().effect);
  });

  it("removes the given custom colors only, and stays asleep when there are none", () => {
    const store = createSettingsStore();
    const listener = vi.fn();
    store.subscribe(listener);
    store.getState().resetColors(["baseColor", "highlightColor"]);
    expect(listener).not.toHaveBeenCalled();
    store
      .getState()
      .setMany({ baseColor: "#112233", highlightColor: "#445566", inkColor: "#778899" });
    store.getState().resetColors(["baseColor", "highlightColor"]);
    expect(store.getState().settings).toEqual({ ...defaultSettings(), inkColor: "#778899" });
    expect("baseColor" in store.getState().settings).toBe(false);
    store.getState().resetColors(["inkColor"]);
    expect(store.getState().settings).toEqual(defaultSettings());
  });
});
