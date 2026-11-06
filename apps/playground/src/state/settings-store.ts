// settings-store.ts: the playground's one settings object, as a Zustand store.
// Every write goes through core's parseSettings, so the store only ever holds values the engine
// accepts: numbers clamped to their range, wrong types and unknown keys ignored.

import {
  defaultSettings,
  parseSettings,
  type ColorKey,
  type SettingKey,
  type Settings,
} from "@veilo/core";
import { useStore } from "zustand";
import { createStore, type StoreApi } from "zustand/vanilla";

/** A key of the settings object: a regular setting or an optional color override. */
export type AnySettingKey = SettingKey | ColorKey;

/** The store's state: plain data plus the actions that change it. */
export interface SettingsState {
  /** The current settings. Plain JSON, ready to export or share. */
  settings: Settings;
  /**
   * Changes one setting. Numbers are clamped; a value of the wrong type or an unknown option is
   * ignored.
   */
  set: <K extends AnySettingKey>(key: K, value: Settings[K]) => void;
  /** Changes several settings at once, for example a preset's overrides. */
  setMany: (values: Partial<Settings>) => void;
  /**
   * Replaces all settings with the given input over the defaults, as the Load settings box does.
   * Returns the keys that were applied, for the "N settings applied" message.
   */
  load: (input: unknown) => AnySettingKey[];
  /** Restores the default settings. */
  reset: () => void;
  /** Removes the custom base and highlight colors, so the theme's colors apply again. */
  resetColors: () => void;
}

/** A settings store instance. */
export type SettingsStore = StoreApi<SettingsState>;

/**
 * Applies changes to settings. Only the changes go through parseSettings, and only the keys it
 * accepts are copied, so a rejected value leaves that setting as it was (re-parsing the whole
 * object would reset it to the default instead).
 *
 * @param current - The current settings.
 * @param changes - The proposed changes, unchecked.
 * @returns New settings, or `current` itself when no value changed, so subscribers stay asleep.
 */
function merge(current: Settings, changes: object): Settings {
  const { settings: checked, applied } = parseSettings(changes);
  const changed = applied.filter((key) => checked[key] !== current[key]);
  if (changed.length === 0) return current;
  const next: Record<string, unknown> = { ...current };
  for (const key of changed) next[key] = checked[key];
  return next as Settings;
}

/**
 * The next state for new settings. Returning the same state object is how Zustand knows nothing
 * changed; a new `{ settings }` object would notify subscribers even with equal settings.
 *
 * @param state - The current state.
 * @param settings - The settings after a change.
 * @returns `state` itself when the settings are unchanged, otherwise a partial update.
 */
function withSettings(
  state: SettingsState,
  settings: Settings,
): SettingsState | { settings: Settings } {
  return settings === state.settings ? state : { settings };
}

/**
 * Creates a settings store. The app makes one; tests make a fresh one each.
 *
 * @param initial - Optional starting input, checked like `load`. Defaults to the default settings.
 * @returns The store.
 */
export function createSettingsStore(initial?: unknown): SettingsStore {
  return createStore<SettingsState>()((setState) => ({
    settings: initial === undefined ? defaultSettings() : parseSettings(initial).settings,
    set: (key, value) =>
      setState((state) => withSettings(state, merge(state.settings, { [key]: value }))),
    setMany: (values) => setState((state) => withSettings(state, merge(state.settings, values))),
    load: (input) => {
      const { settings, applied } = parseSettings(input);
      setState({ settings });
      return applied;
    },
    reset: () => setState({ settings: defaultSettings() }),
    resetColors: () =>
      setState((state) => {
        const { baseColor, highlightColor, ...rest } = state.settings;
        // Nothing to remove: keep the same state, so subscribers stay asleep.
        if (baseColor === undefined && highlightColor === undefined) return state;
        return { settings: rest as Settings };
      }),
  }));
}

/**
 * Reads one setting and re-renders only when that setting changes.
 *
 * @param store - The settings store.
 * @param key - The setting to read.
 * @returns The setting's current value.
 */
export function useSetting<K extends AnySettingKey>(store: SettingsStore, key: K): Settings[K] {
  return useStore(store, (state) => state.settings[key]);
}
