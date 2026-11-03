// Tests for src/render/grid-renderer.ts, from the spec's grid reveal drawing rules.
// Runs in Chromium (see BROWSER_TESTS in vitest.config.ts), and checks drawn pixels.

import { describe, expect, it } from "vitest";
import { cubicBezier } from "../../src/math/easing.ts";
import {
  drawGridFrame,
  isGridStyle,
  prepareGridEffect,
  type GridStyle,
  type PreparedGrid,
} from "../../src/render/grid-renderer.ts";
import { glyphAt, HEX_CHARS, measureRamp } from "../../src/grid/ramps.ts";
import { defaultSettings } from "../../src/schema/defaults.ts";
import type { Settings } from "../../src/schema/types.ts";

const INK = { ink: "rgb(0, 0, 255)" };
const linear = cubicBezier(0, 0, 1, 1);

/** Builds a prepared grid by hand: every cell starts at once, at scale 1, with linear easing. */
function prepared(
  style: GridStyle,
  cols: number,
  rows: number,
  darkness: number[],
  extra: Partial<PreparedGrid> = {},
): PreparedGrid {
  const count = cols * rows;
  const rgb = new Uint8ClampedArray(count * 3);
  darkness.forEach((d, i) => rgb.fill(Math.round(255 * (1 - d)), i * 3, i * 3 + 3));
  const result: PreparedGrid = {
    style,
    grid: { cols, rows, rgb, darkness: Float64Array.from(darkness) },
    order: new Float64Array(count),
    spread: 0.5,
    startScale: 1,
    ease: linear,
    fontFamily: "monospace",
    ...extra,
  };
  if (style === "mosaic" && !extra.fills) {
    result.fills = darkness.map(
      (_d, i) => `rgb(${rgb[i * 3]}, ${rgb[i * 3 + 1]}, ${rgb[i * 3 + 2]})`,
    );
  }
  if ((style === "hex" || style === "binary") && !extra.ramp) {
    result.ramp = measureRamp(HEX_CHARS, "monospace");
  }
  return result;
}

/** Draws one frame on a new canvas and returns its context. */
function draw(width: number, height: number, grid: PreparedGrid, p: number) {
  const context = new OffscreenCanvas(width, height).getContext("2d", {
    willReadFrequently: true,
  })!;
  drawGridFrame(context, grid, INK, p);
  return context;
}

/** Reads one pixel as [r, g, b, a]. */
const pixel = (context: OffscreenCanvasRenderingContext2D, x: number, y: number) => [
  ...context.getImageData(x, y, 1, 1).data,
];

/** Counts pixels with any alpha. */
function inked(context: OffscreenCanvasRenderingContext2D) {
  const { data } = context.getImageData(0, 0, context.canvas.width, context.canvas.height);
  let count = 0;
  for (let i = 3; i < data.length; i += 4) if ((data[i] as number) > 0) count++;
  return count;
}

/** Sums alpha over the canvas, in whole pixels, so anti-aliased edges count by their share. */
function coverage(context: OffscreenCanvasRenderingContext2D) {
  const { data } = context.getImageData(0, 0, context.canvas.width, context.canvas.height);
  let sum = 0;
  for (let i = 3; i < data.length; i += 4) sum += data[i] as number;
  return sum / 255;
}

describe("isGridStyle", () => {
  it("is true for the four grid effects only", () => {
    const all: Settings["imageFx"][] = [
      "dots",
      "hex",
      "binary",
      "mosaic",
      "blur",
      "crossfade",
      "wipe",
      "zoom",
    ];
    expect(all.filter(isGridStyle)).toEqual(["dots", "hex", "binary", "mosaic"]);
  });
});

