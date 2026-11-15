// Tests for src/presets/user-presets.ts, in Node.

import { defaultSettings } from "@veilo/core";
import { describe, expect, it } from "vitest";
import {
  cleanName,
  NAME_ERRORS,
  NAME_MAX,
  nameError,
  readPresetEntry,
  sameSettings,
  uniqueName,
  type UserPreset,
} from "../../src/presets/user-presets.ts";

/**
 * A list of presets with the given names.
 *
 * @param names - The names.
 * @returns The presets, ids `p0`, `p1`, ...
 */
function list(...names: string[]): UserPreset[] {
  return names.map((name, i) => ({ id: `p${i}`, name, settings: defaultSettings() }));
}

describe("names", () => {
  it("trims spaces at both ends", () => {
    expect(cleanName("  My shimmer ")).toBe("My shimmer");
  });

  it("accept a free name of 1 to 40 characters", () => {
    expect(nameError("A", list())).toBe("");
    expect(nameError("x".repeat(NAME_MAX), list())).toBe("");
  });

  it("reject an empty, too long or taken name, ignoring case and spaces", () => {
    expect(nameError("   ", list())).toBe(NAME_ERRORS.empty);
    expect(nameError("x".repeat(NAME_MAX + 1), list())).toBe(NAME_ERRORS.long);
    expect(nameError(" my SHIMMER ", list("My shimmer"))).toBe(NAME_ERRORS.taken);
  });

  it("let a preset keep its own name when renamed", () => {
    expect(nameError("My shimmer", list("My shimmer"), "p0")).toBe("");
    expect(nameError("Other", list("My shimmer", "Other"), "p0")).toBe(NAME_ERRORS.taken);
  });

  it("make a clashing name unique with a number, within 40 characters", () => {
    expect(uniqueName("Soft", list("Other"))).toBe("Soft");
    expect(uniqueName("Soft", list("soft"))).toBe("Soft (2)");
    expect(uniqueName("Soft", list("Soft", "Soft (2)"))).toBe("Soft (3)");
    const long = "x".repeat(NAME_MAX);
    const unique = uniqueName(long, list(long));
    expect(unique).toBe(`${"x".repeat(NAME_MAX - 4)} (2)`);
    expect(unique.length).toBe(NAME_MAX);
  });
});

describe("sameSettings", () => {
  it("compares every value, custom colors included", () => {
    const a = defaultSettings();
    expect(sameSettings(a, defaultSettings())).toBe(true);
    expect(sameSettings(a, { ...a, cols: 40 })).toBe(false);
    expect(sameSettings(a, { ...a, baseColor: "#123456" })).toBe(false);
  });
});

describe("readPresetEntry", () => {
  it("reads a name and checked settings", () => {
    expect(readPresetEntry({ name: " Mine ", settings: { effect: "wave", lDur: 999 } })).toEqual({
      name: "Mine",
      settings: expect.objectContaining({ effect: "wave", lDur: expect.any(Number) }),
    });
    const entry = readPresetEntry({ name: "Mine", settings: { lDur: 999 } })!;
    expect(entry.settings.lDur).toBeLessThan(999);
  });

  it("cuts a long name to 40 characters", () => {
    expect(readPresetEntry({ name: "y".repeat(60), settings: {} })!.name).toBe(
      "y".repeat(NAME_MAX),
    );
  });

  it("rejects entries without a usable name or settings object", () => {
    for (const value of [
      null,
      "x",
      {},
      { name: 3, settings: {} },
      { name: "  ", settings: {} },
      { name: "A" },
      { name: "A", settings: null },
      { name: "A", settings: [] },
    ]) {
      expect(readPresetEntry(value), JSON.stringify(value)).toBeNull();
    }
  });
});
