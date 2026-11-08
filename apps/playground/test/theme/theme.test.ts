// Tests for src/theme/theme.ts, in Chromium (real localStorage, MutationObserver, matchMedia).

import { afterEach, describe, expect, it, vi } from "vitest";
import indexHtml from "../../index.html?raw";
import {
  applyThemeChoice,
  readThemeChoice,
  THEME_STORAGE_KEY,
  toThemeChoice,
  watchTheme,
} from "../../src/theme/theme.ts";

afterEach(() => {
  localStorage.removeItem(THEME_STORAGE_KEY);
  vi.restoreAllMocks();
});

describe("theme choice", () => {
  it("narrows unknown values to system", () => {
    expect(["light", "dark", "system", null, "blue"].map(toThemeChoice)).toEqual([
      "light",
      "dark",
      "system",
      "system",
      "system",
    ]);
  });

  it("sets data-theme and saves light or dark; system removes both", () => {
    applyThemeChoice("light");
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(readThemeChoice()).toBe("light");
    applyThemeChoice("system");
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
    expect(readThemeChoice()).toBe("system");
  });

  it("still applies the theme when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    expect(() => applyThemeChoice("dark")).not.toThrow();
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(readThemeChoice()).toBe("system");
  });

  it("uses the same storage key as the script in index.html", () => {
    expect(indexHtml).toContain(`localStorage.getItem("${THEME_STORAGE_KEY}")`);
  });

  it("calls back when data-theme changes, until stopped", async () => {
    const callback = vi.fn();
    const stop = watchTheme(callback);
    document.documentElement.dataset.theme = "light";
    await Promise.resolve();
    expect(callback).toHaveBeenCalledTimes(1);
    stop();
    document.documentElement.dataset.theme = "dark";
    await Promise.resolve();
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
