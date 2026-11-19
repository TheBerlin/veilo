// Tests for src/presets/user-presets-store.ts, in Node with a fake storage.

import { defaultSettings } from "@veilo-ui/core";
import { describe, expect, it } from "vitest";
import type { KeyValueStorage } from "../../src/presets/browser-storage.ts";
import {
  createUserPresetsStore,
  readUserPresets,
  USER_PRESETS_KEY,
} from "../../src/presets/user-presets-store.ts";

/**
 * A storage backed by a Map, with a switch that makes writes fail like a full storage.
 *
 * @returns The storage, its entries and the switch.
 */
function fakeStorage() {
  const entries = new Map<string, string>();
  const state = { full: false };
  const storage: KeyValueStorage = {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => {
      if (state.full) throw new DOMException("Quota exceeded", "QuotaExceededError");
      entries.set(key, value);
    },
    removeItem: (key) => void entries.delete(key),
  };
  return { storage, entries, state };
}

/**
 * The names in the saved value.
 *
 * @param entries - The fake storage's entries.
 * @returns The names, in order.
 */
function savedNames(entries: Map<string, string>): string[] {
  const saved = JSON.parse(entries.get(USER_PRESETS_KEY)!) as { presets: { name: string }[] };
  return saved.presets.map((p) => p.name);
}

describe("createUserPresetsStore", () => {
  it("saves every change at once, in a versioned value", () => {
    const { storage, entries } = fakeStorage();
    const store = createUserPresetsStore(storage);
    expect(store.getState().presets).toEqual([]);
    expect(store.getState().persistent).toBe(true);

    const a = store.getState().add("  First ", defaultSettings());
    const b = store.getState().add("Second", { ...defaultSettings(), cols: 40 });
    expect(a.name).toBe("First");
    expect(a.id).not.toBe(b.id);
    expect(JSON.parse(entries.get(USER_PRESETS_KEY)!).version).toBe(1);
    expect(savedNames(entries)).toEqual(["First", "Second"]);

    store.getState().rename(a.id, " Renamed ");
    store.getState().update(b.id, { ...defaultSettings(), cols: 50 });
    expect(savedNames(entries)).toEqual(["Renamed", "Second"]);
    expect(store.getState().presets[1]!.settings.cols).toBe(50);

    const before = store.getState().presets;
    store.getState().remove(a.id);
    expect(savedNames(entries)).toEqual(["Second"]);
    store.getState().replaceAll(before);
    expect(savedNames(entries)).toEqual(["Renamed", "Second"]);
  });

  it("starts from the saved list in a new visit", () => {
    const { storage } = fakeStorage();
    const first = createUserPresetsStore(storage);
    const saved = first.getState().add("Kept", { ...defaultSettings(), effect: "pulse" });
    const second = createUserPresetsStore(storage);
    expect(second.getState().presets).toEqual([saved]);
  });

  it("keeps the list in memory without storage, and says so", () => {
    const store = createUserPresetsStore(null);
    expect(store.getState().persistent).toBe(false);
    store.getState().add("Visit only", defaultSettings());
    expect(store.getState().presets.map((p) => p.name)).toEqual(["Visit only"]);
  });

  it("marks the list as not kept when a save fails, and kept again when one works", () => {
    const { storage, state } = fakeStorage();
    const store = createUserPresetsStore(storage);
    state.full = true;
    store.getState().add("A", defaultSettings());
    expect(store.getState().persistent).toBe(false);
    expect(store.getState().presets).toHaveLength(1);
    state.full = false;
    store.getState().add("B", defaultSettings());
    expect(store.getState().persistent).toBe(true);
  });
});

describe("readUserPresets", () => {
  it("reads nothing from no storage or an unusable value", () => {
    expect(readUserPresets(null)).toEqual([]);
    const { storage, entries } = fakeStorage();
    for (const text of ["x", "null", "{}", '{"version":2,"presets":[]}', '{"version":1}']) {
      entries.set(USER_PRESETS_KEY, text);
      expect(readUserPresets(storage), text).toEqual([]);
    }
  });

  it("skips broken entries, keeps unique ids and makes names unique", () => {
    const { storage, entries } = fakeStorage();
    entries.set(
      USER_PRESETS_KEY,
      JSON.stringify({
        version: 1,
        presets: [
          { id: "a", name: "Soft", settings: {} },
          { id: "a", name: "soft", settings: { cols: 40 } },
          { id: "c", name: "", settings: {} },
          { id: "d", name: "No settings" },
          { name: "No id", settings: { lDur: 999 } },
        ],
      }),
    );
    const presets = readUserPresets(storage);
    expect(presets.map((p) => p.name)).toEqual(["Soft", "soft (2)", "No id"]);
    expect(presets[0]!.id).toBe("a");
    expect(presets[1]!.id).not.toBe("a");
    expect(presets[2]!.id).toEqual(expect.any(String));
    expect(presets[2]!.settings.lDur).toBeLessThan(999);
  });
});
