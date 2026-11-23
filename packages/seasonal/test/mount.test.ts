// Tests for src/mount.ts, in Chromium: the three modes, and in `hover` mode a run that plays once,
// ignores triggers for a pause, then plays again.

import { afterEach, describe, expect, it, vi } from "vitest";
import { REPLAY_PAUSE_MS, mountEffect, type EffectHandle } from "../src/mount.ts";
import { VARIANTS } from "../src/variants.ts";

const undo: (() => void)[] = [];

afterEach(() => {
  for (const fn of undo.splice(0)) fn();
});

/**
 * Makes a sized container (or a canvas) in an article, as the gallery does.
 *
 * @param canvas - Whether the target is a canvas of its own instead of a container.
 * @returns The article and the target.
 */
function stage(canvas = false) {
  const host = document.createElement("article");
  const target = document.createElement(canvas ? "canvas" : "div");
  target.style.cssText = "display:block;width:300px;height:300px";
  host.append(target);
  document.body.append(host);
  undo.push(() => host.remove());
  return { host, target };
}

/**
 * Mounts an effect and registers its cleanup.
 *
 * @param target - The container or canvas.
 * @param id - The effect.
 * @param options - Mount options.
 * @returns The handle.
 */
function mount(
  target: HTMLElement,
  id: Parameters<typeof mountEffect>[1],
  options: Parameters<typeof mountEffect>[2],
): EffectHandle {
  const handle = mountEffect(target, id, options);
  undo.push(() => handle.destroy());
  return handle;
}

/**
 * Presses a key on a canvas.
 *
 * @param canvas - The canvas.
 * @param key - The key.
 */
const press = (canvas: HTMLCanvasElement, key: string) =>
  canvas.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));

describe("mountEffect: the canvas", () => {
  it("creates a canvas that fills its container, named for assistive technology", () => {
    const { target } = stage();
    const { canvas } = mount(target, "frost", { mode: "still" });
    expect(canvas.parentElement).toBe(target);
    expect(canvas.getAttribute("role")).toBe("img");
    expect(canvas.getAttribute("aria-label")).toBe("frost animation");
    expect(canvas.clientWidth).toBe(300);
    expect(canvas.clientHeight).toBe(300);
  });

  it("uses a canvas it is given, and uses the label it is given", () => {
    const { target } = stage(true);
    const { canvas } = mount(target, "ice", { mode: "still", label: "Snowflake loading" });
    expect(canvas).toBe(target);
    expect(canvas.getAttribute("aria-label")).toBe("Snowflake loading");
  });

  it("removes a canvas it created, and only that one, when destroyed", () => {
    const own = stage();
    const handle = mountEffect(own.target, "frost", { mode: "still" });
    handle.destroy();
    expect(own.target.querySelector("canvas")).toBeNull();
    const given = stage(true);
    mountEffect(given.target, "frost", { mode: "still" }).destroy();
    expect(given.target.isConnected).toBe(true);
  });

  it("throws a clear error for an effect that does not exist", () => {
    const { target } = stage();
    expect(() => mountEffect(target, "nope" as never)).toThrow("Unknown effect: nope");
  });

  it("draws something at once", () => {
    const { target } = stage(true);
    mount(target, "cell-cells", { mode: "still" });
    const canvas = target as HTMLCanvasElement;
    const { data } = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height);
    expect(data.some((value, i) => i % 4 === 3 && value > 0)).toBe(true);
  });
});

describe("mountEffect: loop mode", () => {
  it("runs by itself: the picture changes from one moment to the next", async () => {
    const { target } = stage(true);
    const { canvas } = mount(target, "glow", { mode: "loop", reducedMotion: false });
    expect(canvas.getAttribute("data-state")).toBe("playing");
    const first = canvas.toDataURL();
    await vi.waitFor(() => expect(canvas.toDataURL()).not.toBe(first), { timeout: 3000 });
  });

  it("stays on its resting frame for a visitor who asks for less motion", async () => {
    const { target } = stage(true);
    const { canvas } = mount(target, "glow", { mode: "loop", reducedMotion: true });
    const first = canvas.toDataURL();
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(canvas.toDataURL()).toBe(first);
    expect(canvas.getAttribute("data-state")).toBe("rest");
  });

  it("stops drawing once destroyed", async () => {
    const { target } = stage(true);
    const handle = mountEffect(target, "glow", { mode: "loop", reducedMotion: false });
    handle.destroy();
    const frozen = handle.canvas.toDataURL();
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(handle.canvas.toDataURL()).toBe(frozen);
  });
});

