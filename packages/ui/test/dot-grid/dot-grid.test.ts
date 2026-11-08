// dot-grid.test.ts: tests for the dot-grid engine (noise, strength, lifecycle).

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createDotGrid,
  dotHash,
  dotStrength,
  DOT_GRID_DEFAULTS,
  valueNoise,
} from "../../src/dot-grid/dot-grid.ts";

const canvases: HTMLCanvasElement[] = [];
function makeCanvas(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.style.cssText = "position:fixed;inset:0;width:200px;height:120px";
  document.body.append(canvas);
  canvases.push(canvas);
  return canvas;
}
afterEach(() => {
  canvases.splice(0).forEach((canvas) => canvas.remove());
  vi.restoreAllMocks();
});

const litPixels = (canvas: HTMLCanvasElement): number => {
  const data = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height).data;
  let count = 0;
  for (let k = 3; k < data.length; k += 4) if (data[k]! > 0) count++;
  return count;
};

describe("noise", () => {
  it("hash and noise are deterministic and in [0, 1)", () => {
    expect(dotHash(3, 4, 5, 7)).toBe(dotHash(3, 4, 5, 7));
    for (let k = 0; k < 50; k++) {
      const n = valueNoise(k * 0.37, k * 0.11, k * 0.05, 7);
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(1);
    }
  });

  it("noise equals the hash at lattice points", () => {
    expect(valueNoise(2, 3, 1, 7)).toBeCloseTo(dotHash(2, 3, 1, 7), 12);
  });

  it("strength stays in [0, 1] and cover 0 lights nothing", () => {
    for (let i = 0; i < 30; i++) {
      const s = dotStrength(DOT_GRID_DEFAULTS, i, i * 2, i * 0.3);
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(1);
      expect(dotStrength({ ...DOT_GRID_DEFAULTS, cover: 0 }, i, i, 0)).toBe(0);
    }
  });
});

describe("createDotGrid", () => {
  it("sizes the canvas to its box and draws the same frame for the same time", () => {
    const canvas = makeCanvas();
    const grid = createDotGrid(canvas, { still: true, cover: 0.8, vignette: 0, color: "#eeeeee" });
    expect(canvas.width).toBe(Math.round(200 * Math.min(devicePixelRatio, 2)));
    grid.drawAt(1.5);
    const first = canvas.toDataURL();
    grid.drawAt(0);
    grid.drawAt(1.5);
    expect(canvas.toDataURL()).toBe(first);
    expect(litPixels(canvas)).toBeGreaterThan(0);
    grid.destroy();
  });

  it("draws nothing with cover 0 and the pointer away", () => {
    const grid = createDotGrid(makeCanvas(), { still: true, cover: 0 });
    grid.drawAt(2);
    expect(litPixels(canvases[0]!)).toBe(0);
    grid.destroy();
  });

  it("does not animate when still or paused, and destroy stops the loop and listeners", () => {
    const request = vi.spyOn(window, "requestAnimationFrame");
    const removed = vi.spyOn(window, "removeEventListener");
    const still = createDotGrid(makeCanvas(), { still: true });
    expect(request).not.toHaveBeenCalled();
    still.destroy();

    const moving = createDotGrid(makeCanvas());
    expect(request).toHaveBeenCalledTimes(1);
    const cancel = vi.spyOn(window, "cancelAnimationFrame");
    moving.pause();
    expect(cancel).toHaveBeenCalled();
    moving.resume();
    moving.destroy();
    expect(removed.mock.calls.map((call) => call[0])).toEqual(
      expect.arrayContaining(["pointermove", "pointerup", "blur"]),
    );
  });

  it("reads the dot color from --veilo-text", () => {
    const canvas = makeCanvas();
    canvas.style.setProperty("--veilo-text", "rgb(255, 0, 0)");
    const grid = createDotGrid(canvas, { still: true, cover: 0.9, vignette: 0, alphaMin: 1 });
    grid.drawAt(0);
    const data = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height).data;
    let red = 0;
    for (let k = 0; k < data.length; k += 4) if (data[k + 3] === 255 && data[k] === 255) red++;
    expect(red).toBeGreaterThan(0);
    grid.destroy();
  });
});
