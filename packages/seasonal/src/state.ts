// state.ts: what every renderer needs about one canvas: its size, its character grid, the hidden
// scene canvas it samples, and the palette. Also the sampling step that turns a scene into one
// coverage value per character cell.

import type { BarsSim } from "./bars.ts";
import type { FlakeShape } from "./flake.ts";
import { readPalette, type Palette } from "./palette.ts";

/** The monospace family of the character ramps (self-hosted by the app). */
const MONO = '"IBM Plex Mono", ui-monospace, Menlo, monospace';

/**
 * A font shorthand in the monospace family.
 *
 * @param px - Font size in pixels.
 * @returns A value for `context.font`.
 */
export function monoFont(px: number): string {
  return `${px}px ${MONO}`;
}

/** How a variant wants its character grid. */
export interface StateOptions {
  /** Font size of the characters, in pixels. */
  font?: number;
  /** Row height in pixels; defaults to 1.2 times the font size. */
  lineHeight?: number;
  /** Square cells of this size, instead of character-shaped ones. */
  cell?: number;
}

/** Everything one mounted canvas needs to draw a frame. */
export interface CanvasState {
  /** The visible canvas. */
  canvas: HTMLCanvasElement;
  /** Its 2D context, scaled to the device pixel ratio. */
  ctx: CanvasRenderingContext2D;
  /** Width in CSS pixels. */
  W: number;
  /** Height in CSS pixels. */
  H: number;
  /** Device pixel ratio, at most 2. */
  dpr: number;
  /** Font size of the characters. */
  fontPx: number;
  /** Cell width in CSS pixels. */
  cw: number;
  /** Cell height in CSS pixels. */
  ch: number;
  /** Columns of cells. */
  cols: number;
  /** Rows of cells. */
  rows: number;
  /** The hidden scene canvas, three times the grid in each direction. */
  scene: HTMLCanvasElement;
  /** Context of the scene canvas. */
  sceneCtx: CanvasRenderingContext2D;
  /** Context of a canvas that is exactly one pixel per cell. */
  cellCtx: CanvasRenderingContext2D;
  /** The theme's colors. */
  pal: Palette;
  /** The flake form, for the effects that draw a flake. */
  shape: FlakeShape;
  /** The falling-snow simulation of the bars effect, once started. */
  sim: BarsSim | null;
}

/** A function that draws one frame of a scene, in white on black, in CSS pixel coordinates. */
export type SceneFn = (c: CanvasRenderingContext2D, t: number, st: CanvasState) => void;

/**
 * Prepares a canvas: sizes it to its box, measures the character cell and creates the hidden
 * scene and cell canvases.
 *
 * Side effects: sets the canvas's width and height; creates two detached canvases.
 *
 * @param canvas - The visible canvas, already laid out.
 * @param options - The grid the variant wants.
 * @param shape - The flake form.
 * @returns The state, ready for a renderer.
 */
export function createCanvasState(
  canvas: HTMLCanvasElement,
  options: StateOptions,
  shape: FlakeShape,
): CanvasState {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = canvas.clientWidth || 280;
  const H = canvas.clientHeight || 190;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("A 2D canvas context is not available.");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const fontPx = options.font ?? 13;
  ctx.font = monoFont(fontPx);
  let cw = Math.max(5, ctx.measureText("M").width);
  let ch = options.lineHeight ?? Math.round(fontPx * 1.2);
  if (options.cell) {
    cw = options.cell;
    ch = options.cell;
  }
  const cols = Math.floor(W / cw);
  const rows = Math.floor(H / ch);
  const scene = document.createElement("canvas");
  scene.width = cols * 3;
  scene.height = rows * 3;
  const cells = document.createElement("canvas");
  cells.width = cols;
  cells.height = rows;
  const sceneCtx = scene.getContext("2d");
  const cellCtx = cells.getContext("2d", { willReadFrequently: true });
  if (!sceneCtx || !cellCtx) throw new Error("A 2D canvas context is not available.");
  return {
    canvas,
    ctx,
    W,
    H,
    dpr,
    fontPx,
    cw,
    ch,
    cols,
    rows,
    scene,
    sceneCtx,
    cellCtx,
    pal: readPalette(canvas),
    shape,
    sim: null,
  };
}

/**
 * Draws a scene on the hidden canvas and reduces it to one coverage value per cell.
 *
 * Side effects: draws on the state's hidden canvases.
 *
 * @param st - The canvas state.
 * @param t - Time in seconds.
 * @param scene - Draws the scene.
 * @returns RGBA bytes, `cols * rows` cells; the red channel is the coverage, 0 to 255.
 */
export function sampleScene(st: CanvasState, t: number, scene: SceneFn): Uint8ClampedArray {
  const c = st.sceneCtx;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalAlpha = 1;
  c.fillStyle = "#000";
  c.fillRect(0, 0, st.scene.width, st.scene.height);
  c.setTransform(st.scene.width / st.W, 0, 0, st.scene.height / st.H, 0, 0);
  scene(c, t, st);
  st.cellCtx.imageSmoothingEnabled = true;
  st.cellCtx.imageSmoothingQuality = "high";
  st.cellCtx.drawImage(st.scene, 0, 0, st.cols, st.rows);
  return st.cellCtx.getImageData(0, 0, st.cols, st.rows).data;
}
