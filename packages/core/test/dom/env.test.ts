// Tests for src/dom/env.ts. Runs in Chromium (see BROWSER_TESTS in vitest.config.ts).

import { afterEach, describe, expect, it, vi } from "vitest";
import { browserScheduler, pixelRatio } from "../../src/dom/env.ts";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("browserScheduler", () => {
  const scheduler = browserScheduler();

  it("reads a clock that moves forward", async () => {
    const start = scheduler.now();
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(scheduler.now()).toBeGreaterThan(start);
  });

  it("runs frame callbacks, and not cancelled ones", async () => {
    const ran: string[] = [];
    scheduler.frame(() => ran.push("kept"));
    scheduler.cancelFrame(scheduler.frame(() => ran.push("cancelled")));
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    expect(ran).toEqual(["kept"]);
  });

  it("runs timeouts after their delay, and not cancelled ones", async () => {
    const ran: string[] = [];
    scheduler.timeout(() => ran.push("kept"), 10);
    scheduler.cancelTimeout(scheduler.timeout(() => ran.push("cancelled"), 10));
    expect(ran).toEqual([]);
    await new Promise((resolve) => setTimeout(resolve, 40));
    expect(ran).toEqual(["kept"]);
  });
});

describe("pixelRatio", () => {
  it.each([
    [1, 1],
    [1.5, 1.5],
    [2, 2],
    [3, 2],
    [0.5, 1],
    [0, 1],
  ])("reads devicePixelRatio %s as %s, capped at 2", (ratio, expected) => {
    vi.stubGlobal("devicePixelRatio", ratio);
    expect(pixelRatio()).toBe(expected);
  });
});
