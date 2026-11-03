/**
 * canvas.ts: creates drawing surfaces for sampling, ramps and rendering.
 * Layer 1 (browser). Touches browser globals only when called, never at import time.
 */

/** A canvas the engine draws on: an element in the page, or an offscreen one. */
export type Canvas = HTMLCanvasElement | OffscreenCanvas;

/** The 2D context of a {@link Canvas}. */
export type Context2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

/**
 * Creates a canvas that is not attached to the page.
 *
 * Uses `OffscreenCanvas` where available (all current browsers and workers), and a detached
 * `<canvas>` element otherwise.
 *
 * @param width - Width in pixels.
 * @param height - Height in pixels.
 * @returns The new canvas.
 */
export function createCanvas(width: number, height: number): Canvas {
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(width, height);
  return createCanvasElement(width, height);
}

/**
 * Creates a `<canvas>` element for showing in the page, which an `OffscreenCanvas` cannot do.
 *
 * @param width - Width in pixels.
 * @param height - Height in pixels.
 * @returns The new canvas element, not yet attached.
 */
export function createCanvasElement(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

/**
 * Gets the 2D context of a canvas.
 *
 * @param canvas - The canvas.
 * @param options - Context options, such as `willReadFrequently`.
 * @returns The 2D context.
 * @throws Error when the browser cannot create a 2D context, for example when it is out of
 *   canvas memory.
 */
export function context2d(canvas: Canvas, options?: CanvasRenderingContext2DSettings): Context2D {
  // Both canvas types have the same getContext at runtime; TypeScript cannot call a union of
  // their overloads, so the call goes through one of them.
  const context = (canvas as HTMLCanvasElement).getContext("2d", options) as Context2D | null;
  if (!context) throw new Error("Veilo: could not create a 2D canvas context.");
  return context;
}
