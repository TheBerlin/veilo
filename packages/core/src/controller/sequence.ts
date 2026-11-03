/**
 * sequence.ts: the spec's sequence: loading for `hold` seconds, then the reveal, then an
 * optional loop that restarts 900 ms after the reveal ends.
 * Layer 3. Time comes from the scheduler it is given.
 */

import type { Scheduler } from "../dom/env.ts";

/** Options for {@link createSequence}. */
export interface SequenceOptions {
  /** The time source. */
  scheduler: Scheduler;
  /** Seconds of loading before the reveal starts. 0 starts it at once. */
  hold: number;
  /** Shows the loading state. */
  showLoading(): void;
  /** Starts the reveal. Call {@link Sequence.revealEnded} when it reaches the end. */
  startReveal(): void;
}

/** A running sequence. */
export interface Sequence {
  /** Starts the sequence from the loading state, cancelling a sequence already running. */
  run(loop: boolean): void;
  /** Tells the sequence the reveal ended, so a looping sequence can restart. */
  revealEnded(): void;
  /** Cancels the pending hold or loop gap. Does not touch the loading or reveal itself. */
  cancel(): void;
}

// The spec's pause between the end of a reveal and the next loop.
const LOOP_GAP_MS = 900;

/**
 * Creates a sequence.
 *
 * @param options - Time source, hold time and the two steps.
 * @returns The sequence, not yet running.
 */
export function createSequence(options: SequenceOptions): Sequence {
  const { scheduler, hold, showLoading, startReveal } = options;
  let timer: number | undefined;
  let looping = false;
  let active = false;

  const cancel = () => {
    if (timer !== undefined) scheduler.cancelTimeout(timer);
    timer = undefined;
    active = false;
  };

  const run = (loop: boolean) => {
    cancel();
    looping = loop;
    active = true;
    showLoading();
    const reveal = () => {
      timer = undefined;
      startReveal();
    };
    if (hold > 0) timer = scheduler.timeout(reveal, hold * 1000);
    else reveal();
  };

  return {
    run,
    revealEnded() {
      // Only a reveal started by this sequence restarts it, not a separate play().
      if (!active || timer !== undefined) return;
      if (!looping) {
        active = false;
        return;
      }
      timer = scheduler.timeout(() => run(true), LOOP_GAP_MS);
    },
    cancel,
  };
}
