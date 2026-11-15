// last-session.ts: remembers the playground's settings in this browser, so reopening the page
// shows what was there when it was left. Saved as `{ version: 1, settings }` under one key; the
// settings inside are checked by the settings store on the way back in, like any other input.

import type { Settings } from "@veilo/core";
import type { SettingsStore } from "../state/settings-store.ts";
import type { KeyValueStorage } from "./browser-storage.ts";

/** localStorage key of the last session. */
export const LAST_SESSION_KEY = "veilo-last-session";

/** Format number of the saved value. A later format gets a new number. */
export const LAST_SESSION_VERSION = 1;

/** How long after the last change the settings are written, in ms (a slider drag is many). */
export const LAST_SESSION_DELAY = 300;

/**
 * Reads the saved settings.
 *
 * @param storage - Where they are saved, or `null` when storage cannot be used.
 * @returns The saved settings, unchecked, or `null` when nothing usable is saved (none, not JSON,
 *   another format version, or no settings object).
 */
export function readLastSession(storage: KeyValueStorage | null): object | null {
  let value: unknown;
  try {
    const text = storage?.getItem(LAST_SESSION_KEY);
    if (text == null) return null;
    value = JSON.parse(text);
  } catch {
    // Blocked storage or a value that is not JSON: start without it.
    return null;
  }
  const saved = value as { version?: unknown; settings?: unknown } | null;
  if (saved?.version !== LAST_SESSION_VERSION) return null;
  const { settings } = saved;
  if (typeof settings !== "object" || settings === null || Array.isArray(settings)) return null;
  return settings;
}

/**
 * Saves the settings.
 *
 * @param storage - Where to save them.
 * @param settings - The current settings.
 * @returns Whether they were saved (false when storage is full or blocked).
 */
export function saveLastSession(storage: KeyValueStorage, settings: Settings): boolean {
  try {
    storage.setItem(LAST_SESSION_KEY, JSON.stringify({ version: LAST_SESSION_VERSION, settings }));
    return true;
  } catch {
    return false;
  }
}

/** Options of {@link watchLastSession}. */
export interface WatchLastSessionOptions {
  /** Wait after the last change, in ms. Defaults to {@link LAST_SESSION_DELAY}. */
  delay?: number;
  /**
   * Where `pagehide` is listened for, to write a pending change before the page goes away.
   * Defaults to `window` when there is one.
   */
  events?: EventTarget;
}

/**
 * Saves the store's settings shortly after each change, and at once when the page is hidden for
 * good (`pagehide`), so a change right before closing the tab is not lost. Side effects: a timer
 * and a `pagehide` listener, both removed by the returned function.
 *
 * @param store - The settings store.
 * @param storage - Where to save.
 * @param options - Delay and event target.
 * @returns A function that stops watching (a pending change is dropped).
 */
export function watchLastSession(
  store: SettingsStore,
  storage: KeyValueStorage,
  options: WatchLastSessionOptions = {},
): () => void {
  const { delay = LAST_SESSION_DELAY } = options;
  const events = options.events ?? (typeof window === "undefined" ? undefined : window);
  let timer: ReturnType<typeof setTimeout> | undefined;

  const flush = () => {
    if (timer === undefined) return;
    clearTimeout(timer);
    timer = undefined;
    saveLastSession(storage, store.getState().settings);
  };

  const unsubscribe = store.subscribe((state, previous) => {
    if (state.settings === previous.settings) return;
    clearTimeout(timer);
    timer = setTimeout(flush, delay);
  });
  events?.addEventListener("pagehide", flush);

  return () => {
    unsubscribe();
    clearTimeout(timer);
    timer = undefined;
    events?.removeEventListener("pagehide", flush);
  };
}
