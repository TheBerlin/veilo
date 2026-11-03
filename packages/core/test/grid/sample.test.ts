// Tests for src/grid/sample.ts, from the spec's sampling and contrast stretch rules.
// Runs in Chromium (see BROWSER_TESTS in vitest.config.ts), because sampleGrid draws on a canvas.

import { describe, expect, it } from "vitest";
import {
  cellsFromPixels,
  gridRows,
  halvingSizes,
  sampleGrid,
  type SampledGrid,
} from "../../src/grid/sample.ts";

/** Builds RGBA bytes from one [r, g, b, a] entry per pixel. */
const pixels = (...rgba: number[][]) => new Uint8ClampedArray(rgba.flat());

/** Reads the color of one cell. */
const colorAt = (grid: SampledGrid, i: number) => [...grid.rgb.subarray(i * 3, i * 3 + 3)];

/** Creates a canvas and paints it with the given function. */
function paint(
  width: number,
  height: number,
  draw: (c: OffscreenCanvasRenderingContext2D) => void,
) {
  const canvas = new OffscreenCanvas(width, height);
  draw(canvas.getContext("2d")!);
  return canvas;
}

describe("gridRows", () => {
  it("keeps a square image square", () => {
    expect(gridRows(64, 500, 500)).toBe(64);
  });

  it("follows wide and tall aspect ratios", () => {
    expect(gridRows(64, 1600, 900)).toBe(36);
    expect(gridRows(64, 900, 1600)).toBe(114);
  });

  it("rounds to the nearest row and never goes below 1", () => {
    expect(gridRows(16, 1000, 310)).toBe(5); // 4.96
    expect(gridRows(16, 10000, 1)).toBe(1);
  });
});

describe("halvingSizes", () => {
  it("halves while half the size still covers the grid", () => {
    expect(halvingSizes({ width: 1000, height: 1000 }, 64, 64)).toEqual([
      { width: 500, height: 500 },
      { width: 250, height: 250 },
      { width: 125, height: 125 },
    ]);
  });

  it("stops as soon as either direction would drop below the grid", () => {
    expect(halvingSizes({ width: 1600, height: 200 }, 64, 36)).toEqual([
      { width: 800, height: 100 },
      { width: 400, height: 50 },
    ]);
  });

  it("can land exactly on the grid size", () => {
    expect(halvingSizes({ width: 256, height: 128 }, 64, 32).at(-1)).toEqual({
      width: 64,
      height: 32,
    });
  });

  it("plans nothing for an image smaller than twice the grid", () => {
    expect(halvingSizes({ width: 127, height: 127 }, 64, 64)).toEqual([]);
    expect(halvingSizes({ width: 10, height: 10 }, 64, 64)).toEqual([]);
  });
});

describe("cellsFromPixels darkness", () => {
  it("uses the Rec. 709 weights", () => {
    // The black cell pins the stretch at 0..1, so the other cells keep their raw darkness.
    const grid = cellsFromPixels(
      pixels(
        [255, 0, 0, 255],
        [0, 255, 0, 255],
        [0, 0, 255, 255],
        [0, 0, 0, 255],
        [255, 255, 255, 255],
      ),
      5,
      1,
    );
    expect(grid.darkness[0]).toBeCloseTo(1 - 0.2126, 10);
    expect(grid.darkness[1]).toBeCloseTo(1 - 0.7152, 10);
    expect(grid.darkness[2]).toBeCloseTo(1 - 0.0722, 10);
  });

  it("stretches so the lightest cell is 0 and the darkest is 1", () => {
    const grid = cellsFromPixels(
      pixels([200, 200, 200, 255], [150, 150, 150, 255], [100, 100, 100, 255]),
      3,
      1,
    );
    expect(grid.darkness[0]).toBe(0);
    expect(grid.darkness[1]).toBeCloseTo(0.5, 10);
    expect(grid.darkness[2]).toBe(1);
  });

  it("divides by at least 0.05, so a nearly flat image stays faint", () => {
    // Raw darkness differs by 2/255 (about 0.0078), well under the 0.05 floor.
    const grid = cellsFromPixels(pixels([200, 200, 200, 255], [198, 198, 198, 255]), 2, 1);
    expect(grid.darkness[0]).toBe(0);
    expect(grid.darkness[1]).toBeCloseTo(2 / 255 / 0.05, 10);
  });

  it("gives every cell 0 on a flat image", () => {
    const grid = cellsFromPixels(pixels([40, 90, 10, 255], [40, 90, 10, 255]), 2, 1);
    expect([...grid.darkness]).toEqual([0, 0]);
  });
});

