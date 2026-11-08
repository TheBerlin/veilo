// dot-grid.ts: the animated dot-grid background (noise clusters), drawn on a 2D canvas.
// Ported from the Dot Grid Studio export. No window or document access at import time.

/** Settings of the dot grid. Every key is optional in {@link createDotGrid}. */
export interface DotGridSettings {
  /** Distance between dot centers, in CSS pixels. */
  pitch: number;
  /** Radius of the weakest drawn dot, in CSS pixels. */
  rMin: number;
  /** Radius of the strongest dot, in CSS pixels. */
  rMax: number;
  /** Opacity of the weakest drawn dot, 0 to 1. */
  alphaMin: number;
  /** Canvas glow blur in CSS pixels. Expensive at full screen; 0 turns it off. */
  glow: number;
  /** How much the dots fade toward the edges, 0 to 1. */
  vignette: number;
  /** Share of the grid covered by lit patches, 0 to 1. */
  cover: number;
  /** Size of a patch, in dots. */
  scale: number;
  /** Side of a rectangular block, in dots. */
  block: number;
  /** Mix between smooth patches (0) and blocks (1). */
  blockiness: number;
  /** Per-dot size variation, 0 to 1. */
  variance: number;
  /** Per-dot flicker, 0 to 1. */
  twinkle: number;
  /** Noise seed; the same seed gives the same pattern. */
  seed: number;
  /** Animation speed; 0 freezes the pattern. */
  speed: number;
  /** Strength of the glow under the pointer, 0 to 1. */
  ptr: number;
}

/** Options of {@link createDotGrid}: settings plus the dot color and still mode. */
export interface DotGridOptions extends Partial<DotGridSettings> {
  /** Dot color. When empty, `--veilo-text` is read from the canvas on every frame, so it follows the theme. */
  color?: string;
  /** Draw one still frame instead of animating (for example under reduced motion). */
  still?: boolean;
}

/** The handle returned by {@link createDotGrid}. */
export interface DotGrid {
  /** Changes settings live and redraws. */
  update(settings: Partial<DotGridOptions>): void;
  /** Stops the animation at the current frame. */
  pause(): void;
  /** Continues the animation. */
  resume(): void;
  /** Draws the current frame again, for example after a theme change. */
  redraw(): void;
  /** Sets the time to `seconds` and draws that frame (tests and still frames). */
  drawAt(seconds: number): void;
  /** Stops the loop and removes every listener and observer. The canvas stays. */
  destroy(): void;
}

/** Defaults: the settings exported from Dot Grid Studio, with glow off (expensive at full screen). */
export const DOT_GRID_DEFAULTS: DotGridSettings = {
  pitch: 17,
  rMin: 1,
  rMax: 5,
  alphaMin: 0.2,
  glow: 0,
  vignette: 0.5,
  cover: 0.25,
  scale: 7,
  block: 4,
  blockiness: 0.25,
  variance: 0.5,
  twinkle: 0.5,
  seed: 7,
  speed: 0.25,
  ptr: 0.5,
};

// Radius of the pointer glow, in CSS pixels (the studio's 240 px light radius x 0.6).
const POINTER_RADIUS = 144;

const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x);

/**
 * Integer hash of a lattice point and seed.
 *
 * @param x - Lattice x.
 * @param y - Lattice y.
 * @param z - Lattice z (time).
 * @param s - Seed.
 * @returns A value in [0, 1).
 */
export function dotHash(x: number, y: number, z: number, s: number): number {
  let n =
    Math.imul(x | 0, 374761393) +
    Math.imul(y | 0, 668265263) +
    Math.imul(z | 0, 2147483647) +
    Math.imul(s | 0, 1274126177);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  n ^= n >>> 16;
  return (n >>> 0) / 4294967296;
}

// Quintic smoothstep, so the noise has no visible creases at lattice lines.
const fade = (u: number): number => u * u * u * (u * (u * 6 - 15) + 10);
const mix = (a: number, b: number, u: number): number => a + (b - a) * u;

