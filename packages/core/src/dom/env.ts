/**
 * env.ts: time, animation frames and pixel ratio, behind one small interface.
 * Layer 1 (browser). Touches browser globals only when called, never at import time.
 *
 * The controller takes a {@link Scheduler} instead of calling requestAnimationFrame and
 * setTimeout itself, so tests can drive time by hand.
 */

/** The time sources the controller uses. All times are in milliseconds. */
export interface Scheduler {
  /** The current time, from an arbitrary start. */
  now(): number;
  /** Runs `callback` before the next repaint. Returns an id for {@link Scheduler.cancelFrame}. */
  frame(callback: () => void): number;
  /** Cancels a frame callback. Unknown ids are ignored. */
  cancelFrame(id: number): void;
  /** Runs `callback` after `ms`. Returns an id for {@link Scheduler.cancelTimeout}. */
  timeout(callback: () => void, ms: number): number;
  /** Cancels a timeout. Unknown ids are ignored. */
  cancelTimeout(id: number): void;
}

// The spec caps the device pixel ratio, so canvases on very dense screens stay affordable.
const MAX_PIXEL_RATIO = 2;

/**
 * Creates the scheduler backed by the browser's clock, animation frames and timeouts.
 *
 * @returns The scheduler.
 */
export function browserScheduler(): Scheduler {
  return {
    now: () => performance.now(),
    frame: (callback) => requestAnimationFrame(() => callback()),
    cancelFrame: (id) => cancelAnimationFrame(id),
    timeout: (callback, ms) => setTimeout(callback, ms) as unknown as number,
    cancelTimeout: (id) => clearTimeout(id),
  };
}

/**
 * Reads the device pixel ratio, capped at 2.
 *
 * @returns The ratio, from 1 to 2. 1 when there is no `window`.
 */
export function pixelRatio(): number {
  if (typeof window === "undefined") return 1;
  return Math.min(MAX_PIXEL_RATIO, Math.max(1, window.devicePixelRatio || 1));
}
