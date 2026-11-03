// Tests for src/controller/events.ts.

import { describe, expect, it, vi } from "vitest";
import { createEmitter } from "../../src/controller/events.ts";

type Events = { progress: [p: number]; complete: [] };

describe("createEmitter", () => {
  it("calls listeners with their arguments, in the order they were added", () => {
    const emitter = createEmitter<Events>();
    const calls: string[] = [];
    emitter.on("progress", (p) => calls.push(`a${p}`));
    emitter.on("progress", (p) => calls.push(`b${p}`));
    emitter.on("complete", () => calls.push("done"));
    emitter.emit("progress", 0.5);
    emitter.emit("complete");
    expect(calls).toEqual(["a0.5", "b0.5", "done"]);
  });

  it("removes a listener with the function on() returns", () => {
    const emitter = createEmitter<Events>();
    const listener = vi.fn();
    const off = emitter.on("progress", listener);
    off();
    off();
    emitter.emit("progress", 1);
    expect(listener).not.toHaveBeenCalled();
  });

  it("does nothing for an event without listeners", () => {
    expect(() => createEmitter<Events>().emit("complete")).not.toThrow();
  });

  it("keeps the list of listeners fixed during one emit", () => {
    const emitter = createEmitter<Events>();
    const late = vi.fn();
    const removed = vi.fn();
    emitter.on("progress", () => {
      emitter.on("progress", late);
      offRemoved();
    });
    const offRemoved = emitter.on("progress", removed);
    emitter.emit("progress", 0);
    expect(late).not.toHaveBeenCalled();
    expect(removed).toHaveBeenCalledTimes(1);
  });

  it("keeps calling listeners after one throws, and rethrows its error later", async () => {
    const emitter = createEmitter<Events>();
    const after = vi.fn();
    const rethrown: unknown[] = [];
    const original = globalThis.queueMicrotask;
    globalThis.queueMicrotask = (task) =>
      original(() => {
        try {
          task();
        } catch (error) {
          rethrown.push(error);
        }
      });
    try {
      emitter.on("complete", () => {
        throw new Error("listener failed");
      });
      emitter.on("complete", after);
      expect(() => emitter.emit("complete")).not.toThrow();
      expect(after).toHaveBeenCalled();
      await Promise.resolve();
      expect(rethrown).toEqual([new Error("listener failed")]);
    } finally {
      globalThis.queueMicrotask = original;
    }
  });

  it("removes every listener with clear()", () => {
    const emitter = createEmitter<Events>();
    const listener = vi.fn();
    emitter.on("progress", listener);
    emitter.clear();
    emitter.emit("progress", 1);
    expect(listener).not.toHaveBeenCalled();
  });
});
