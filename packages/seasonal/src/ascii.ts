// ascii.ts: the character renderer: a flake grows on the hidden scene, each cell takes a character
// from a density ramp, and one of four coloring styles paints it. Used by Frost grow, Ice cells,
// Aurora flake, Aurora curtains and Aurora glow.

import { drawFlake } from "./flake.ts";
import { clamp, easeOut, hash } from "./math.ts";
import { monoFont, sampleScene, type CanvasState, type SceneFn } from "./state.ts";

/** How the characters are colored. */
export type AsciiStyle = "ink" | "cells" | "aurora" | "curtains" | "glow";

/** Characters from empty to solid. */
const RAMP = " .:-=+*%@";

/** The flake effects repeat every 6.2 seconds: grow for 4, hold, fade for 0.8. */
export const FLAKE_PERIOD = 6.2;

/**
 * The growing flake, as a scene.
 *
 * @param c - The scene context.
 * @param t - Time in seconds.
 * @param st - The canvas state; its `shape` picks the flake form.
 */
export const flakeScene: SceneFn = (c, t, st) => {
  const phase = t % FLAKE_PERIOD;
  const g = phase < 4 ? easeOut(phase / 4) : 1;
  const fade = phase > 5.4 ? 1 - (phase - 5.4) / 0.8 : 1;
  const radius = Math.min(st.W, st.H) * 0.47;
  c.globalAlpha = clamp(fade, 0, 1);
  drawFlake(c, st.W / 2, st.H / 2, radius, -Math.PI / 2, g, st.shape);
};

/**
 * Picks the fill color of one cell for a style.
 *
 * @param style - The coloring style.
 * @param st - The canvas state.
 * @param x - Column.
 * @param y - Row.
 * @param v - Coverage of the cell, 0 to 1.
 * @param t - Time in seconds.
 * @returns A CSS color.
 */
function glyphColor(
  style: AsciiStyle,
  st: CanvasState,
  x: number,
  y: number,
  v: number,
  t: number,
): string {
  const p = st.pal;
  if (style === "aurora") {
    const hue = 140 + 140 * (0.5 + 0.5 * Math.sin(x * 0.11 + y * 0.07 - t * 0.9));
    return `hsl(${hue.toFixed(0)},72%,${p.dark ? 66 : 34}%)`;
  }
  if (style === "curtains") {
    // Bands of color by row, bent by a wave that travels sideways, like curtains of light.
    const wave = Math.sin(x * 0.07 - t * 0.8) * 1.6;
    const hue = 150 + 130 * (0.5 + 0.5 * Math.sin(y * 0.38 + wave - t * 0.5));
    return `hsl(${hue.toFixed(0)},78%,${p.dark ? 52 + 22 * v : 40 - 10 * v}%)`;
  }
  return p.text;
}

/**
 * Renders a scene as characters.
 *
 * Side effects: clears and draws the visible canvas.
 *
 * @param st - The canvas state.
 * @param t - Time in seconds.
 * @param scene - The scene to sample.
 * @param style - How to color the characters.
 */
export function renderAscii(st: CanvasState, t: number, scene: SceneFn, style: AsciiStyle): void {
  const data = sampleScene(st, t, scene);
  const { ctx, pal: p } = st;
  ctx.setTransform(st.dpr, 0, 0, st.dpr, 0, 0);
  ctx.clearRect(0, 0, st.W, st.H);
  ctx.font = monoFont(st.fontPx);
  ctx.textBaseline = "alphabetic";
  const ox = (st.W - st.cols * st.cw) / 2;
  const oy = (st.H - st.rows * st.ch) / 2;
  const tick = Math.floor(t * 6);
  for (let y = 0; y < st.rows; y++) {
    for (let x = 0; x < st.cols; x++) {
      const v = data[(y * st.cols + x) * 4]! / 255;
      if (v < 0.05) continue;
      // A little contrast, so thin strokes read as solid characters.
      const vv = clamp((v - 0.06) / 0.55, 0, 1);
      const idx = Math.min(RAMP.length - 1, Math.round(Math.pow(vv, 0.8) * (RAMP.length - 1)));
      if (idx === 0) continue;
      const px = ox + x * st.cw;
      const py = oy + y * st.ch;
      if (style === "cells" || style === "glow") {
        if (style === "cells") {
          let level = v < 0.25 ? 0 : v < 0.5 ? 1 : v < 0.75 ? 2 : 3;
          if (hash(x, y, tick) > 0.94) level = Math.min(3, level + 1);
          ctx.fillStyle = p.ice[level]!;
          ctx.fillRect(px, py, Math.ceil(st.cw), st.ch);
          ctx.fillStyle = p.iceGlyph;
        } else {
          // A soft colored cell behind white characters: the color glows through the flake.
          const hue = 160 + 120 * (0.5 + 0.5 * Math.sin(x * 0.09 - y * 0.08 + t * 0.7));
          ctx.fillStyle = `hsla(${hue.toFixed(0)},80%,${p.dark ? 46 : 62}%,${(0.22 + 0.5 * v).toFixed(2)})`;
          ctx.fillRect(px, py, Math.ceil(st.cw), st.ch);
          ctx.fillStyle = p.dark ? "#f2fff9" : "#0b2a24";
        }
        ctx.globalAlpha = 1;
      } else {
        ctx.fillStyle = glyphColor(style, st, x, y, v, t);
        ctx.globalAlpha = style === "ink" ? 0.5 + 0.5 * v : 1;
      }
      ctx.fillText(RAMP.charAt(idx), px, py + st.ch * 0.78);
      ctx.globalAlpha = 1;
    }
  }
}
