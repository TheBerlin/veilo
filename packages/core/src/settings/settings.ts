import {
  COLOR_KEYS,
  COLOR_PATTERN,
  SETTINGS_SPEC,
  SETTINGS_VERSION,
  type SettingEntry,
} from "./spec.ts";

/** Name of a setting in the table. */
export type SettingKey = keyof typeof SETTINGS_SPEC;

/** Name of an optional color override. */
export type ColorKey = (typeof COLOR_KEYS)[number];

/** The value type of a table row: `number`, or the union of its options. */
type SettingValue<Entry> = Entry extends { readonly kind: "number" }
  ? number
  : Entry extends { readonly options: readonly (infer Option)[] }
    ? Option
    : never;

/** The flat settings object shared by the playground, the exports and the packages. */
export type Settings = { version: typeof SETTINGS_VERSION } & {
  [Key in SettingKey]: SettingValue<(typeof SETTINGS_SPEC)[Key]>;
} & { [Key in ColorKey]?: string };

/** The result of {@link parseSettings}. */
export interface ParsedSettings {
  /** Complete settings: accepted input values over the defaults. */
  settings: Settings;
  /** Keys taken from the input, including clamped numbers. Its length is the spec's "N settings applied". */
  applied: (SettingKey | ColorKey)[];
}

const SETTING_KEYS = Object.keys(SETTINGS_SPEC) as SettingKey[];

/**
 * Builds a complete settings object from the table.
 *
 * @returns A new object with every default, safe for the caller to change. Color
 * overrides are absent because their defaults come from the theme.
 */
export function defaultSettings(): Settings {
  const defaults = SETTING_KEYS.map((key) => [key, SETTINGS_SPEC[key].default]);
  return { version: SETTINGS_VERSION, ...Object.fromEntries(defaults) } as Settings;
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
    // Clamp only. Values stay off the step grid: the spec's own rDur default, 1.04, is off it.
    return Math.min(entry.max, Math.max(entry.min, value));
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

  return { settings, applied };
}
