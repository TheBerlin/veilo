// mount.ts: the public way to run a seasonal effect: `mountEffect(container, "frost")`. It draws on
// a canvas, in one of three modes: `loop` (a loading animation that runs until destroyed),
// `hover` (rests on a still frame; hover, press or Enter plays one full run, then ignores
// triggers for a pause, as the Veilo gallery does) and `still` (the resting frame only).

import type { FlakeShape } from "./flake.ts";
import { loadEffectFonts } from "./fonts.ts";
import { readPalette } from "./palette.ts";
import { createCanvasState, type CanvasState } from "./state.ts";
import { VARIANTS, type EffectId } from "./variants.ts";

/** How long a `hover` effect ignores new triggers after its run has ended, in milliseconds. */
export const REPLAY_PAUSE_MS = 3000;

/** How an effect runs: `loop`, `hover` or `still`. */
export type EffectMode = "loop" | "hover" | "still";

/** Options of {@link mountEffect}. */
export interface MountEffectOptions {
  /** How it runs. Defaults to `loop`. */
  mode?: EffectMode;
  /** The flake form, for the effects that draw a flake. Defaults to `dendrite`. */
  shape?: FlakeShape;
  /**
   * `hover` mode: the element that takes the triggers (hover and press). Defaults to the canvas.
   * A gallery passes its whole card.
   */
  host?: HTMLElement;
  /**
   * Treat the visitor as asking for less motion: the effect stays on its resting frame. Defaults
   * to the visitor's `prefers-reduced-motion` setting.
   */
  reducedMotion?: boolean;
  /** The accessible name of the canvas. Defaults to the effect's id plus "animation". */
  label?: string;
}

/** A running effect. */
export interface EffectHandle {
  /** The canvas it draws on. */
  canvas: HTMLCanvasElement;
  /** `hover` mode: plays one full run, unless one is running or the pause has not passed. */
  play: () => void;
  /** Changes the flake form. */
  setShape: (shape: FlakeShape) => void;
  /** Re-reads the page's colors and redraws. It also happens by itself when the theme changes. */
  refresh: () => void;
  /** Stops the effect, removes every listener, and removes the canvas if it created it. */
  destroy: () => void;
}

/**
 * Runs an effect.
 *
 * Give it a container to have it create a canvas that fills it (set the container's size), or a
 * `<canvas>` that already has a CSS width and height. The canvas reads its colors from the page's
 * custom properties (`--veilo-text`, `--veilo-card` and others, each with a fallback), follows the
 * page's theme when `data-theme` or the color scheme changes, redraws once fonts have loaded, and
 * in `loop` mode pauses while it is off screen or the tab is hidden.
 *
 * Side effects: sizes the canvas and draws on it; adds listeners, observers and animation frames;
 * in `hover` mode sets `tabindex="0"` and a `data-state` of `rest` or `playing` on the canvas.
 * Call `destroy` to undo all of it.
 *
 * @param target - A container element, or a canvas.
 * @param id - The effect's id.
 * @param options - Mode, flake form, trigger host, motion preference and label.
 * @returns The handle.
 * @throws When `id` is not a known effect (an `Error`).
 */
