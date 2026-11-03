/**
 * grid-style.ts: tells grid effects from the others, without loading the grid renderer.
 * Layer 2 (pure). Kept apart so the main entry can check this while the renderer, with its
 * sampling and glyph ramps, is loaded only when a grid effect is used.
 */

import type { Settings } from "../schema/types.ts";

/** The image effects drawn as a grid of cells. */
export type GridStyle = "dots" | "hex" | "binary" | "mosaic";

const GRID_STYLES: readonly string[] = ["dots", "hex", "binary", "mosaic"];

/**
 * Tells whether an image effect is drawn as a grid.
 *
 * @param imageFx - The `imageFx` setting.
 * @returns `true` for `dots`, `hex`, `binary` and `mosaic`.
 */
export function isGridStyle(imageFx: Settings["imageFx"]): imageFx is GridStyle {
  return GRID_STYLES.includes(imageFx);
}
