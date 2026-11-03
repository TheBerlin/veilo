// A scheduler driven by hand, so tests control time exactly. Not a test file itself; it is
// shared by the controller tests, so it does not mirror a file in src/.

import type { Scheduler } from "../../src/dom/env.ts";

/** A scheduler plus the controls a test uses to move time. */
export interface FakeScheduler {
  scheduler: Scheduler;
  /** The current time in milliseconds. */
  readonly time: number;
  /** How many frames and timeouts are waiting. */
  pending(): number;
  /** Moves time forward in steps of one frame, running due timeouts and then frames each step. */
  advance(ms: number): void;
  /** Moves time forward without running anything, like a busy page that delays its frames. */
  skip(ms: number): void;
}

/**
 * Creates a fake scheduler that starts at time 0.
 *
 * @param frameMs - The length of one frame, 16 ms by default.
 * @returns The scheduler and its controls.
 */
export function fakeScheduler(frameMs = 16): FakeScheduler {
  let time = 0;
  let nextId = 1;
  let frames = new Map<number, () => void>();
  const timeouts = new Map<number, { at: number; callback: () => void }>();

  const runDueTimeouts = () => {
    for (;;) {
      const due = [...timeouts.entries()]
        .filter(([, t]) => t.at <= time)
        .sort((a, b) => a[1].at - b[1].at || a[0] - b[0])[0];
      if (!due) return;
      timeouts.delete(due[0]);
      due[1].callback();
    }
  };

  return {
    scheduler: {
      now: () => time,
      frame(callback) {
        const id = nextId++;
        frames.set(id, callback);
        return id;
      },
      cancelFrame: (id) => void frames.delete(id),
      timeout(callback, ms) {
        const id = nextId++;
        timeouts.set(id, { at: time + ms, callback });
        return id;
      },
      cancelTimeout: (id) => void timeouts.delete(id),
    },
    get time() {
      return time;
    },
    pending: () => frames.size + timeouts.size,
    advance(ms) {
      const end = time + ms;
      while (time < end) {
        time = Math.min(end, time + frameMs);
        runDueTimeouts();
        // Frames requested while these run wait for the next step, as in a browser.
        const due = frames;
        frames = new Map();
        for (const callback of due.values()) callback();
      }
    },
    skip(ms) {
      time += ms;
    },
  };
}
