// blizzard.ts: Blizzard dissolve: a whiteout of dense characters over a small piece of content;
// the cover thins out until the content shows, then snows back in. It shows how a reveal reads on
// real content: a heading, a line, and a button.

import { clamp, easeInOut, hash, vnoise } from "./math.ts";
import { monoFont, type CanvasState } from "./state.ts";

/** The blizzard repeats every 7 seconds: clear for 5, hold, snow back in for 0.8. */
export const BLIZZARD_PERIOD = 7;

/** Characters from empty to dense. */
const RAMP = " .:-=+*%@";

/**
 * Draws one frame: the content, then the snow cover over it.
 *
 * Side effects: clears and draws the visible canvas.
 *
 * @param st - The canvas state.
 * @param t - Time in seconds.
 */
export function renderBlizzard(st: CanvasState, t: number): void {
  const { ctx, pal: p } = st;
  ctx.setTransform(st.dpr, 0, 0, st.dpr, 0, 0);
  ctx.clearRect(0, 0, st.W, st.H);
  // The content that is being revealed.
  const pad = 22;
  const mid = st.H / 2;
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = p.text;
  ctx.font = "700 26px Geist, system-ui, sans-serif";
  ctx.fillText("Winter sale", pad, mid - 14);
  ctx.fillStyle = p.muted;
  ctx.font = "400 13px Geist, system-ui, sans-serif";
  ctx.fillText("Up to 40% off, today only", pad, mid + 8);
  ctx.fillStyle = p.accent;
  ctx.beginPath();
  ctx.roundRect(pad, mid + 24, 96, 32, 8);
  ctx.fill();
  ctx.fillStyle = p.onAccent;
  ctx.font = "500 13px Geist, system-ui, sans-serif";
  ctx.fillText("Shop now", pad + 18, mid + 44);
  // The snow cover: a cell stays covered while its noise value is above the clearing progress.
  const phase = t % BLIZZARD_PERIOD;
  const progress = phase < 5 ? easeInOut(phase / 5) : phase < 6.2 ? 1 : 1 - (phase - 6.2) / 0.8;
  const ox = (st.W - st.cols * st.cw) / 2;
  const oy = (st.H - st.rows * st.ch) / 2;
  ctx.font = monoFont(st.fontPx);
  const flicker = Math.floor(t * 8);
  for (let y = 0; y < st.rows; y++) {
    for (let x = 0; x < st.cols; x++) {
      let n = vnoise(x * 0.09 - t * 0.7, y * 0.16 + t * 0.2) * 0.6 + hash(x, y, flicker) * 0.4;
      n = clamp(n * 0.96 + 0.02, 0, 0.99);
      if (n <= progress) continue;
      const density = clamp((n - progress) * 2.2 + 0.15, 0, 1);
      const idx = Math.min(RAMP.length - 1, Math.round(density * (RAMP.length - 1)));
      if (idx < 1) continue;
      const px = ox + x * st.cw;
      const py = oy + y * st.ch;
      ctx.globalAlpha = 0.5 + 0.45 * density;
      ctx.fillStyle = p.card;
      ctx.fillRect(px, py, Math.ceil(st.cw), st.ch);
      ctx.globalAlpha = 1;
      ctx.fillStyle = p.snow;
      ctx.fillText(RAMP.charAt(idx), px, py + st.ch * 0.78);
    }
  }
}
