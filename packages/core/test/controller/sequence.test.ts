// Tests for src/controller/sequence.ts, driven by a fake scheduler so time is exact.

import { describe, expect, it } from "vitest";
import { createSequence } from "../../src/controller/sequence.ts";
import { fakeScheduler } from "../support/scheduler.ts";

/** A sequence that logs its steps with the time they happened. */
function setup(hold: number) {
  const time = fakeScheduler(10);
  const log: string[] = [];
  const sequence = createSequence({
    scheduler: time.scheduler,
    hold,
    showLoading: () => log.push(`loading@${time.time}`),
    startReveal: () => log.push(`reveal@${time.time}`),
  });
  return { time, log, sequence };
}

describe("createSequence", () => {
  it("shows loading at once, then starts the reveal after the hold", () => {
    const { time, log, sequence } = setup(1.2);
    sequence.run(false);
    expect(log).toEqual(["loading@0"]);
    time.advance(1190);
    expect(log).toEqual(["loading@0"]);
    time.advance(10);
    expect(log).toEqual(["loading@0", "reveal@1200"]);
  });

  it("starts the reveal at once with no hold", () => {
    const { log, sequence } = setup(0);
    sequence.run(false);
    expect(log).toEqual(["loading@0", "reveal@0"]);
  });

  it("does not loop unless asked", () => {
    const { time, log, sequence } = setup(0);
    sequence.run(false);
    sequence.revealEnded();
    time.advance(5000);
    expect(log).toEqual(["loading@0", "reveal@0"]);
    expect(time.pending()).toBe(0);
  });

  it("loops 900 ms after the reveal ends", () => {
    const { time, log, sequence } = setup(0.5);
    sequence.run(true);
    time.advance(500);
    time.advance(1000);
    sequence.revealEnded();
    time.advance(890);
    expect(log).toEqual(["loading@0", "reveal@500"]);
    time.advance(10);
    expect(log).toEqual(["loading@0", "reveal@500", "loading@2400"]);
    time.advance(500);
    expect(log.at(-1)).toBe("reveal@2900");
  });

  it("ignores a reveal ending while it is still holding", () => {
    const { time, log, sequence } = setup(1);
    sequence.run(true);
    sequence.revealEnded();
    time.advance(1000);
    expect(log).toEqual(["loading@0", "reveal@1000"]);
  });

  it("ignores reveals it did not start", () => {
    const { time, log, sequence } = setup(0);
    sequence.revealEnded();
    sequence.run(true);
    sequence.cancel();
    sequence.revealEnded();
    time.advance(5000);
    expect(log).toEqual(["loading@0", "reveal@0"]);
  });

  it("cancels a pending hold", () => {
    const { time, log, sequence } = setup(1);
    sequence.run(false);
    sequence.cancel();
    time.advance(5000);
    expect(log).toEqual(["loading@0"]);
    expect(time.pending()).toBe(0);
  });

  it("cancels a pending loop gap", () => {
    const { time, log, sequence } = setup(0);
    sequence.run(true);
    sequence.revealEnded();
    sequence.cancel();
    time.advance(5000);
    expect(log).toEqual(["loading@0", "reveal@0"]);
  });

  it("restarts cleanly when run again during a hold", () => {
    const { time, log, sequence } = setup(1);
    sequence.run(false);
    time.advance(600);
    sequence.run(false);
    time.advance(600);
    expect(log).toEqual(["loading@0", "loading@600"]);
    time.advance(400);
    expect(log).toEqual(["loading@0", "loading@600", "reveal@1600"]);
  });
});
