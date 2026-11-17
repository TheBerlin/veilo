// Tests for src/presets/last-session.ts, in Node with a fake storage and fake timers.

import { defaultSettings } from "@veilo/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { KeyValueStorage } from "../../src/presets/browser-storage.ts";
import {
  LAST_SESSION_DELAY,
  LAST_SESSION_KEY,
  readLastSession,
  saveLastSession,
  watchLastSession,
} from "../../src/presets/last-session.ts";
import { createContentStore } from "../../src/state/content-store.ts";
import { createSettingsStore } from "../../src/state/settings-store.ts";

/**
 * A storage backed by a Map, with a switch that makes writes fail like a full storage.
 *
 * @returns The storage, its entries and the switch.
 */
function fakeStorage() {
  const entries = new Map<string, string>();
  const state = { full: false };
  const storage: KeyValueStorage = {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => {
      if (state.full) throw new DOMException("Quota exceeded", "QuotaExceededError");
      entries.set(key, value);
    },
    removeItem: (key) => void entries.delete(key),
  };
  return { storage, entries, state };
}

/**
 * The settings saved under the last-session key.
 *
 * @param entries - The fake storage's entries.
 * @returns The parsed value, or undefined when nothing is saved.
 */
function saved(entries: Map<string, string>): unknown {
  const text = entries.get(LAST_SESSION_KEY);
  return text === undefined ? undefined : JSON.parse(text);
}

describe("readLastSession and saveLastSession", () => {
  it("round-trip the settings in a versioned value", () => {
    const { storage, entries } = fakeStorage();
    const settings = { ...defaultSettings(), effect: "wave" as const, baseColor: "#123456" };
    expect(saveLastSession(storage, settings)).toBe(true);
    expect(saved(entries)).toEqual({ version: 1, settings });
    expect(readLastSession(storage)).toEqual({ settings });
  });

  it("round-trip the preview content next to the settings", () => {
    const { storage, entries } = fakeStorage();
    const settings = defaultSettings();
    expect(
      saveLastSession(storage, settings, { ratio: "16:9", layout: "product", texts: {} }),
    ).toBe(true);
    expect(saved(entries)).toEqual({
      version: 1,
      settings,
      content: { ratio: "16:9", layout: "product", texts: {} },
    });
    expect(readLastSession(storage)).toEqual({
      settings,
      content: { ratio: "16:9", layout: "product", texts: {} },
    });
  });

  it("read nothing from no storage, an empty key or an unusable value", () => {
    expect(readLastSession(null)).toBeNull();
    const { storage, entries } = fakeStorage();
    expect(readLastSession(storage)).toBeNull();
    for (const text of [
      "not json",
      "null",
      "[]",
      '{"settings":{}}',
      '{"version":2,"settings":{}}',
      '{"version":1,"settings":null}',
      '{"version":1,"settings":[]}',
    ]) {
      entries.set(LAST_SESSION_KEY, text);
      expect(readLastSession(storage), text).toBeNull();
    }
  });

  it("read nothing when storage throws, and report a failed save", () => {
    const throwing: KeyValueStorage = {
      getItem: () => {
        throw new DOMException("Blocked", "SecurityError");
      },
      setItem: () => {
        throw new DOMException("Blocked", "SecurityError");
      },
      removeItem: () => {},
    };
    expect(readLastSession(throwing)).toBeNull();
    expect(saveLastSession(throwing, defaultSettings())).toBe(false);
  });

  it("leave checking to the store, which clamps a tampered value", () => {
    const { storage, entries } = fakeStorage();
    entries.set(LAST_SESSION_KEY, '{"version":1,"settings":{"lDur":999,"effect":"nope"}}');
    const store = createSettingsStore(readLastSession(storage)?.settings);
    expect(store.getState().settings.lDur).toBeLessThan(999);
    expect(store.getState().settings.effect).toBe(defaultSettings().effect);
  });
});

describe("watchLastSession with content", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("saves after a content change too, with both parts", () => {
    const { storage, entries } = fakeStorage();
    const store = createSettingsStore();
    const content = createContentStore();
    const stop = watchLastSession(store, storage, { content, events: new EventTarget() });
    content.getState().setRatio("3:4");
    vi.advanceTimersByTime(LAST_SESSION_DELAY);
    expect(saved(entries)).toEqual({
      version: 1,
      settings: store.getState().settings,
      content: { ratio: "3:4", layout: "product", texts: {} },
    });
    stop();
    content.getState().setRatio("1:1");
    vi.advanceTimersByTime(LAST_SESSION_DELAY);
    expect((saved(entries) as { content: { ratio: string } }).content.ratio).toBe("3:4");
  });
});

describe("watchLastSession", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("saves once, a short while after the last of several changes", () => {
    const { storage, entries } = fakeStorage();
    const store = createSettingsStore();
    const stop = watchLastSession(store, storage, { events: new EventTarget() });
    store.getState().set("cols", 40);
    vi.advanceTimersByTime(LAST_SESSION_DELAY - 1);
    store.getState().set("cols", 41);
    vi.advanceTimersByTime(LAST_SESSION_DELAY - 1);
    expect(saved(entries)).toBeUndefined();
    vi.advanceTimersByTime(1);
    expect(saved(entries)).toEqual({ version: 1, settings: store.getState().settings });
    expect(store.getState().settings.cols).toBe(41);
    stop();
  });

  it("writes a pending change at once when the page is hidden", () => {
    const { storage, entries } = fakeStorage();
    const events = new EventTarget();
    const store = createSettingsStore();
    const stop = watchLastSession(store, storage, { events });
    store.getState().set("effect", "pulse");
    events.dispatchEvent(new Event("pagehide"));
    expect((saved(entries) as { settings: { effect: string } }).settings.effect).toBe("pulse");
    stop();
  });

  it("ignores writes that change nothing, and stops cleanly", () => {
    const { storage, entries } = fakeStorage();
    const events = new EventTarget();
    const store = createSettingsStore();
    const stop = watchLastSession(store, storage, { events });
    store.getState().set("cols", store.getState().settings.cols);
    vi.advanceTimersByTime(LAST_SESSION_DELAY);
    expect(saved(entries)).toBeUndefined();
    store.getState().set("cols", 40);
    stop();
    vi.advanceTimersByTime(LAST_SESSION_DELAY);
    events.dispatchEvent(new Event("pagehide"));
    expect(saved(entries)).toBeUndefined();
  });

  it("keeps working when storage is full", () => {
    const { storage, entries, state } = fakeStorage();
    const store = createSettingsStore();
    const stop = watchLastSession(store, storage, { events: new EventTarget() });
    state.full = true;
    store.getState().set("cols", 40);
    expect(() => vi.advanceTimersByTime(LAST_SESSION_DELAY)).not.toThrow();
    state.full = false;
    store.getState().set("cols", 41);
    vi.advanceTimersByTime(LAST_SESSION_DELAY);
    expect((saved(entries) as { settings: { cols: number } }).settings.cols).toBe(41);
    stop();
  });
});