describe("mountEffect: hover mode", () => {
  it("rests on its still frame and can be focused from the keyboard", () => {
    const { target } = stage(true);
    const { canvas } = mount(target, "frost", { mode: "hover" });
    expect(canvas.getAttribute("data-state")).toBe("rest");
    expect(canvas.getAttribute("tabindex")).toBe("0");
  });

  it("plays on Enter, on Space and on a mouse hover over the host, but not on a touch", () => {
    const a = stage(true);
    press(mount(a.target, "frost", { mode: "hover" }).canvas, "Enter");
    expect(a.target.getAttribute("data-state")).toBe("playing");
    const b = stage(true);
    press(mount(b.target, "ice", { mode: "hover" }).canvas, " ");
    expect(b.target.getAttribute("data-state")).toBe("playing");
    const c = stage(true);
    mount(c.target, "aurora", { mode: "hover", host: c.host });
    c.host.dispatchEvent(new PointerEvent("pointerenter", { pointerType: "touch" }));
    expect(c.target.getAttribute("data-state")).toBe("rest");
    c.host.dispatchEvent(new PointerEvent("pointerenter", { pointerType: "mouse" }));
    expect(c.target.getAttribute("data-state")).toBe("playing");
  });

  it("plays on a press anywhere on the host, for a finger", () => {
    const { host, target } = stage(true);
    mount(target, "glow", { mode: "hover", host });
    host.click();
    expect(target.getAttribute("data-state")).toBe("playing");
  });

  it("does not play for a visitor who asks for less motion", () => {
    const { target } = stage(true);
    const { canvas } = mount(target, "frost", { mode: "hover", reducedMotion: true });
    press(canvas, "Enter");
    expect(canvas.getAttribute("data-state")).toBe("rest");
  });

  it("stops listening once destroyed", () => {
    const { host, target } = stage(true);
    const handle = mountEffect(target, "frost", { mode: "hover", host });
    handle.destroy();
    host.click();
    press(handle.canvas, "Enter");
    expect(handle.canvas.getAttribute("data-state")).toBe("rest");
  });

  it("redraws the resting frame when the flake form changes", () => {
    const { target } = stage(true);
    const handle = mount(target, "frost", { mode: "hover" });
    const before = handle.canvas.toDataURL();
    handle.setShape("sector");
    expect(handle.canvas.toDataURL()).not.toBe(before);
    handle.setShape("dendrite");
    expect(handle.canvas.toDataURL()).toBe(before);
  });

  it(
    "plays a whole run, ignores triggers for the pause after it, then plays again",
    async () => {
      const { target } = stage(true);
      const { canvas } = mount(target, "frost", { mode: "hover" });
      press(canvas, "Enter");
      await vi.waitFor(() => expect(canvas.getAttribute("data-state")).toBe("rest"), {
        timeout: (VARIANTS.frost.period + 2) * 1000,
        interval: 100,
      });
      // The run has just ended: a trigger now does nothing.
      press(canvas, "Enter");
      expect(canvas.getAttribute("data-state")).toBe("rest");
      await new Promise((resolve) => setTimeout(resolve, REPLAY_PAUSE_MS - 500));
      press(canvas, "Enter");
      expect(canvas.getAttribute("data-state")).toBe("rest");
      // After the pause it plays again.
      await new Promise((resolve) => setTimeout(resolve, 700));
      press(canvas, "Enter");
      expect(canvas.getAttribute("data-state")).toBe("playing");
    },
    (VARIANTS.frost.period + 2) * 1000 + REPLAY_PAUSE_MS + 3000,
  );

  it("keeps the run on screen when the flake form changes in the middle of it", () => {
    const { target } = stage(true);
    const handle = mount(target, "frost", { mode: "hover" });
    handle.play();
    // Mid-run the picture belongs to the run; the form is applied to the next frame.
    handle.setShape("fern");
    expect(handle.canvas.getAttribute("data-state")).toBe("playing");
  });
});

describe("mountEffect: still mode", () => {
  it("only draws the resting frame and never plays", () => {
    const { target } = stage(true);
    const { canvas } = mount(target, "bars", { mode: "still" });
    press(canvas, "Enter");
    expect(canvas.getAttribute("data-state")).toBe("rest");
    expect(canvas.getAttribute("tabindex")).toBeNull();
  });
});