describe("cellsFromPixels colors and layout", () => {
  it("keeps opaque colors", () => {
    const grid = cellsFromPixels(pixels([12, 34, 56, 255]), 1, 1);
    expect(colorAt(grid, 0)).toEqual([12, 34, 56]);
  });

  it("blends transparent pixels onto white", () => {
    const grid = cellsFromPixels(pixels([0, 0, 0, 0], [0, 0, 0, 255], [0, 0, 0, 51]), 3, 1);
    expect(colorAt(grid, 0)).toEqual([255, 255, 255]);
    expect(grid.darkness[0]).toBe(0);
    // 20% black over white: 255 * 0.8 = 204.
    expect(colorAt(grid, 2)).toEqual([204, 204, 204]);
    expect(grid.darkness[2]).toBeCloseTo(0.2, 10);
  });

  it("lays cells out row by row", () => {
    // 2 x 2: only the cell at col 1, row 0 is black.
    const white = [255, 255, 255, 255];
    const grid = cellsFromPixels(pixels(white, [0, 0, 0, 255], white, white), 2, 2);
    expect([...grid.darkness]).toEqual([0, 1, 0, 0]);
    expect(grid.rgb).toHaveLength(12);
    expect([grid.cols, grid.rows]).toEqual([2, 2]);
  });
});

describe("sampleGrid", () => {
  it("averages each cell of a real canvas", () => {
    // Left half black, right half white, sampled to 4 x 2 through two halvings.
    const source = paint(256, 128, (c) => {
      c.fillStyle = "#fff";
      c.fillRect(0, 0, 256, 128);
      c.fillStyle = "#000";
      c.fillRect(0, 0, 128, 128);
    });
    const grid = sampleGrid(source, 4, 2);
    expect([...grid.darkness]).toEqual([1, 1, 0, 0, 1, 1, 0, 0]);
    expect(colorAt(grid, 0)).toEqual([0, 0, 0]);
    expect(colorAt(grid, 3)).toEqual([255, 255, 255]);
  });

  it("averages fine detail instead of aliasing it", () => {
    // One-pixel black and white stripes. Without the halving steps, a 64x downscale samples
    // only a few source pixels per cell and the cells come out black or white.
    const source = paint(512, 512, (c) => {
      c.fillStyle = "#fff";
      c.fillRect(0, 0, 512, 512);
      c.fillStyle = "#000";
      for (let x = 0; x < 512; x += 2) c.fillRect(x, 0, 1, 512);
    });
    const grid = sampleGrid(source, 8, 8);
    for (let i = 0; i < 64; i++) {
      for (const channel of colorAt(grid, i)) expect(channel).toBeGreaterThanOrEqual(120);
      for (const channel of colorAt(grid, i)) expect(channel).toBeLessThanOrEqual(136);
    }
  });

  it("samples a non-square image into cols x rows", () => {
    const source = paint(300, 100, (c) => {
      c.fillStyle = "rgb(255, 0, 0)";
      c.fillRect(0, 0, 300, 100);
    });
    const grid = sampleGrid(source, 9, gridRows(9, 300, 100));
    expect([grid.cols, grid.rows]).toEqual([9, 3]);
    expect(grid.darkness).toHaveLength(27);
    expect(colorAt(grid, 26)).toEqual([255, 0, 0]);
  });

  it("treats a transparent canvas as white", () => {
    const grid = sampleGrid(new OffscreenCanvas(40, 40), 4, 4);
    expect(colorAt(grid, 0)).toEqual([255, 255, 255]);
    expect(grid.darkness.every((d) => d === 0)).toBe(true);
  });

  it("does not change the source", () => {
    const source = paint(64, 64, (c) => {
      c.fillStyle = "rgb(10, 20, 30)";
      c.fillRect(0, 0, 64, 64);
    });
    sampleGrid(source, 8, 8);
    expect([...source.getContext("2d")!.getImageData(0, 0, 1, 1).data]).toEqual([10, 20, 30, 255]);
  });
});
