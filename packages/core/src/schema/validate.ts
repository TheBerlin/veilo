// validate.ts: checks and clamps untrusted settings input.
// Layer 0 (pure). Must not import DOM code.

import { defaultSettings } from "./defaults.ts";
import { SETTINGS_VERSION } from "./version.ts";
import {
  COLOR_KEYS,
  COLOR_PATTERN,
  SETTING_KEYS,
  SETTINGS_SPEC,
  type SettingEntry,
} from "./ranges.ts";
import type { ColorKey, SettingKey, Settings } from "./types.ts";

/** The result of {@link parseSettings}. */
export interface ParsedSettings {
  /** Complete settings: accepted input values over the defaults. */
  settings: Settings;
  /** Keys taken from the input, including clamped numbers. Its length is the spec's "N settings applied". */
  applied: (SettingKey | ColorKey)[];
  /**
   * The input's `version`, when it is newer than {@link SETTINGS_VERSION}. The input is still read
   * (known keys are used, the rest ignored), but a newer format may mean something different, so
   * a caller can warn that the file was made by a newer version of Veilo. Absent otherwise.
   */
  newerVersion?: number;
}

/**
 * Reads one input value against its table row.
 *
 * @param entry - The table row for the setting.
 * @param value - The raw input value.
 * @returns The value to store, or `undefined` when the type or option is wrong.
 */
function readValue(entry: SettingEntry, value: unknown): number | string | undefined {
  if (entry.kind === "number") {
    if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
    // Clamp. Values stay off the step grid (the spec's own rDur default, 1.04, is off it), except
    // counts such as grid columns, which are rounded to a whole number first.
    const whole = "integer" in entry ? Math.round(value) : value;
    return Math.min(entry.max, Math.max(entry.min, whole));
  }
  return typeof value === "string" && entry.options.includes(value) ? value : undefined;
}

/**
 * Builds settings from untrusted input, such as parsed JSON from the Load settings box.
 *
 * Known keys with the right type are used and numbers are clamped to their range.
 * Unknown keys and invalid values are ignored, so those settings keep their defaults.
 * The input is not changed.
 *
 * @param input - Any value. Anything but a plain object counts as an empty object.
 * @returns The settings and the list of keys that were applied.
 */
export function parseSettings(input: unknown): ParsedSettings {
  const settings = defaultSettings();
  const applied: ParsedSettings["applied"] = [];
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { settings, applied };
  }

  const source = input as Record<string, unknown>;
  // Writing through a wider type because the value's type varies per key.
  const target: Record<string, unknown> = settings;

  // Walking our own keys, not the input's, means `__proto__` can never be written.
  for (const key of SETTING_KEYS) {
    const value = readValue(SETTINGS_SPEC[key], source[key]);
    if (value === undefined) continue;
    target[key] = value;
    applied.push(key);
  }

  for (const key of COLOR_KEYS) {
    const value = source[key];
    if (typeof value !== "string" || !COLOR_PATTERN.test(value)) continue;
    settings[key] = value;
    applied.push(key);
  }

  const result: ParsedSettings = { settings, applied };
  const version = source.version;
  if (typeof version === "number" && Number.isFinite(version) && version > SETTINGS_VERSION) {
    result.newerVersion = version;
  }
  return result;
}
