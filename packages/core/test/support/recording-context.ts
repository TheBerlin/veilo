// A fake 2D context that logs what a frame draws instead of painting pixels, so frame snapshots
// are identical on every operating system. Not a test file itself; shared by render tests.

import type { Context2D } from "../../src/dom/canvas.ts";

/** A context that records draw calls, and the log it writes to. */
export interface RecordingContext {
  context: Context2D;
  /** One line per draw call, numbers rounded to 3 decimals. */
  log: string[];
}

/** Rounds for the log, so float noise in the last digits does not change a snapshot. */
const n = (value: number) => String(Number(value.toFixed(3)));

/**
 * Creates a recording context for a canvas of the given size.
 *
 * Supports what the grid renderer uses: clearRect, setTransform, globalAlpha, fillStyle, font,
 * text alignment, arc paths, fillRect and fillText.
 *
 * @param width - Canvas width in pixels.
 * @param height - Canvas height in pixels.
 * @returns The context and its log.
 */
export function recordingContext(width: number, height: number): RecordingContext {
  const log: string[] = [];
  let transform = [1, 0, 0, 1, 0, 0];
  let path: string[] = [];
  const state = {
    globalAlpha: 1,
    fillStyle: "#000",
    font: "10px sans-serif",
    textAlign: "start",
    textBaseline: "alphabetic",
  };

  /** The paint state every draw line ends with. */
  const paint = () => `alpha ${n(state.globalAlpha)} fill ${state.fillStyle}`;

  const context = {
    canvas: { width, height },
    get globalAlpha() {
      return state.globalAlpha;
    },
    set globalAlpha(value: number) {
      state.globalAlpha = value;
    },
    get fillStyle() {
      return state.fillStyle;
    },
    set fillStyle(value: string) {
      state.fillStyle = value;
    },
    get font() {
      return state.font;
    },
    set font(value: string) {
      state.font = value;
    },
    set textAlign(value: string) {
      state.textAlign = value;
    },
    set textBaseline(value: string) {
      state.textBaseline = value;
    },
    setTransform(...values: number[]) {
      transform = values;
    },
    getTransform() {
      return transform;
    },
    clearRect(x: number, y: number, w: number, h: number) {
      log.push(`clear ${n(x)} ${n(y)} ${n(w)} ${n(h)}`);
    },
    beginPath() {
      path = [];
    },
    arc(x: number, y: number, radius: number) {
      path.push(`circle ${n(x)} ${n(y)} r ${n(radius)}`);
    },
    fill() {
      for (const shape of path) log.push(`${shape} ${paint()}`);
    },
    fillRect(x: number, y: number, w: number, h: number) {
      log.push(`rect ${n(x)} ${n(y)} ${n(w)} ${n(h)} ${paint()}`);
    },
    fillText(text: string, x: number, y: number) {
      const [scale = 1, , , , dx = 0, dy = 0] = transform;
      log.push(
        `text ${JSON.stringify(text)} at ${n(dx + x * scale)} ${n(dy + y * scale)} ` +
          `scale ${n(scale)} font ${state.font} ${state.textAlign}/${state.textBaseline} ${paint()}`,
      );
    },
  };

  return { context: context as unknown as Context2D, log };
}