describe("drawGridFrame timeline", () => {
  it("draws nothing at p = 0", () => {
    expect(inked(draw(40, 40, prepared("mosaic", 2, 2, [1, 1, 1, 1]), 0))).toBe(0);
  });

  it("leaves the canvas empty at p = 1, even over an earlier frame", () => {
    const grid = prepared("mosaic", 2, 2, [1, 1, 1, 1]);
    const context = draw(40, 40, grid, 0.5);
    expect(inked(context)).toBeGreaterThan(0);
    drawGridFrame(context, grid, INK, 1);
    expect(inked(context)).toBe(0);
  });

  it("reveals columns from the left first with the left origin", () => {
    // Order = u, spread 0.6, p = 0.2 so gp = 0.25: local = (0.25 - 0.6u) / 0.4 gives 0.625,
    // 0.125, and below 0 for the last two columns. Alpha = min(1, 4 x local): 1, 0.5, 0, 0.
    const grid = prepared("mosaic", 4, 1, [1, 1, 1, 1], {
      order: Float64Array.from([0, 1 / 3, 2 / 3, 1]),
      spread: 0.6,
    });
    const context = draw(40, 10, grid, 0.2);
    const alphaAt = (col: number) => pixel(context, col * 10 + 5, 5)[3] as number;
    expect(alphaAt(0)).toBe(255);
    expect(alphaAt(1)).toBeCloseTo(128, -1);
    expect(alphaAt(2)).toBe(0);
    expect(alphaAt(3)).toBe(0);
  });

  it("fades the cell in: alpha = min(1, 4 x local)", () => {
    // Order 0 and spread 0.5 give local = gp / 0.5. At p = 0.05, gp = 0.0625 and local = 0.125,
    // so alpha is 0.5.
    const context = draw(10, 10, prepared("mosaic", 1, 1, [1]), 0.05);
    expect(pixel(context, 5, 5)[3]).toBeCloseTo(128, -1);
  });

  it("fades the whole layer out after p = 0.8", () => {
    // effectOpacity(0.9) = 1 - smoothstep(0.8, 1, 0.9) = 0.5.
    const context = draw(10, 10, prepared("mosaic", 1, 1, [1]), 0.9);
    expect(pixel(context, 5, 5)[3]).toBeCloseTo(128, -1);
  });

  it("scales cells from startScale down to 1", () => {
    // A 3 x 3 grid of 10 px cells where only the middle cell has started. At p = 0.2, gp = 0.25
    // and the middle cell's local is 0.5 (the others are below 0). With startScale 3 and linear
    // easing its scale is lerp(3, 1, 0.5) = 2.
    const order = Float64Array.from([1, 1, 1, 1, 0, 1, 1, 1, 1]);
    const grid = prepared("mosaic", 3, 3, Array(9).fill(1), { order, startScale: 3, spread: 0.5 });
    const context = draw(30, 30, grid, 0.2);
    // Scale 2 makes the middle tile 20 x 20, from 5 to 25.
    expect(pixel(context, 6, 15)[3]).toBeGreaterThan(0);
    expect(pixel(context, 3, 15)[3]).toBe(0);
    expect(pixel(context, 24, 24)[3]).toBeGreaterThan(0);
    expect(pixel(context, 27, 27)[3]).toBe(0);
  });

  it("gives the same pixels every time", () => {
    const grid = prepared("dots", 3, 2, [1, 0.5, 0.2, 0.9, 0.1, 0.7]);
    const a = draw(60, 40, grid, 0.6).getImageData(0, 0, 60, 40).data;
    const b = draw(60, 40, grid, 0.6).getImageData(0, 0, 60, 40).data;
    expect(a).toEqual(b);
  });

  it("resets the transform and alpha afterwards", () => {
    const context = draw(30, 30, prepared("hex", 3, 3, Array(9).fill(1)), 0.5);
    expect(context.globalAlpha).toBe(1);
    expect(context.getTransform().isIdentity).toBe(true);
  });
});

describe("drawGridFrame dots", () => {
  it("sizes the dot by darkness: radius = cell x 0.5 x scale x (0.2 + 0.8 d)", () => {
    // One 40 px cell, scale 1: radius 20 at d = 1 and 12 at d = 0.5.
    const full = draw(40, 40, prepared("dots", 1, 1, [1]), 0.8);
    const half = draw(40, 40, prepared("dots", 1, 1, [0.5]), 0.8);
    // 16 px right of center: inside radius 20, outside radius 12.
    expect(pixel(full, 36, 20)[3]).toBe(255);
    expect(pixel(half, 36, 20)[3]).toBe(0);
    expect(pixel(half, 30, 20)[3]).toBe(255);
  });

  it.each([
    [1, 100],
    [0.5, 60],
    [0.08, 26.4],
  ])("covers the area of a circle at darkness %s (radius %s)", (d, radius) => {
    // A 200 px cell, so anti-aliased edges are a small share of the area.
    const area = coverage(draw(200, 200, prepared("dots", 1, 1, [d]), 0.8));
    expect(area / (Math.PI * radius * radius)).toBeCloseTo(1, 2);
  });

  it("draws in the ink color", () => {
    expect(pixel(draw(40, 40, prepared("dots", 1, 1, [1]), 0.8), 20, 20)).toEqual([0, 0, 255, 255]);
  });

  it("skips cells below 0.08 darkness", () => {
    expect(inked(draw(40, 40, prepared("dots", 1, 1, [0.079]), 0.8))).toBe(0);
    expect(inked(draw(40, 40, prepared("dots", 1, 1, [0.08]), 0.8))).toBeGreaterThan(0);
  });

  it("keeps dots round in cells that are not square", () => {
    // 40 x 20 cell: the smaller side, 20, sets the radius (10 at d = 1).
    const context = draw(40, 20, prepared("dots", 1, 1, [1]), 0.8);
    expect(pixel(context, 20 + 12, 10)[3]).toBe(0);
    expect(pixel(context, 20 + 8, 10)[3]).toBe(255);
  });
});

