// Tests for src/presets/presets-file.ts (all but downloadText, which the tab test covers), in
// Node.

import { defaultSettings } from "@veilo/core";
import { describe, expect, it } from "vitest";
import {
  importMessage,
  mergePresets,
  PRESETS_FILE_LIMITS,
  presetsFileText,
  readPresetsFile,
} from "../../src/presets/presets-file.ts";
import type { UserPreset } from "../../src/presets/user-presets.ts";

/**
 * A list of presets with the given names.
 *
 * @param names - The names.
 * @returns The presets, ids `p0`, `p1`, ...
 */
function list(...names: string[]): UserPreset[] {
  return names.map((name, i) => ({
    id: `p${i}`,
    name,
    settings: { ...defaultSettings(), cols: 20 + i },
  }));
}

/**
 * A presets file's text with the given entries.
 *
 * @param presets - The raw entries.
 * @param extra - Fields that replace the file's own.
 * @returns The JSON text.
 */
function fileWith(presets: unknown[], extra: object = {}): string {
  return JSON.stringify({ format: "veilo-presets", version: 1, presets, ...extra });
}

describe("presetsFileText and readPresetsFile", () => {
  it("round-trip names and settings, without the local ids", () => {
    const presets = list("One", "Two");
    const text = presetsFileText(presets);
    expect(text).not.toContain('"id"');
    expect(JSON.parse(text)).toMatchObject({ format: "veilo-presets", version: 1 });
    expect(readPresetsFile(text)).toEqual({
      ok: true,
      entries: presets.map(({ name, settings }) => ({ name, settings })),
      skipped: 0,
    });
  });

  it("reject text that is not JSON, other JSON, and later formats", () => {
    expect(readPresetsFile("{ nope")).toEqual({ ok: false, error: "json" });
    for (const text of [
      "[]",
      "null",
      JSON.stringify(defaultSettings()),
      JSON.stringify({ format: "other", version: 1, presets: [] }),
      fileWith([], { presets: {} }),
      fileWith([], { version: undefined }),
      fileWith([], { version: 0 }),
      fileWith([], { version: "1" }),
    ]) {
      expect(readPresetsFile(text), text).toEqual({ ok: false, error: "format" });
    }
    expect(readPresetsFile(fileWith([], { version: 2 }))).toEqual({ ok: false, error: "newer" });
  });

  it("skip entries that cannot be used, and reject a file with none", () => {
    const result = readPresetsFile(
      fileWith([{ name: "Good", settings: { lDur: 999 } }, { name: "" }, null, { settings: {} }]),
    );
    expect(result.ok && result.entries.map((e) => e.name)).toEqual(["Good"]);
    expect(result.ok && result.skipped).toBe(3);
    // Settings are checked like everywhere else.
    expect(result.ok && result.entries[0]!.settings.lDur).toBeLessThan(999);
    expect(readPresetsFile(fileWith([{ name: "" }]))).toEqual({ ok: false, error: "empty" });
  });

  it("stop at the size and count limits", () => {
    const huge = fileWith([
      { name: "A", settings: {}, pad: "x".repeat(PRESETS_FILE_LIMITS.bytes) },
    ]);
    expect(readPresetsFile(huge)).toEqual({ ok: false, error: "large" });
    const many = Array.from({ length: PRESETS_FILE_LIMITS.presets + 3 }, (_, i) => ({
      name: `P${i}`,
      settings: {},
    }));
    const result = readPresetsFile(fileWith(many));
    expect(result.ok && result.entries.length).toBe(PRESETS_FILE_LIMITS.presets);
    expect(result.ok && result.skipped).toBe(3);
  });
});

describe("mergePresets", () => {
  it("adds after the list with new ids and unique names", () => {
    const current = list("Soft", "Grid");
    const merged = mergePresets(current, [
      { name: "soft", settings: defaultSettings() },
      { name: "New", settings: defaultSettings() },
      { name: "New", settings: defaultSettings() },
    ]);
    expect(merged.map((p) => p.name)).toEqual(["Soft", "Grid", "soft (2)", "New", "New (2)"]);
    expect(merged.slice(0, 2)).toEqual(current);
    expect(new Set(merged.map((p) => p.id)).size).toBe(5);
  });
});

describe("importMessage", () => {
  it("counts added presets and skipped entries in words", () => {
    expect(importMessage(1, 0)).toBe("Added 1 preset.");
    expect(importMessage(3, 1)).toBe("Added 3 presets. 1 entry could not be used.");
    expect(importMessage(2, 4)).toBe("Added 2 presets. 4 entries could not be used.");
  });
});
