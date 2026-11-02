/**
 * defaults.ts: builds the default settings from the table.
 * Layer 0 (pure). Must not import DOM code.
 */

import { SETTING_KEYS, SETTINGS_SPEC } from "./ranges.ts";
import type { Settings } from "./types.ts";
import { SETTINGS_VERSION } from "./version.ts";

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
