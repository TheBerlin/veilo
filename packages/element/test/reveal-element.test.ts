// Tests for src/reveal-element.ts: <veilo-reveal> in a real browser, with a hand-driven clock.

import { beforeAll, describe, expect, it, vi } from "vitest";
import { fakeScheduler } from "../../core/test/support/scheduler.ts";
import { defineVeiloElements } from "../src/define.ts";
import { COMPLETE_EVENT } from "../src/reveal-element.ts";

beforeAll(() => {
  defineVeiloElements();
});

/** The card's parts, as a user's markup would mark them. */
const SLOTS = '<h2 data-veilo-slot="title">Title</h2><p data-veilo-slot="line">A line of text</p>';

/**
 * Builds a `<veilo-reveal>` with a fake clock, puts it in the page and waits for its first
 * update.
 *
 * @param attributes - Attributes to set before it enters the page.
 * @param html - Its content.
 * @returns The element, its clock, and `run` to let `ready` settle and move time on.
 */
async function mount(attributes: Record<string, string> = {}, html = SLOTS) {
  const time = fakeScheduler();
  const element = document.createElement("veilo-reveal");
  element.options = { scheduler: time.scheduler, reducedMotion: false };
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  element.innerHTML = html;
  document.body.append(element);
  await element.updateComplete;
  /**
   * Lets core's async `ready` settle, then moves the clock.
   *
   * @param ms - How far to move; by default past a whole reveal.
   */
  const run = async (ms = 6000) => {
    await element.reveal?.ready;
    time.advance(ms);
  };
  return { element, time, run };
}

/** A small square photo as a data URL, so the grid effects have something to sample. */
function photo(): string {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 32;
  const context = canvas.getContext("2d")!;
  context.fillStyle = "#fff";
  context.fillRect(0, 0, 32, 32);
  context.fillStyle = "#111";
  context.fillRect(8, 8, 16, 16);
  return canvas.toDataURL();
}

describe("<veilo-reveal>", () => {
  it("shows the skeleton while loading", async () => {
    const { element } = await mount({ loading: "" });
    expect(element.getAttribute("aria-busy")).toBe("true");
    expect(element.reveal?.state).toBe("loading");
    expect(element.shadowRoot).toBeNull();
  });

  it("leaves content that was there from the start as it is", async () => {
    const { element, run } = await mount();
    await run();
    expect(element.reveal?.state).toBe("idle");
    expect(element.innerHTML).toBe(SLOTS);
    expect(element.hasAttribute("aria-busy")).toBe(false);
  });

  it("plays the reveal when loading ends, and fires veilo-complete", async () => {
    const { element, run } = await mount({ loading: "" });
    const complete = vi.fn();
    document.body.addEventListener(COMPLETE_EVENT, complete);
    element.removeAttribute("loading");
    await element.updateComplete;
    await run(300);
    expect(element.reveal?.state).toBe("revealing");
    await run();
    expect(element.reveal?.state).toBe("revealed");
    expect(complete).toHaveBeenCalledTimes(1);
    expect(element.innerHTML).toBe(SLOTS);
    document.body.removeEventListener(COMPLETE_EVENT, complete);
  });

  it("shows the skeleton again when loading turns back on", async () => {
    const { element, run } = await mount({ loading: "" });
    element.loading = false;
    await element.updateComplete;
    await run();
    element.loading = true;
    await element.updateComplete;
    expect(element.reveal?.state).toBe("loading");
    expect(element.getAttribute("loading")).toBe("");
  });

  it("plays at once with reveal-on-connect", async () => {
    const { element, run } = await mount({ "reveal-on-connect": "" });
    await run(300);
    expect(element.reveal?.state).toBe("revealing");
  });

  it("makes a new reveal only when the effect really changes", async () => {
    const { element } = await mount({ settings: '{"rDur":2}' });
    const first = element.reveal;
    element.settings = { rDur: 2 };
    await element.updateComplete;
    expect(element.reveal).toBe(first);
    element.preset = "mosaic-from-edge";
    await element.updateComplete;
    expect(element.reveal).not.toBe(first);
    expect(element.reveal).not.toBeNull();
  });

  it("restores the page when removed mid-reveal", async () => {
    const { element, run } = await mount({ loading: "" });
    element.loading = false;
    await element.updateComplete;
    await run(300);
    element.remove();
    expect(element.reveal).toBeNull();
    expect(element.innerHTML).toBe(SLOTS);
    expect(element.hasAttribute("aria-busy")).toBe(false);
  });

  it("lays the grid canvas exactly over the photo inside an inline element", async () => {
    const html = `<img data-veilo-slot="photo" src="${photo()}" width="120" height="120" alt="">${SLOTS}`;
    const { element, run } = await mount({ loading: "", preset: "dot-upscale" }, html);
    // The element is display: inline, as an unknown tag is by default.
    expect(getComputedStyle(element).display).toBe("inline");
    element.loading = false;
    await element.updateComplete;
    await run(400);
    const canvas = element.querySelector("canvas");
    expect(canvas).not.toBeNull();
    const a = element.querySelector("img")!.getBoundingClientRect();
    const b = canvas!.getBoundingClientRect();
    expect([b.left, b.top, b.width, b.height]).toEqual([a.left, a.top, a.width, a.height]);
  });
});
