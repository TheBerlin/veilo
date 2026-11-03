/**
 * clock.ts: turns elapsed time into reveal progress, with pause, resume and seek.
 * Layer 3. Time comes from the scheduler it is given, so tests can drive it by hand.
 */

import type { Scheduler } from "../dom/env.ts";
import { clamp } from "../math/number.ts";

/** Options for {@link createClock}. */
export interface ClockOptions {
  /** How long progress takes from 0 to 1, in seconds. */
  duration: number;
  /** The time source. */
  scheduler: Scheduler;
  /** Called with the progress on every frame, and right away when started or seeked. */
  onFrame(p: number): void;
  /** Called once when progress reaches 1 while running. */
  onEnd(): void;
}

/** Progress that advances with time. */
export interface Clock {
  /** The current progress, from 0 to 1. */
  readonly progress: number;
  /** Whether progress is advancing. */
  readonly running: boolean;
  /** Starts advancing from `from` (0 by default) and draws that frame at once. */
  start(from?: number): void;
  /** Stops advancing and keeps the current progress. Does nothing when not running. */
  pause(): void;
  /** Advances again from the current progress. Does nothing when running or at the end. */
  resume(): void;
  /** Stops advancing, moves to `p` and draws that frame. Never calls `onEnd`. */
  seek(p: number): void;
  /** Stops advancing and cancels the pending frame. */
  stop(): void;
}

/**
 * Creates a clock.
 *
 * @param options - Duration, time source and callbacks.
 * @returns The clock, stopped at progress 0.
 */
export function createClock(options: ClockOptions): Clock {
  const { scheduler, onFrame, onEnd } = options;
  const durationMs = options.duration * 1000;

  let progress = 0;
  let running = false;
  let frameId: number | undefined;
  // Progress and time when the clock last started advancing.
  let baseProgress = 0;
  let baseTime = 0;

  const cancel = () => {
    if (frameId !== undefined) scheduler.cancelFrame(frameId);
    frameId = undefined;
  };

  const current = () =>
    durationMs > 0 ? clamp(baseProgress + (scheduler.now() - baseTime) / durationMs) : 1;

  const tick = () => {
    frameId = undefined;
    progress = current();
    onFrame(progress);
    if (progress >= 1) {
      running = false;
      onEnd();
    } else {
      frameId = scheduler.frame(tick);
    }
  };

  const advance = () => {
    baseProgress = progress;
    baseTime = scheduler.now();
    running = true;
    frameId = scheduler.frame(tick);
  };

  return {
    get progress() {
      return progress;
    },
    get running() {
      return running;
    },

    start(from = 0) {
      cancel();
      progress = clamp(from);
      onFrame(progress);
      if (progress >= 1) {
        running = false;
        onEnd();
        return;
      }
      advance();
    },

    pause() {
      if (!running) return;
      progress = current();
      running = false;
      cancel();
    },

    resume() {
      if (running || progress >= 1) return;
      advance();
    },

    seek(p) {
      cancel();
      running = false;
      progress = clamp(p);
      onFrame(progress);
    },

    stop() {
      cancel();
      running = false;
    },
  };
}
