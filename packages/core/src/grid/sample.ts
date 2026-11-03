// sample.ts: downscales the photo into grid cells with a color and a darkness each.
// Layer 1 (needs a canvas). One of the two grid files allowed to use dom/.

import { context2d, createCanvas, type Canvas } from "../dom/canvas.ts";

/** The photo reduced to a grid: what the grid renderers draw from. */
export interface SampledGrid {
  /** Columns in the grid. */
  cols: number;
  /** Rows in the grid. */
  rows: number;
  /** Cell colors, 3 bytes (R, G, B) per cell, row by row like `cellOrder`. */
  rgb: Uint8ClampedArray;
  /** Cell darkness after the contrast stretch: 0 is the lightest cell, 1 the darkest. */
  darkness: Float64Array;
}

/** A width and height in pixels. */
export interface Size {
  width: number;
  height: number;
}

// Rec. 709 luma weights, as the spec gives them.
const LUMA_R = 0.2126;
const LUMA_G = 0.7152;
const LUMA_B = 0.0722;

// The smallest darkness range the stretch divides by, so a nearly flat image stays faint instead
// of having its noise stretched to full contrast.
const MIN_SPAN = 0.05;

/**
 * Works out how many rows a grid needs to keep the image's aspect ratio.
 *
 * @param cols - Columns in the grid, at least 1.
 * @param width - Image width, above 0.
 * @param height - Image height, above 0.
 * @returns The row count, at least 1.
 */
export function gridRows(cols: number, width: number, height: number): number {
  return Math.max(1, Math.round((cols * height) / width));
}

/**
 * Plans the halving steps that come before the final downscale.
 *
 * The image is halved while half its size still covers the grid in both directions. The final
 * step then shrinks by less than 2x, where bilinear smoothing still averages every pixel, so
 * fine detail averages out instead of aliasing.
 *
 * @param source - The image size.
 * @param cols - Columns in the grid.
 * @param rows - Rows in the grid.
 * @returns The size after each halving, in order. Empty when the image is already small.
 */
export function halvingSizes(source: Size, cols: number, rows: number): Size[] {
  const sizes: Size[] = [];
  let { width, height } = source;
  while (Math.floor(width / 2) >= cols && Math.floor(height / 2) >= rows) {
    width = Math.floor(width / 2);
    height = Math.floor(height / 2);
    sizes.push({ width, height });
  }
  return sizes;
}

/**
 * Turns the pixels of an image already downscaled to `cols x rows` into grid cells.
 *
 * Semi-transparent pixels are blended onto white first, because the photo canvas has a white
 * background. Darkness is `1 - luminance` on the stored sRGB values, then stretched so the
 * lightest cell is 0 and the darkest is 1.
 *
 * @param pixels - RGBA bytes, row by row, as `getImageData` returns them. Length
 *   `cols * rows * 4`.
 * @param cols - Columns in the grid.
 * @param rows - Rows in the grid.
 * @returns The sampled grid.
 */
export function cellsFromPixels(
  pixels: Uint8ClampedArray,
  cols: number,
  rows: number,
): SampledGrid {
  const count = cols * rows;
  const rgb = new Uint8ClampedArray(count * 3);
  const darkness = new Float64Array(count);
  let min = Infinity;
  let max = -Infinity;

  for (let i = 0; i < count; i++) {
    const alpha = (pixels[i * 4 + 3] as number) / 255;
    // Blend onto white: color * alpha + 255 * (1 - alpha).
    const white = 255 * (1 - alpha);
    const r = (pixels[i * 4] as number) * alpha + white;
    const g = (pixels[i * 4 + 1] as number) * alpha + white;
    const b = (pixels[i * 4 + 2] as number) * alpha + white;

    rgb[i * 3] = r;
    rgb[i * 3 + 1] = g;
    rgb[i * 3 + 2] = b;

    const dark = 1 - (LUMA_R * r + LUMA_G * g + LUMA_B * b) / 255;
    darkness[i] = dark;
    if (dark < min) min = dark;
    if (dark > max) max = dark;
  }

  // Every value lies between min and max, and span >= max - min, so the result stays in 0..1.
  const span = Math.max(max - min, MIN_SPAN);
  for (let i = 0; i < count; i++) darkness[i] = ((darkness[i] as number) - min) / span;

  return { cols, rows, rgb, darkness };
}

/**
 * Samples a photo into a `cols x rows` grid.
 *
 * Draws the photo onto temporary canvases (halving large images first), reads back the final
 * `cols x rows` pixels and converts them with {@link cellsFromPixels}. The source is not changed.
 * Meant to run once per image during prepare, not per frame.
 *
 * @param source - The photo canvas or bitmap, at least 1 x 1 pixel.
 * @param cols - Columns in the grid, at least 1.
 * @param rows - Rows in the grid, at least 1. Use {@link gridRows} to keep the aspect ratio.
 * @returns The sampled grid.
 */
export function sampleGrid(source: Canvas | ImageBitmap, cols: number, rows: number): SampledGrid {
  let current: Canvas | ImageBitmap = source;

  for (const size of [...halvingSizes(source, cols, rows), { width: cols, height: rows }]) {
    const next = createCanvas(size.width, size.height);
    context2d(next).drawImage(current, 0, 0, size.width, size.height);
    current = next;
  }

  const pixels = context2d(current as Canvas).getImageData(0, 0, cols, rows).data;
  return cellsFromPixels(pixels, cols, rows);
}
