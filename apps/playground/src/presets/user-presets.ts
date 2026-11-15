// user-presets.ts: the user's own saved presets as plain data: names, list changes, matching the
// current settings, and reading a saved list back. No storage or React here; see
// user-presets-store.ts for those.

import { parseSettings, type Settings } from "@veilo/core";

/** A preset the user saved. */
export interface UserPreset {
  /** Stable id, so a rename keeps the row and its focus. */
  id: string;
  /** The name shown in the list, 1 to {@link NAME_MAX} characters, unique ignoring case. */
  name: string;
  /** The full settings, custom colors included. */
  settings: Settings;
}

/** The most characters a preset name may have. */
export const NAME_MAX = 40;

/** Messages for names that cannot be used. */
export const NAME_ERRORS = {
  empty: "Give the preset a name.",
  long: `Use at most ${NAME_MAX} characters.`,
  taken: "You already have a preset with this name.",
} as const;

/**
 * A name as it is stored: spaces at both ends removed.
 *
 * @param name - The typed name.
 * @returns The trimmed name.
 */
export function cleanName(name: string): string {
  return name.trim();
}

/**
 * Says why a name cannot be used.
 *
 * @param name - The typed name.
 * @param presets - The current list.
 * @param exceptId - A preset to ignore when checking for a clash (the one being renamed).
 * @returns The message, or `""` when the name can be used.
 */
export function nameError(name: string, presets: readonly UserPreset[], exceptId?: string): string {
  const clean = cleanName(name);
  if (clean === "") return NAME_ERRORS.empty;
  if (clean.length > NAME_MAX) return NAME_ERRORS.long;
  const lower = clean.toLowerCase();
  const taken = presets.some((p) => p.id !== exceptId && p.name.toLowerCase() === lower);
  return taken ? NAME_ERRORS.taken : "";
}

/**
 * A name that does not clash with the list: the name itself, or `Name (2)`, `Name (3)` and so
 * on. Used where the user cannot pick a new name, such as an imported file.
 *
 * @param name - The wanted name, already clean and at most {@link NAME_MAX} characters.
 * @param presets - The current list.
 * @returns A free name, cut so the number still fits in {@link NAME_MAX} characters.
 */
export function uniqueName(name: string, presets: readonly UserPreset[]): string {
  const taken = new Set(presets.map((p) => p.name.toLowerCase()));
  if (!taken.has(name.toLowerCase())) return name;
  for (let n = 2; ; n++) {
    const suffix = ` (${n})`;
    const candidate = name.slice(0, NAME_MAX - suffix.length).trimEnd() + suffix;
    if (!taken.has(candidate.toLowerCase())) return candidate;
  }
}

/**
 * Whether two settings objects hold the same values, custom colors included.
 *
 * @param a - Full settings.
 * @param b - Full settings.
 * @returns True when every key has the same value in both.
 */
export function sameSettings(a: Settings, b: Settings): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]) as Set<keyof Settings>;
  for (const key of keys) if (a[key] !== b[key]) return false;
  return true;
}

/**
 * Reads one saved preset, checking every part. Settings go through core's parseSettings, so
 * values are clamped and unknown keys dropped.
 *
 * @param value - One entry of a saved list or file, unchecked.
 * @returns The preset without an id (the caller assigns one), or `null` when the entry has no
 *   usable name or no settings object.
 */
export function readPresetEntry(value: unknown): Omit<UserPreset, "id"> | null {
  const entry = value as { name?: unknown; settings?: unknown } | null;
  if (typeof entry !== "object" || entry === null) return null;
  if (typeof entry.name !== "string") return null;
  const name = cleanName(entry.name).slice(0, NAME_MAX).trimEnd();
  if (name === "") return null;
  const { settings } = entry;
  if (typeof settings !== "object" || settings === null || Array.isArray(settings)) return null;
  return { name, settings: parseSettings(settings).settings };
}

/**
 * Makes a new id for a preset.
 *
 * @returns A random UUID.
 */
export function newPresetId(): string {
  return crypto.randomUUID();
}