/**
 * 3D value noise: hashes at the 8 surrounding lattice corners, blended with a quintic fade.
 *
 * @param x - Space x.
 * @param y - Space y.
 * @param z - Time.
 * @param s - Seed.
 * @returns A value in [0, 1).
 */
export function valueNoise(x: number, y: number, z: number, s: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);
  const u = fade(x - xi);
  const v = fade(y - yi);
  const w = fade(z - zi);
  const layer = (zz: number): number =>
    mix(
      mix(dotHash(xi, yi, zz, s), dotHash(xi + 1, yi, zz, s), u),
      mix(dotHash(xi, yi + 1, zz, s), dotHash(xi + 1, yi + 1, zz, s), u),
      v,
    );
  return mix(layer(zi), layer(zi + 1), w);
}

/**
 * Strength of one dot, 0 to 1, before the edge fade and the pointer glow.
 *
 * @param settings - Grid settings.
 * @param i - Column.
 * @param j - Row.
 * @param t - Time in seconds.
 * @returns The strength.
 */
export function dotStrength(settings: DotGridSettings, i: number, j: number, t: number): number {
  const z = t * settings.speed * 1.5;
  const S = Math.max(0.5, settings.scale);
  const B = Math.max(1, Math.round(settings.block));
  const smooth = valueNoise(i / S, j / S, z, settings.seed);
  // Sampled once per B x B block of dots (at its center), which makes rectangular patches.
  const blocky = valueNoise(
    ((Math.floor(i / B) + 0.5) * B) / S,
    ((Math.floor(j / B) + 0.5) * B) / S,
    z,
    settings.seed + 1,
  );
  // Blend, then double the contrast around 0.5 so patches get firm edges.
  const field = clamp01((smooth + (blocky - smooth) * settings.blockiness - 0.5) * 2 + 0.5);
  const gate = clamp01((field - (1 - settings.cover)) / 0.25);
  if (gate <= 0) return 0;
  const r = dotHash(i, j, 1, settings.seed);
  const tw = 0.5 + 0.5 * Math.sin(t * settings.speed * (2 + r * 4) + r * 2 * Math.PI);
  return (
    gate *
    (1 - settings.variance + settings.variance * r) *
    (1 - settings.twinkle + settings.twinkle * tw)
  );
}

/**
 * Starts an animated dot grid on a canvas. The canvas is sized to its own CSS box (pixel
 * ratio capped at 2) and cleared each frame, so the page background shows through.
 * Side effects: a ResizeObserver on the canvas, pointer, blur and visibility listeners on
 * the window and document, and a requestAnimationFrame loop (none while still, paused or
 * the tab is hidden).
 *
 * @param canvas - The canvas to draw on; its owner keeps it in the page.
 * @param options - Settings, dot color and still mode.
 * @returns The handle; call `destroy()` when done.
 */
