// bars.ts: Snow on the bars: a skeleton card, and snow that falls and settles on its bars as
// characters, then melts. The simulation steps at 30 per second from time zero, so any time can be
// drawn (a still frame, or a time before the last one) by running it forward from the start.

import { clamp, hash } from "./math.ts";
import { monoFont, type CanvasState } from "./state.ts";

/** The bars effect repeats every 14 seconds: snow for 11, melt for 3. */
export const BARS_PERIOD = 14;

/** One bar (or the thumbnail) the snow can land on, and how deep the snow is along its top. */
interface Target {
  x: number;
  y: number;
  w: number;
  h: number;
  r: number;
  /** Snow depth per character column, in rows (0 to about 3). */
  cap: number[];
}

/** One falling flake. */
interface Drop {
  x: number;
  y: number;
  /** Fall speed in pixels per second. */
  v: number;
  /** Sway phase. */
  ph: number;
  /** 0 small, 1 medium, 2 large. */
  size: number;
}

/** The snow simulation. */
export interface BarsSim {
  /** Simulated time in seconds. */
  t: number;
  targets: Target[];
  drops: Drop[];
}

/**
 * Lays out the skeleton card: a thumbnail on the left and three bars on the right.
 *
 * @param st - The canvas state.
 * @returns The targets, with empty snow caps.
 */
function layout(st: CanvasState): Target[] {
  const pad = 20;
  const thumb = 64;
  const x0 = pad + thumb + 16;
  const right = st.W - x0 - pad;
  const top = (st.H - thumb) / 2;
  const boxes = [
    { x: pad, y: top, w: thumb, h: thumb, r: 8 },
    { x: x0, y: top, w: right * 0.62, h: 18, r: 6 },
    { x: x0, y: top + 28, w: right, h: 12, r: 6 },
    { x: x0, y: top + 48, w: right * 0.7, h: 12, r: 6 },
  ];
  return boxes.map((box) => ({ ...box, cap: new Array<number>(Math.ceil(box.w / st.cw)).fill(0) }));
}

/**
 * Starts the simulation at time zero.
 *
 * @param st - The canvas state.
 * @returns A fresh simulation.
 */
function init(st: CanvasState): BarsSim {
  const drops: Drop[] = [];
  for (let i = 0; i < 44; i++) {
    drops.push({
      x: hash(i, 1, 7) * st.W,
      y: hash(i, 2, 7) * st.H,
      v: 14 + hash(i, 3, 7) * 26,
      ph: hash(i, 4, 7) * 6.28,
      size: Math.floor(hash(i, 5, 7) * 3),
    });
  }
  return { t: 0, targets: layout(st), drops };
}

/**
 * Advances the simulation by one step: drops fall and sway, land on a target, or wrap to the top;
 * in the last three seconds of the period the snow melts and no more lands.
 *
 * @param st - The canvas state.
 * @param sim - The simulation, changed in place.
 * @param dt - Step length in seconds.
 */
function step(st: CanvasState, sim: BarsSim, dt: number): void {
  sim.t += dt;
  const melting = sim.t % BARS_PERIOD > 11;
  sim.drops.forEach((drop, i) => {
    drop.y += drop.v * dt;
    drop.x += Math.sin(sim.t * 0.9 + drop.ph) * 9 * dt;
    let landed = false;
    if (!melting) {
      for (const target of sim.targets) {
        if (landed) break;
        if (drop.x < target.x || drop.x > target.x + target.w) continue;
        const col = clamp(Math.floor((drop.x - target.x) / st.cw), 0, target.cap.length - 1);
        const top = target.y - target.cap[col]! * 6;
        if (drop.y >= top - 2 && drop.y - drop.v * dt < top + 2 && target.cap[col]! < 3.2) {
          target.cap[col]! += 0.45;
          if (col > 0) target.cap[col - 1]! += 0.2;
          if (col < target.cap.length - 1) target.cap[col + 1]! += 0.2;
          landed = true;
        }
      }
    }
    if (landed || drop.y > st.H + 10) {
      drop.y = -10;
      drop.x = hash(i, Math.floor(sim.t * 10), 11) * st.W;
    }
  });
  if (melting) {
    for (const target of sim.targets) {
      for (let i = 0; i < target.cap.length; i++) target.cap[i]! *= Math.pow(0.55, dt);
    }
  }
}

/**
 * Draws one frame: the skeleton, the snow on it, and the flakes in the air.
 *
 * Side effects: clears and draws the visible canvas; advances (or restarts) the simulation.
 *
 * @param st - The canvas state.
 * @param t - Time in seconds.
 */
export function renderBars(st: CanvasState, t: number): void {
  if (!st.sim || t < st.sim.t) st.sim = init(st);
  const dt = 1 / 30;
  while (st.sim.t + dt <= t) step(st, st.sim, dt);
  const { ctx, pal: p } = st;
  const sim = st.sim;
  ctx.setTransform(st.dpr, 0, 0, st.dpr, 0, 0);
  ctx.clearRect(0, 0, st.W, st.H);
  ctx.fillStyle = p.base;
  for (const target of sim.targets) {
    ctx.beginPath();
    ctx.roundRect(target.x, target.y, target.w, target.h, target.r);
    ctx.fill();
  }
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = p.snow;
  ctx.font = monoFont(12);
  for (const target of sim.targets) {
    target.cap.forEach((depth, i) => {
      if (depth < 0.15) return;
      const rows = Math.ceil(depth);
      for (let k = 0; k < rows; k++) {
        const top = k === rows - 1;
        ctx.globalAlpha = top ? 0.9 : 0.75;
        ctx.fillText(
          top ? (depth - k < 0.5 ? "." : ":") : "=",
          target.x + i * st.cw,
          target.y - k * 6 + 2,
        );
      }
    });
  }
  const sizes = [10, 13, 17];
  const chars = [".", "*", "*"];
  for (const drop of sim.drops) {
    ctx.font = monoFont(sizes[drop.size]!);
    ctx.globalAlpha = 0.55 + drop.size * 0.2;
    ctx.fillText(chars[drop.size]!, drop.x, drop.y);
  }
  ctx.globalAlpha = 1;
}
