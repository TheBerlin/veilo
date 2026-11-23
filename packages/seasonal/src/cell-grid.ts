// cell-grid.ts: the cell-grid look: a flake that assembles from scrambled characters, locks into
// shaded cells in five brightness steps, then erodes into dots. Time is stepped at ten steps a
// second, and the flake drifts in whole cells, so the movement reads as a grid and not as a blur.

import { drawFlake } from "./flake.ts";
import { clamp, easeOut, hash, lerp } from "./math.ts";
import { monoFont, sampleScene, type CanvasState, type SceneFn } from "./state.ts";

/** The cell-grid effects repeat every 8 seconds: assemble, hold from 4.2 s, erode from 6.4 s. */
export const CELL_PERIOD = 8;

/** The characters a cell shows before it locks. */
const GLYPHS = "k3sf93mq7zv8gh2x%&@#a5b6";

/** How the cells look. */
export type CellMode = "dots" | "cells" | "frost";

/**
 * The flake of the cell grid, as a scene: it grows over 4.2 s and drifts by whole cells.
 *
 * @param c - The scene context.
 * @param t - Time in seconds.
 * @param st - The canvas state.
 */
const cellScene: SceneFn = (c, t, st) => {
  const g = easeOut((t % CELL_PERIOD) / 4.2);
  const radius = Math.min(st.W, st.H) * 0.46;
  const dy = Math.round(Math.sin(t * 0.6) * 3) * st.cw;
  drawFlake(c, st.W / 2, st.H / 2 + dy, radius, -Math.PI / 2, g, st.shape);
};

/**
 * Draws one rounded cell.
 *
 * @param ctx - The context; its fill style is already set.
 * @param x - Left.
 * @param y - Top.
 * @param size - Width and height.
 * @param radius - Corner radius; half the size makes a dot.
 */
function cell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  radius: number,
): void {
  ctx.beginPath();
  ctx.roundRect(x, y, size, size, Math.max(0, radius));
  ctx.fill();
}

/**
 * Draws one frame of a cell-grid effect.
 *
 * Side effects: clears and draws the visible canvas.
 *
 * @param st - The canvas state.
 * @param t - Time in seconds.
 * @param mode - Dots, cells on a visible grid, or frost-tinted cells with sparkles.
 */
export function renderCellGrid(st: CanvasState, t: number, mode: CellMode): void {
  const ts = Math.floor(t * 10) / 10;
  const phase = ts % CELL_PERIOD;
  const tick = Math.floor(ts * 10);
  const data = sampleScene(st, ts, cellScene);
  const { ctx, pal: p, cw: size, cols, rows } = st;
  ctx.setTransform(st.dpr, 0, 0, st.dpr, 0, 0);
  ctx.clearRect(0, 0, st.W, st.H);
  const ox = (st.W - cols * size) / 2;
  const oy = (st.H - rows * size) / 2;
  const steps = mode === "frost" ? p.frost : [p.border, p.borderStrong, p.muted, p.text, p.accent];
  if (mode === "dots") {
    // A faint dot at every cell: the grid the flake is made on.
    ctx.fillStyle = p.border;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++)
        ctx.fillRect(ox + x * size + size / 2 - 0.5, oy + y * size + size / 2 - 0.5, 1, 1);
    }
  } else if (mode === "cells") {
    ctx.strokeStyle = p.border;
    ctx.globalAlpha = 0.45;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= cols; x++) {
      ctx.moveTo(ox + x * size + 0.5, oy);
      ctx.lineTo(ox + x * size + 0.5, oy + rows * size);
    }
    for (let y = 0; y <= rows; y++) {
      ctx.moveTo(ox, oy + y * size + 0.5);
      ctx.lineTo(ox + cols * size, oy + y * size + 0.5);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  const lock = clamp((phase - 1.3) / 2.6, 0, 1);
  const erode = phase > 6.4 ? (phase - 6.4) / 1.6 : 0;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const v = data[(y * cols + x) * 4]! / 255;
      if (v < 0.08) continue;
      const h = hash(x, y, 3);
      const cx = ox + x * size + size / 2;
      const cy = oy + y * size + size / 2;
      if (h > lock) {
        // Not locked yet: a scrambled character that changes every step.
        ctx.font = monoFont(8);
        ctx.fillStyle = p.muted;
        ctx.globalAlpha = 0.3 + 0.5 * v;
        ctx.fillText(GLYPHS.charAt(Math.floor(hash(x, y, tick + 7) * GLYPHS.length)), cx, cy + 3);
        ctx.globalAlpha = 1;
        continue;
      }
      const q = erode > 0 ? clamp((erode - h * 0.8) / 0.2, 0, 1) : 0;
      if (q >= 1) continue;
      let level = v < 0.22 ? 0 : v < 0.45 ? 1 : v < 0.7 ? 2 : v < 0.92 ? 3 : 4;
      if (phase > 4.2 && phase < 6.4 && hash(x, y, tick) > 0.95) level = Math.min(4, level + 1);
      const s = size * (mode === "dots" ? 0.36 + 0.08 * level : 0.88) * (1 - 0.55 * q);
      // Eroding cells turn round and shrink into dots before they go.
      const radius = mode === "dots" ? s / 2 : lerp(size * 0.2, s / 2, q);
      ctx.globalAlpha = 1 - q * q;
      ctx.fillStyle = steps[level]!;
      if (level >= 3) {
        ctx.shadowColor = steps[level]!;
        ctx.shadowBlur = size * 1.1;
      } else {
        ctx.shadowBlur = 0;
      }
      cell(ctx, cx - s / 2, cy - s / 2, s, radius);
    }
  }
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
  if (mode === "frost" && phase > 4.2 && phase < 6.8) {
    // A few sparkles on the brightest cells, each a small plus that blinks.
    ctx.fillStyle = steps[4]!;
    for (let k = 0; k < 7; k++) {
      const sx = Math.floor(hash(k, Math.floor(ts * 2), 5) * cols);
      const sy = Math.floor(hash(k, Math.floor(ts * 2), 6) * rows);
      if (data[(sy * cols + sx) * 4]! / 255 < 0.8) continue;
      const scx = ox + sx * size + size / 2;
      const scy = oy + sy * size + size / 2;
      const d = size * 1.3;
      ctx.fillRect(scx - 1, scy - d - 1, 2, 3);
      ctx.fillRect(scx - 1, scy + d - 2, 2, 3);
      ctx.fillRect(scx - d - 1, scy - 1, 3, 2);
      ctx.fillRect(scx + d - 2, scy - 1, 3, 2);
    }
  }
  ctx.textAlign = "start";
}
