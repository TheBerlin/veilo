// user-presets-store.ts: the user's saved presets as a Zustand store, kept in localStorage under
// one versioned key. Without storage (blocked, or a frame request) the list lives in memory for
// the visit only.

import type { Settings } from "@veilo/core";
import { createStore, type StoreApi } from "zustand/vanilla";
import type { KeyValueStorage } from "./browser-storage.ts";
import {
  cleanName,
  newPresetId,
  readPresetEntry,
  uniqueName,
  type UserPreset,
} from "./user-presets.ts";

/** localStorage key of the saved presets. */
export const USER_PRESETS_KEY = "veilo-presets";

/** Format number of the saved list. A later format gets a new number. */
export const USER_PRESETS_VERSION = 1;

/** The store's state: the list plus the actions that change it. */
export interface UserPresetsState {
  /** The saved presets, in the order they were saved. */
  presets: UserPreset[];
  /** Whether the list is kept between visits (false when storage is blocked). */
  persistent: boolean;
  /**
   * Saves settings under a new name. The caller checks the name first with `nameError`.
   *
   * @returns The new preset.
   */
  add: (name: string, settings: Settings) => UserPreset;
  /** Renames a preset. The caller checks the name first with `nameError`. */
  rename: (id: string, name: string) => void;
  /** Replaces a preset's settings, for example with the current ones. */
  update: (id: string, settings: Settings) => void;
  /** Deletes a preset. */
  remove: (id: string) => void;
  /** Replaces the whole list, for Undo and import. */
  replaceAll: (presets: UserPreset[]) => void;
}

/** A user presets store instance. */
export type UserPresetsStore = StoreApi<UserPresetsState>;

/**
 * Reads the saved list, skipping entries that cannot be used. Names are made unique (an edited
 * or merged value could hold two equal ones) and ids are kept when they are unique strings.
 *
 * @param storage - Where the list is saved, or `null`.
 * @returns The presets, or an empty list when nothing usable is saved.
 */
export function readUserPresets(storage: KeyValueStorage | null): UserPreset[] {
  let value: unknown;
  try {
    const text = storage?.getItem(USER_PRESETS_KEY);
    if (text == null) return [];
    value = JSON.parse(text);
  } catch {
    return [];
  }
  const saved = value as { version?: unknown; presets?: unknown } | null;
  if (saved?.version !== USER_PRESETS_VERSION || !Array.isArray(saved.presets)) return [];
  const presets: UserPreset[] = [];
  const ids = new Set<string>();
  for (const raw of saved.presets) {
    const entry = readPresetEntry(raw);
    if (!entry) continue;
    const id = (raw as { id?: unknown }).id;
    const usable = typeof id === "string" && id !== "" && !ids.has(id) ? id : newPresetId();
    ids.add(usable);
    presets.push({ id: usable, name: uniqueName(entry.name, presets), settings: entry.settings });
  }
  return presets;
}

/**
 * Saves the list.
 *
 * @param storage - Where to save it.
 * @param presets - The list.
 * @returns Whether it was saved (false when storage is full or blocked).
 */
export function saveUserPresets(storage: KeyValueStorage, presets: UserPreset[]): boolean {
  try {
    storage.setItem(USER_PRESETS_KEY, JSON.stringify({ version: USER_PRESETS_VERSION, presets }));
    return true;
  } catch {
    return false;
  }
}

/**
 * Creates the store, starting from the saved list. Every change is saved at once (changes are
 * single clicks, unlike slider drags). Side effects: reads and writes `storage`.
 *
 * @param storage - Where the list is kept, or `null` to keep it in memory only.
 * @returns The store.
 */
export function createUserPresetsStore(storage: KeyValueStorage | null): UserPresetsStore {
  return createStore<UserPresetsState>()((setState, getState) => {
    /** Sets a new list and saves it; a failed save marks the list as not kept. */
    const commit = (presets: UserPreset[]) => {
      const persistent = storage ? saveUserPresets(storage, presets) : false;
      setState({ presets, persistent });
    };
    return {
      presets: readUserPresets(storage),
      persistent: storage !== null,
      add: (name, settings) => {
        const preset = { id: newPresetId(), name: cleanName(name), settings };
        commit([...getState().presets, preset]);
        return preset;
      },
      rename: (id, name) =>
        commit(getState().presets.map((p) => (p.id === id ? { ...p, name: cleanName(name) } : p))),
      update: (id, settings) =>
        commit(getState().presets.map((p) => (p.id === id ? { ...p, settings } : p))),
      remove: (id) => commit(getState().presets.filter((p) => p.id !== id)),
      replaceAll: (presets) => commit(presets),
    };
  });
}
