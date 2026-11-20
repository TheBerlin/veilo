// Tests for the settings format's compatibility promise, in Node. The files next to this one are
// golden: a copy of what version 1 accepted when the format was reviewed for the 1.0 freeze. They are
// not generated and must not be regenerated to make a test pass. A change that breaks one of these
// tests breaks users' saved settings, share links or layouts, and needs a new settings version and a
// migration (see docs/schema-freeze-review.md). Not a mirror of one source file, by design.

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { defaultSettings } from "../../src/schema/defaults.ts";
import { parseLayout } from "../../src/schema/layout.ts";
import { SETTINGS_SPEC } from "../../src/schema/ranges.ts";
import { SETTINGS_VERSION } from "../../src/schema/version.ts";
import { parseSettings } from "../../src/schema/validate.ts";

/**
 * Reads a golden file.
 *
 * @param name - The file name in this folder.
 * @returns The parsed JSON.
 */
function golden<T>(name: string): T {
  return JSON.parse(readFileSync(new URL(name, import.meta.url), "utf8")) as T;
}

interface FrozenKey {
  kind: "enum" | "number";
  default: string | number;
  options?: string[];
  min?: number;
  max?: number;
  integer?: true;
}

const frozen = golden<{ version: number; keys: Record<string, FrozenKey>; colors: string[] }>(
  "settings-v1.frozen.json",
);

describe("settings format, frozen at version 1", () => {
  it("is still version 1 until a migration exists", () => {
    expect(frozen.version).toBe(1);
    expect(SETTINGS_VERSION).toBe(frozen.version);
  });

  it("keeps every frozen key, with the same kind and the same default", () => {
    const current = SETTINGS_SPEC as Record<string, { kind: string; default: unknown }>;
    for (const [key, entry] of Object.entries(frozen.keys)) {
      expect(current[key], `${key} was removed or renamed`).toBeDefined();
      expect(current[key]!.kind, `${key} changed kind`).toBe(entry.kind);
      expect(current[key]!.default, `${key} changed its default`).toBe(entry.default);
    }
  });

  it("only widens ranges and adds options: nothing a saved file could hold becomes invalid", () => {
    const current = SETTINGS_SPEC as Record<
      string,
      { min?: number; max?: number; options?: readonly string[] }
    >;
    for (const [key, entry] of Object.entries(frozen.keys)) {
      if (entry.kind === "number") {
        expect(current[key]!.min!, `${key} min was raised`).toBeLessThanOrEqual(entry.min!);
        expect(current[key]!.max!, `${key} max was lowered`).toBeGreaterThanOrEqual(entry.max!);
      } else {
        for (const option of entry.options!) {
          expect(current[key]!.options, `${key} lost the option ${option}`).toContain(option);
        }
      }
    }
  });

  it("keeps counts as whole numbers", () => {
    const current = SETTINGS_SPEC as Record<string, { integer?: true }>;
    for (const [key, entry] of Object.entries(frozen.keys)) {
      if (entry.integer) expect(current[key]!.integer, `${key} is no longer a count`).toBe(true);
    }
    expect(parseSettings({ cols: 70.6 }).settings.cols).toBe(71);
  });

  it("the defaults are the frozen defaults, plus the version", () => {
    const expected: Record<string, unknown> = { version: frozen.version };
    for (const [key, entry] of Object.entries(frozen.keys)) expected[key] = entry.default;
    expect(defaultSettings()).toEqual(expected);
  });

  it("reads a settings object with every key set back unchanged, in the table's order", () => {
    const full = golden<Record<string, unknown>>("settings-v1.full.json");
    const { settings, applied } = parseSettings(full);
    expect(settings).toEqual(full);
    expect(applied).toEqual([...Object.keys(frozen.keys), ...frozen.colors]);
  });

  it("is lenient the same way: clamps numbers, drops unknown keys and wrong types", () => {
    const file = golden<{
      input: unknown;
      expectedChanges: Record<string, unknown>;
      expectedApplied: string[];
    }>("settings-v1.lenient.json");
    const { settings, applied } = parseSettings(file.input);
    expect(settings).toEqual({ ...defaultSettings(), ...file.expectedChanges });
    expect(applied).toEqual(file.expectedApplied);
    expect(Object.prototype.hasOwnProperty.call(settings, "unknownKey")).toBe(false);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });
});

describe("layout format, frozen at version 1", () => {
  it("reads a layout the same way: roles, clamped hints, dropped bad entries", () => {
    const file = golden<{
      input: unknown;
      expectedSlots: Record<string, unknown>;
      expectedSettingChanges: Record<string, unknown>;
    }>("layout-v1.json");
    const layout = parseLayout(file.input);
    expect(layout.version).toBe(1);
    expect(layout.slots).toEqual(file.expectedSlots);
    expect(layout.settings).toEqual({ ...defaultSettings(), ...file.expectedSettingChanges });
  });
});
