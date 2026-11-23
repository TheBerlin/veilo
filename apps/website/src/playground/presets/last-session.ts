// last-session.ts: remembers the playground's settings and preview content in this browser, so
// reopening the page shows what was there when it was left. Saved as
// `{ version: 1, settings, content }` under one key (`content` is optional: values saved before
// it existed still load); both are checked by their stores on the way back in.

import type { Settings } from "@veilo-ui/core";
import type { Content, ContentStore } from "../state/content-store.ts";
import type { SettingsStore } from "../state/settings-store.ts";
import type { KeyValueStorage } from "./browser-storage.ts";

/** localStorage key of the last session. */
export const LAST_SESSION_KEY = "veilo-last-session";

/** Format number of the saved value. A later format gets a new number. */
export const LAST_SESSION_VERSION = 1;

/** How long after the last change the session is written, in ms (a slider drag is many). */
export const LAST_SESSION_DELAY = 300;

/** A saved session, unchecked. */
export interface LastSession {
  /** The settings object. */
  settings: object;
  /** The preview content, when one was saved. */
  content?: unknown;
}

/**
 * Reads the saved session.
 *
 * @param storage - Where it is saved, or `null` when storage cannot be used.
 * @returns The saved session, unchecked, or `null` when nothing usable is saved (none, not JSON,
 *   another format version, or no settings object).
 */
export function readLastSession(storage: KeyValueStorage | null): LastSession | null {
  let value: unknown;
  try {
    const text = storage?.getItem(LAST_SESSION_KEY);
    if (text == null) return null;
    value = JSON.parse(text);
  } catch {
    // Blocked storage or a value that is not JSON: start without it.
    return null;
  }
  const saved = value as { version?: unknown; settings?: unknown; content?: unknown } | null;
  if (saved?.version !== LAST_SESSION_VERSION) return null;
  const { settings, content } = saved;
  if (typeof settings !== "object" || settings === null || Array.isArray(settings)) return null;
  return content === undefined ? { settings } : { settings, content };
}

/**
 * Saves the session.
 *
 * @param storage - Where to save it.
 * @param settings - The current settings.
 * @param content - The current preview content, when there is a content store.
 * @returns Whether it was saved (false when storage is full or blocked).
 */
export function saveLastSession(
  storage: KeyValueStorage,
  settings: Settings,
  content?: Content,
): boolean {
  try {
    const value = { version: LAST_SESSION_VERSION, settings, content };
    storage.setItem(LAST_SESSION_KEY, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/** Options of {@link watchLastSession}. */
export interface WatchLastSessionOptions {
  /** The preview content to save and watch as well. */
  content?: ContentStore;
  /** Wait after the last change, in ms. Defaults to {@link LAST_SESSION_DELAY}. */
  delay?: number;
  /**
   * Where `pagehide` is listened for, to write a pending change before the page goes away.
   * Defaults to `window` when there is one.
   */
  events?: EventTarget;
}

/**
 * Saves the session shortly after each change to the settings or the content, and at once when
 * the page is hidden for good (`pagehide`), so a change right before closing the tab is not lost.
 * Side effects: a timer and a `pagehide` listener, both removed by the returned function.
 *
 * @param store - The settings store.
 * @param storage - Where to save.
 * @param options - Content store, delay and event target.
 * @returns A function that stops watching (a pending change is dropped).
 */
export function watchLastSession(
  store: SettingsStore,
  storage: KeyValueStorage,
  options: WatchLastSessionOptions = {},
): () => void {
  const { delay = LAST_SESSION_DELAY, content } = options;
  const events = options.events ?? (typeof window === "undefined" ? undefined : window);
  let timer: ReturnType<typeof setTimeout> | undefined;

  const flush = () => {
    if (timer === undefined) return;
    clearTimeout(timer);
    timer = undefined;
    saveLastSession(storage, store.getState().settings, content?.getState().content);
  };
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(flush, delay);
  };

  const unsubscribeSettings = store.subscribe((state, previous) => {
    if (state.settings !== previous.settings) schedule();
  });
  const unsubscribeContent = content?.subscribe((state, previous) => {
    if (state.content !== previous.content) schedule();
  });
  events?.addEventListener("pagehide", flush);

  return () => {
    unsubscribeSettings();
    unsubscribeContent?.();
    clearTimeout(timer);
    timer = undefined;
    events?.removeEventListener("pagehide", flush);
  };
}
