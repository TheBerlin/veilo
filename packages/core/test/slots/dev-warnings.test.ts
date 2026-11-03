// Tests for src/slots/dev-warnings.ts. Runs in Node, where process.env.NODE_ENV can be changed;
// in the browser project Vite fixes it at transform time, as a bundler would.

import { afterEach, describe, expect, it, vi } from "vitest";
import { isDevBuild, warnSlotProblems } from "../../src/slots/dev-warnings.ts";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("isDevBuild", () => {
  it("is true outside production", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(isDevBuild()).toBe(true);
    vi.stubEnv("NODE_ENV", "test");
    expect(isDevBuild()).toBe(true);
  });

  it("is false in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(isDevBuild()).toBe(false);
  });

  it("is true when there is no process at all, as in a plain script tag", () => {
    // Core has no Node types, so process is reached through a typed view of globalThis.
    const global = globalThis as { process?: unknown };
    const saved = global.process;
    delete global.process;
    try {
      expect(isDevBuild()).toBe(true);
    } finally {
      global.process = saved;
    }
  });
});

describe("warnSlotProblems", () => {
  it("prints each problem with the Veilo prefix", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    warnSlotProblems(["one.", "two."], true);
    expect(warn.mock.calls).toEqual([["Veilo: one."], ["Veilo: two."]]);
  });

  it("prints nothing when turned off", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    warnSlotProblems(["one."], false);
    expect(warn).not.toHaveBeenCalled();
  });
});
