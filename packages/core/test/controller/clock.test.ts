// Tests for src/controller/clock.ts, driven by a fake scheduler so time is exact.

import { describe, expect, it } from "vitest";
import { createClock } from "../../src/controller/clock.ts";
import { fakeScheduler } from "../support/scheduler.ts";

/** A 1 second clock on a fake scheduler with 10 ms frames, recording what it reports. */
function setup(duration = 1) {
  const time = fakeScheduler(10);
  const frames: number[] = [];
  let ends = 0;
  const clock = createClock({
    duration,
    scheduler: time.scheduler,
    onFrame: (p) => frames.push(p),
    onEnd: () => ends++,
  });
  return { time, clock, frames, ends: () => ends };
}

describe("createClock", () => {
  it("starts stopped at 0", () => {
    const { clock, frames } = setup();
    expect([clock.progress, clock.running]).toEqual([0, false]);
    expect(frames).toEqual([]);
  });

  it("draws the start frame at once, then advances with time", () => {
    const { time, clock, frames } = setup();
    clock.start();
    expect(frames).toEqual([0]);
    time.advance(250);
    expect(clock.progress).toBeCloseTo(0.25, 10);
    expect(frames.at(-1)).toBeCloseTo(0.25, 10);
    expect(clock.running).toBe(true);
  });

  it("ends exactly at 1, calls onEnd once and stops asking for frames", () => {
    const { time, clock, frames, ends } = setup();
    clock.start();
    time.advance(2000);
    expect(frames.at(-1)).toBe(1);
    expect(frames.filter((p) => p === 1)).toHaveLength(1);
    expect(ends()).toBe(1);
    expect(clock.running).toBe(false);
    expect(time.pending()).toBe(0);
  });

  it("follows the duration", () => {
    const { time, clock } = setup(2);
    clock.start();
    time.advance(500);
    expect(clock.progress).toBeCloseTo(0.25, 10);
  });

  it("starts from a given progress", () => {
    const { time, clock, frames } = setup();
    clock.start(0.5);
    expect(frames).toEqual([0.5]);
    time.advance(100);
    expect(clock.progress).toBeCloseTo(0.6, 10);
  });

  it("ends at once when started at 1", () => {
    const { time, clock, frames, ends } = setup();
    clock.start(1);
    expect(frames).toEqual([1]);
    expect(ends()).toBe(1);
    expect(time.pending()).toBe(0);
  });

  it("pauses and resumes where it left off", () => {
    const { time, clock } = setup();
    clock.start();
    time.advance(300);
    clock.pause();
    expect(clock.running).toBe(false);
    time.advance(5000);
    expect(clock.progress).toBeCloseTo(0.3, 10);
    expect(time.pending()).toBe(0);
    clock.resume();
    time.advance(200);
    expect(clock.progress).toBeCloseTo(0.5, 10);
  });

  it("pauses at the real time, even when a frame is late", () => {
    const { time, clock } = setup();
    clock.start();
    time.advance(100);
    // 50 ms pass without a frame, as on a busy page.
    time.skip(50);
    clock.pause();
    expect(clock.progress).toBeCloseTo(0.15, 10);
  });

  it("ignores pause when stopped and resume when running or ended", () => {
    const { time, clock, ends } = setup();
    clock.pause();
    clock.start();
    time.advance(100);
    clock.resume();
    time.advance(100);
    expect(clock.progress).toBeCloseTo(0.2, 10);
    time.advance(2000);
    clock.resume();
    expect([clock.running, ends()]).toEqual([false, 1]);
  });

  it("seeks: stops, moves and draws that frame, without ending", () => {
    const { time, clock, frames, ends } = setup();
    clock.start();
    time.advance(100);
    clock.seek(1);
    expect(frames.at(-1)).toBe(1);
    expect([clock.progress, clock.running, ends()]).toEqual([1, false, 0]);
    expect(time.pending()).toBe(0);
  });

  it("clamps start and seek to 0..1", () => {
    const { clock, frames } = setup();
    clock.seek(-1);
    clock.seek(2);
    expect(frames).toEqual([0, 1]);
  });

  it("stops and cancels the pending frame", () => {
    const { time, clock, frames } = setup();
    clock.start();
    clock.stop();
    expect(time.pending()).toBe(0);
    time.advance(500);
    expect(frames).toEqual([0]);
    expect(clock.running).toBe(false);
  });

  it("restarts from 0 with start(), cancelling the old frame", () => {
    const { time, clock } = setup();
    clock.start();
    time.advance(500);
    clock.start();
    expect(time.pending()).toBe(1);
    time.advance(100);
    expect(clock.progress).toBeCloseTo(0.1, 10);
  });
});
