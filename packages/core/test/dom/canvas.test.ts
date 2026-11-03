// Tests for src/dom/canvas.ts. Runs in Chromium (see BROWSER_TESTS in vitest.config.ts).

import { afterEach, describe, expect, it, vi } from "vitest";
import { context2d, createCanvas } from "../../src/dom/canvas.ts";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createCanvas", () => {
  it("creates an OffscreenCanvas of the given size where available", () => {
    const canvas = createCanvas(3, 2);
    expect(canvas).toBeInstanceOf(OffscreenCanvas);
    expect([canvas.width, canvas.height]).toEqual([3, 2]);
  });

  it("falls back to a detached canvas element without OffscreenCanvas", () => {
    vi.stubGlobal("OffscreenCanvas", undefined);
    const canvas = createCanvas(3, 2);
    expect(canvas).toBeInstanceOf(HTMLCanvasElement);
    expect([canvas.width, canvas.height]).toEqual([3, 2]);
    expect((canvas as HTMLCanvasElement).isConnected).toBe(false);
  });
});

describe("context2d", () => {
  it.each([
    ["an OffscreenCanvas", () => new OffscreenCanvas(2, 2)],
    ["a canvas element", () => Object.assign(document.createElement("canvas"), { width: 2 })],
  ])("draws and reads back pixels on %s", (_name, make) => {
    const context = context2d(make());
    context.fillStyle = "rgb(255, 0, 0)";
    context.fillRect(0, 0, 1, 1);
    expect([...context.getImageData(0, 0, 1, 1).data]).toEqual([255, 0, 0, 255]);
  });

  it("throws when the canvas already has another context type", () => {
    const canvas = new OffscreenCanvas(2, 2);
    canvas.getContext("webgl2");
    expect(() => context2d(canvas)).toThrow("could not create a 2D canvas context");
  });
});