export function createDotGrid(canvas: HTMLCanvasElement, options: DotGridOptions = {}): DotGrid {
  const cfg: DotGridSettings & DotGridOptions = { ...DOT_GRID_DEFAULTS, ...options };
  const ctx = canvas.getContext("2d");
  const doc = canvas.ownerDocument;
  const win = doc.defaultView ?? window;
  let dpr = 1;
  let t = 0;
  let last = 0;
  let raf = 0;
  let paused = false;
  let destroyed = false;
  const pointer = { x: 0, y: 0, active: false };

  const dotColor = (): string =>
    cfg.color || win.getComputedStyle(canvas).getPropertyValue("--veilo-text").trim() || "#eeeeee";

  function draw(): void {
    const w = canvas.width;
    const h = canvas.height;
    if (!ctx || !w || !h) return;
    const P = Math.max(2, cfg.pitch * dpr);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.clearRect(0, 0, w, h);
    const nc = Math.max(1, Math.floor(w / P));
    const nr = Math.max(1, Math.floor(h / P));
    // Center the grid, so both edges share the leftover space.
    const x0 = (w - (nc - 1) * P) / 2;
    const y0 = (h - (nr - 1) * P) / 2;
    const cx = w / 2;
    const cy = h / 2;
    const boost = POINTER_RADIUS * dpr;
    const px = pointer.x * dpr;
    const py = pointer.y * dpr;
    const color = dotColor();
    ctx.fillStyle = color;
    if (cfg.glow > 0) {
      ctx.shadowColor = color;
      ctx.shadowBlur = cfg.glow * dpr;
    }
    for (let j = 0; j < nr; j++) {
      const y = y0 + j * P;
      for (let i = 0; i < nc; i++) {
        const x = x0 + i * P;
        let s = dotStrength(cfg, i, j, t);
        if (cfg.vignette > 0) {
          // Distance from the center, 1 at the corners, smoothstepped from 0.3 outward.
          const dn = Math.min(1, Math.hypot((x - cx) / cx, (y - cy) / cy) / Math.SQRT2);
          const vv = clamp01((dn - 0.3) / 0.7);
          s *= 1 - cfg.vignette * vv * vv * (3 - 2 * vv);
        }
        if (cfg.ptr > 0 && pointer.active) {
          const pd = Math.hypot(x - px, y - py) / boost;
          if (pd < 1) s = Math.max(s, cfg.ptr * (1 - pd) * (1 - pd));
        }
        if (s < 0.02) continue;
        const rad = (cfg.rMin + (cfg.rMax - cfg.rMin) * s) * dpr;
        ctx.globalAlpha = cfg.alphaMin + (1 - cfg.alphaMin) * s;
        ctx.beginPath();
        ctx.arc(x, y, rad, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  function resize(): void {
    dpr = Math.min(win.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width * dpr));
    const h = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    draw();
  }

  const running = (): boolean => !destroyed && !paused && !cfg.still && !doc.hidden;

  function tick(now: number): void {
    raf = 0;
    if (!running()) return;
    // Cap the step, so a long gap between frames does not jump the pattern.
    t += Math.min(0.1, Math.max(0, now - last) / 1000);
    last = now;
    draw();
    raf = win.requestAnimationFrame(tick);
  }

  function start(): void {
    if (raf || !running()) return;
    last = win.performance.now();
    raf = win.requestAnimationFrame(tick);
  }

  function stop(): void {
    if (raf) win.cancelAnimationFrame(raf);
    raf = 0;
  }

  function onMove(event: PointerEvent): void {
    const rect = canvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.active = true;
    if (!running()) draw();
  }
  function onLeave(): void {
    pointer.active = false;
    if (!running()) draw();
  }
  function onUp(event: PointerEvent): void {
    if (event.pointerType === "touch") onLeave();
  }
  function onVisibility(): void {
    if (doc.hidden) stop();
    else start();
  }

  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  win.addEventListener("pointermove", onMove, { passive: true });
  win.addEventListener("pointerup", onUp, { passive: true });
  win.addEventListener("blur", onLeave);
  doc.documentElement.addEventListener("mouseleave", onLeave);
  doc.addEventListener("visibilitychange", onVisibility);
  resize();
  start();

  return {
    update(settings) {
      if (destroyed) return;
      Object.assign(cfg, settings);
      draw();
      if (cfg.still) stop();
      else start();
    },
    pause() {
      paused = true;
      stop();
    },
    resume() {
      paused = false;
      start();
    },
    redraw() {
      if (!destroyed) draw();
    },
    drawAt(seconds) {
      if (destroyed) return;
      t = seconds;
      draw();
    },
    destroy() {
      if (destroyed) return;
      stop();
      destroyed = true;
      observer.disconnect();
      win.removeEventListener("pointermove", onMove);
      win.removeEventListener("pointerup", onUp);
      win.removeEventListener("blur", onLeave);
      doc.documentElement.removeEventListener("mouseleave", onLeave);
      doc.removeEventListener("visibilitychange", onVisibility);
    },
  };
}
