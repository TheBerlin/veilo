/**
 * grid-renderer.ts: draws one frame of the dots, hex, binary and mosaic reveals.
 * Layer 2. Draws on a canvas it is given; no timers and no state between frames.
 */

import type { Canvas, Context2D } from "../dom/canvas.ts";
import { cellAlpha, cellProgress, cellScale } from "../grid/cell-timeline.ts";
import { cellOrder } from "../grid/order.ts";
import {
  BINARY_CHARS,
  DEFAULT_GLYPH_FONT,
  glyphAt,
  HEX_CHARS,
  measureRamp,
  type GlyphRamp,
} from "../grid/ramps.ts";
import { gridRows, sampleGrid, type SampledGrid } from "../grid/sample.ts";
import { resolveEasing, type EasingFunction } from "../math/easing.ts";
import type { Settings } from "../schema/types.ts";
import { effectOpacity, gridProgress } from "../timeline/reveal-timeline.ts";
import { isGridStyle, type GridStyle } from "./grid-style.ts";

/** Everything a grid frame needs, computed once per image and settings change. */
export interface PreparedGrid {
  /** The drawing style. */
  style: GridStyle;
  /** The sampled photo. */
  grid: SampledGrid;
  /** Each cell's start order, from 0 to 1, row by row. */
  order: Float64Array;
  /** The `spread` setting. */
  spread: number;
  /** The `startScale` setting. */
  startScale: number;
  /** The reveal easing. */
  ease: EasingFunction;
  /** The font family characters are drawn in. Measured and drawn in the same one. */
  fontFamily: string;
  /** The glyph ramp, for `hex` and `binary` only. */
  ramp?: GlyphRamp;
  /** Each cell's CSS color, for `mosaic` only. */
  fills?: string[];
}

/** Options for {@link prepareGridEffect}. */
export interface GridPrepareOptions {
  /** CSS font family list for `hex` and `binary`. Defaults to IBM Plex Mono. */
  fontFamily?: string;
}

/** Options for {@link drawGridFrame} that can change without preparing again. */
export interface GridDrawOptions {
  /** The CSS color of dots and characters, from the theme's `--veilo-ink`. */
  ink: string;
}

// Dots and characters below this darkness are skipped, so light backgrounds stay empty.
const MIN_DARKNESS = 0.08;
// Character size relative to the cell, before the cell's scale.
const GLYPH_SIZE = 1.15;
// The smallest dot is 20% of the full radius; darkness grows it to 100%.
const DOT_BASE = 0.2;

/**
 * Prepares a grid reveal: samples the photo, orders the cells and, for character styles,
 * measures the glyph ramp.
 *
 * This is the expensive step, so run it once per image and settings change, not per frame.
 * The ramp is measured with whatever font is ready now; prepare again once it has loaded.
 *
 * @param source - The photo canvas or bitmap.
 * @param settings - The settings. `imageFx` must be a grid style.
 * @param options - Font options.
 * @returns The prepared grid for {@link drawGridFrame}.
 * @throws RangeError when `imageFx` is not a grid style.
 */
export function prepareGridEffect(
  source: Canvas | ImageBitmap,
  settings: Settings,
  options: GridPrepareOptions = {},
): PreparedGrid {
  const style = settings.imageFx;
  if (!isGridStyle(style)) throw new RangeError(`Veilo: "${style}" is not a grid effect.`);

  const fontFamily = options.fontFamily ?? DEFAULT_GLYPH_FONT;
  const cols = settings.cols;
  const rows = gridRows(cols, source.width, source.height);
  const grid = sampleGrid(source, cols, rows);
  const prepared: PreparedGrid = {
    style,
    grid,
    order: cellOrder(cols, rows, settings.origin),
    spread: settings.spread,
    startScale: settings.startScale,
    ease: resolveEasing(settings, "r"),
    fontFamily,
  };

  if (style === "hex" || style === "binary") {
    prepared.ramp = measureRamp(style === "hex" ? HEX_CHARS : BINARY_CHARS, fontFamily);
  }
  if (style === "mosaic") {
    // Built once here, so frames do not create a color string per cell.
    prepared.fills = Array.from(grid.darkness, (_d, i) => {
      const { rgb } = grid;
      return `rgb(${rgb[i * 3]}, ${rgb[i * 3 + 1]}, ${rgb[i * 3 + 2]})`;
    });
  }
  return prepared;
}

/**
 * Draws the grid reveal at progress `p`, replacing everything on the canvas.
 *
 * Cells fill the whole canvas, centered on a `cols x rows` grid. The layer fades out from
 * `p = 0.8` and is empty at `p = 1`; the real photo's opacity is the caller's job
 * (`photoOpacity`). The same input always gives the same pixels.
 *
 * @param context - The 2D context of the effect canvas. Its transform, alpha, fill and font are
 *   changed; transform and alpha are reset afterwards.
 * @param prepared - From {@link prepareGridEffect}.
 * @param options - Drawing options such as the ink color.
 * @param p - Reveal progress, from 0 to 1.
 */
export function drawGridFrame(
  context: Context2D,
  prepared: PreparedGrid,
  options: GridDrawOptions,
  p: number,
): void {
  const { width, height } = context.canvas;
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.globalAlpha = 1;
  context.clearRect(0, 0, width, height);

  const fade = effectOpacity(p);
  if (fade <= 0) return;

  const { style, grid, order, spread, startScale, ease, ramp, fills } = prepared;
  const { cols, rows, darkness } = grid;
  const gp = gridProgress(p);
  const cellWidth = width / cols;
  const cellHeight = height / rows;
  // Cells are nearly square; dots and characters use the smaller side to keep their shape.
  const cell = Math.min(cellWidth, cellHeight);

  context.fillStyle = options.ink;
  if (ramp) {
    // Set once per frame at scale 1; each cell scales it with the transform, which is much
    // cheaper than parsing a new font string per cell.
    context.font = `${cell * GLYPH_SIZE}px ${prepared.fontFamily}`;
    context.textAlign = "center";
    context.textBaseline = "middle";
  }

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const i = row * cols + col;
      const progress = cellProgress(gp, order[i] as number, spread);
      if (progress <= 0) continue;
      const dark = darkness[i] as number;
      if (style !== "mosaic" && dark < MIN_DARKNESS) continue;

      const scale = cellScale(progress, startScale, ease);
      const x = (col + 0.5) * cellWidth;
      const y = (row + 0.5) * cellHeight;
      context.globalAlpha = cellAlpha(progress) * fade;

      if (style === "dots") {
        const radius = cell * 0.5 * scale * (DOT_BASE + (1 - DOT_BASE) * dark);
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
      } else if (style === "mosaic") {
        // Full cell width and height, so at scale 1 the tiles cover the canvas. Edges are
        // rounded to whole pixels: neighbours then share an exact edge, where two anti-aliased
        // half-covered edges would leave a light seam between them.
        const halfWidth = (cellWidth * scale) / 2;
        const halfHeight = (cellHeight * scale) / 2;
        const left = Math.round(x - halfWidth);
        const top = Math.round(y - halfHeight);
        context.fillStyle = (fills as string[])[i] as string;
        context.fillRect(
          left,
          top,
          Math.round(x + halfWidth) - left,
          Math.round(y + halfHeight) - top,
        );
      } else {
        context.setTransform(scale, 0, 0, scale, x, y);
        context.fillText(glyphAt(ramp as GlyphRamp, dark), 0, 0);
      }
    }
  }

  context.setTransform(1, 0, 0, 1, 0, 0);
  context.globalAlpha = 1;
}