describe("drawGridFrame mosaic", () => {
  it("draws every cell in its own color, light ones included", () => {
    const context = draw(20, 10, prepared("mosaic", 2, 1, [1, 0]), 0.8);
    expect(pixel(context, 5, 5)).toEqual([0, 0, 0, 255]);
    expect(pixel(context, 15, 5)).toEqual([255, 255, 255, 255]);
  });

  it("covers the canvas with no gaps at scale 1, also with cells that are not square", () => {
    // 10 x 20 cells: tiles sized by the smaller side would leave gaps above and below.
    const context = draw(30, 20, prepared("mosaic", 3, 1, Array(3).fill(1)), 0.8);
    const { data } = context.getImageData(0, 0, 30, 20);
    for (let i = 3; i < data.length; i += 4) expect(data[i]).toBe(255);
  });

  it("leaves no seams where tile edges fall between pixels", () => {
    // 50 / 7 and 30 / 4 give cells of about 7.14 x 7.5 px. Anti-aliased edges that meet
    // mid-pixel would each be partly transparent, leaving light lines between tiles.
    const context = draw(50, 30, prepared("mosaic", 7, 4, Array(28).fill(1)), 0.8);
    const { data } = context.getImageData(0, 0, 50, 30);
    for (let i = 3; i < data.length; i += 4) expect(data[i]).toBe(255);
  });
});

describe("drawGridFrame characters", () => {
  it("draws the ramp's glyph, centered, at cell x 1.15", () => {
    const grid = prepared("hex", 1, 1, [1]);
    const context = draw(40, 40, grid, 0.8);

    const reference = new OffscreenCanvas(40, 40).getContext("2d")!;
    reference.font = `${40 * 1.15}px monospace`;
    reference.textAlign = "center";
    reference.textBaseline = "middle";
    reference.fillStyle = INK.ink;
    reference.fillText(glyphAt(grid.ramp!, 1), 20, 20);

    expect(context.getImageData(0, 0, 40, 40).data).toEqual(
      reference.getImageData(0, 0, 40, 40).data,
    );
  });

  it("uses denser glyphs for darker cells", () => {
    const dark = inked(draw(40, 40, prepared("hex", 1, 1, [1]), 0.8));
    const light = inked(draw(40, 40, prepared("hex", 1, 1, [0.1]), 0.8));
    expect(dark).toBeGreaterThan(light);
  });

  it("skips cells below 0.08 darkness", () => {
    expect(inked(draw(40, 40, prepared("binary", 1, 1, [0.05]), 0.8))).toBe(0);
  });
});

describe("prepareGridEffect", () => {
  const photo = () => {
    const canvas = new OffscreenCanvas(200, 100);
    const context = canvas.getContext("2d")!;
    context.fillStyle = "#fff";
    context.fillRect(0, 0, 200, 100);
    context.fillStyle = "#000";
    context.fillRect(0, 0, 100, 100);
    return canvas;
  };
  const settings = (overrides: Partial<Settings>): Settings => ({
    ...defaultSettings(),
    ...overrides,
  });

  it("samples cols x rows from the photo's aspect ratio", () => {
    const result = prepareGridEffect(photo(), settings({ imageFx: "dots", cols: 16 }));
    expect([result.grid.cols, result.grid.rows]).toEqual([16, 8]);
    expect(result.order).toHaveLength(128);
    expect(result.ramp).toBeUndefined();
    expect(result.fills).toBeUndefined();
  });

  it("copies the reveal settings it draws with", () => {
    const result = prepareGridEffect(
      photo(),
      settings({ imageFx: "dots", spread: 0.3, startScale: 1.5, rEase: "linear" }),
    );
    expect([result.style, result.spread, result.startScale]).toEqual(["dots", 0.3, 1.5]);
    expect(result.ease(0.25)).toBeCloseTo(0.25, 5);
  });

  it("orders cells by the origin", () => {
    const result = prepareGridEffect(
      photo(),
      settings({ imageFx: "dots", cols: 16, origin: "right" }),
    );
    expect(result.order[0]).toBe(1);
    expect(result.order[15]).toBe(0);
  });

  it("measures the hex and binary ramps in the given font", () => {
    const hex = prepareGridEffect(photo(), settings({ imageFx: "hex" }), {
      fontFamily: "monospace",
    });
    const binary = prepareGridEffect(photo(), settings({ imageFx: "binary" }));
    expect(hex.ramp?.chars).toBe(HEX_CHARS);
    expect(hex.ramp?.font).toBe("40px monospace");
    expect(hex.fontFamily).toBe("monospace");
    expect(binary.ramp?.chars).toBe("01");
    expect(binary.fontFamily).toBe('"IBM Plex Mono", monospace');
  });

  it("builds one CSS color per cell for mosaic", () => {
    const result = prepareGridEffect(photo(), settings({ imageFx: "mosaic", cols: 16 }));
    expect(result.fills).toHaveLength(128);
    expect(result.fills?.[0]).toBe("rgb(0, 0, 0)");
    expect(result.fills?.[15]).toBe("rgb(255, 255, 255)");
  });

  it("rejects image effects that are not grids", () => {
    expect(() => prepareGridEffect(photo(), settings({ imageFx: "blur" }))).toThrow(RangeError);
  });
});