export function mountEffect(
  target: HTMLElement,
  id: EffectId,
  options: MountEffectOptions = {},
): EffectHandle {
  const variant = VARIANTS[id] as (typeof VARIANTS)[EffectId] | undefined;
  if (!variant) throw new Error(`Unknown effect: ${String(id)}`);
  const mode = options.mode ?? "loop";
  const reduced =
    options.reducedMotion ??
    (typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches);
  const own = !(target instanceof HTMLCanvasElement);
  const canvas = target instanceof HTMLCanvasElement ? target : document.createElement("canvas");
  if (own) {
    canvas.style.cssText = "display:block;width:100%;height:100%";
    canvas.setAttribute("role", "img");
    target.append(canvas);
  }
  if (options.label !== undefined) canvas.setAttribute("aria-label", options.label);
  else if (own) canvas.setAttribute("aria-label", `${id} animation`);

  let st: CanvasState = createCanvasState(canvas, variant.options, options.shape ?? "dendrite");
  let destroyed = false;
  // `busy`: a hover run is on screen. `cooling`: its pause has not passed yet.
  let busy = false;
  let cooling = false;
  let running = false;
  let visible = true;
  let raf = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let time = 0;
  let last = 0;

  const rest = () => {
    variant.draw(st, variant.still);
    canvas.setAttribute("data-state", "rest");
  };
  // Redraws what is on screen after something changed (shape, colors, fonts, size).
  const redraw = () => {
    if (destroyed || running || busy) return;
    rest();
  };

  // --- loop: runs until destroyed, paused while hidden ---
  const frame = (now: number) => {
    raf = 0;
    // A long gap (a paused tab) must not jump the animation: cap each step.
    if (last) time += Math.min((now - last) / 1000, 0.1);
    last = now;
    variant.draw(st, time);
    if (running) raf = requestAnimationFrame(frame);
  };
  const start = () => {
    if (mode !== "loop" || reduced || destroyed || !visible || document.hidden || running) return;
    running = true;
    canvas.setAttribute("data-state", "playing");
    raf = requestAnimationFrame(frame);
  };
  const stop = () => {
    running = false;
    last = 0;
    cancelAnimationFrame(raf);
    raf = 0;
  };

  // --- hover: one full run per trigger, then a pause ---
  const play = () => {
    if (mode !== "hover" || busy || cooling || reduced || destroyed) return;
    busy = true;
    canvas.setAttribute("data-state", "playing");
    const t0 = performance.now();
    const step = (now: number) => {
      const t = (now - t0) / 1000;
      if (t >= variant.period) {
        busy = false;
        rest();
        // Ignore triggers for the pause after the run has ended.
        cooling = true;
        timer = setTimeout(() => {
          cooling = false;
        }, REPLAY_PAUSE_MS);
        return;
      }
      variant.draw(st, t);
      raf = requestAnimationFrame(step);
    };
    step(t0);
  };
  const host = options.host ?? canvas;
  // Only a mouse hovers: a finger's tap arrives as a click.
  const onEnter = (event: PointerEvent) => {
    if (event.pointerType === "mouse") play();
  };
  const onKey = (event: KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      play();
    }
  };
  if (mode === "hover") {
    canvas.setAttribute("tabindex", "0");
    host.addEventListener("pointerenter", onEnter);
    host.addEventListener("click", play);
    canvas.addEventListener("keydown", onKey);
  }

  // --- things that change the picture without a trigger ---
  const refresh = () => {
    st.pal = readPalette(canvas);
    redraw();
  };
  const themeObserver = new MutationObserver(refresh);
  themeObserver.observe(document.documentElement, { attributeFilter: ["data-theme", "class"] });
  const scheme = matchMedia("(prefers-color-scheme: light)");
  scheme.addEventListener("change", refresh);
  const onVisibility = () => (document.hidden ? stop() : start());
  document.addEventListener("visibilitychange", onVisibility);
  const intersection =
    mode === "loop" && typeof IntersectionObserver === "function"
      ? new IntersectionObserver((entries) => {
          visible = entries.some((entry) => entry.isIntersecting);
          if (visible) start();
          else stop();
        })
      : null;
  intersection?.observe(canvas);
  // A new size needs a new character grid.
  const resize =
    typeof ResizeObserver === "function"
      ? new ResizeObserver(() => {
          if (destroyed) return;
          if (Math.abs(canvas.clientWidth - st.W) < 2 && Math.abs(canvas.clientHeight - st.H) < 2)
            return;
          st = createCanvasState(canvas, variant.options, st.shape);
          redraw();
        })
      : null;
  resize?.observe(canvas);
  void loadEffectFonts().then(redraw);

  rest();
  start();
  return {
    canvas,
    play,
    setShape: (shape) => {
      st.shape = shape;
      redraw();
    },
    refresh,
    destroy: () => {
      destroyed = true;
      stop();
      clearTimeout(timer);
      themeObserver.disconnect();
      scheme.removeEventListener("change", refresh);
      document.removeEventListener("visibilitychange", onVisibility);
      intersection?.disconnect();
      resize?.disconnect();
      host.removeEventListener("pointerenter", onEnter);
      host.removeEventListener("click", play);
      canvas.removeEventListener("keydown", onKey);
      if (own) canvas.remove();
    },
  };
}
