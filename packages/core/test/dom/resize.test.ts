// Tests for src/dom/resize.ts. Runs in Chromium (see BROWSER_TESTS in vitest.config.ts).

import { afterEach, describe, expect, it, vi } from "vitest";
import { watchResize } from "../../src/dom/resize.ts";

/** Adds a box of the given width to the page. */
function box(width: number) {
  const element = document.createElement("div");
  Object.assign(element.style, { width: `${width}px`, height: "40px" });
  document.body.append(element);
  return element;
}

/** Waits long enough for ResizeObserver to deliver. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 100));

afterEach(() => {
  document.body.replaceChildren();
});

describe("watchResize", () => {
  it("does not report the starting size", async () => {
    const onResize = vi.fn();
    const stop = watchResize(box(100), onResize);
    await settle();
    expect(onResize).not.toHaveBeenCalled();
    stop();
  });

  it("reports a change of 2 px or more with the new size", async () => {
    const element = box(100);
    const onResize = vi.fn();
    const stop = watchResize(element, onResize);
    await settle();
    element.style.width = "102px";
    await vi.waitFor(() => expect(onResize).toHaveBeenCalledWith(102, 40));
    stop();
  });

  it("ignores changes under 2 px", async () => {
    const element = box(100);
    const onResize = vi.fn();
    const stop = watchResize(element, onResize);
    await settle();
    element.style.width = "101.5px";
    await settle();
    expect(onResize).not.toHaveBeenCalled();
    stop();
  });

  it("measures the next change from the last reported size", async () => {
    const element = box(100);
    const onResize = vi.fn();
    const stop = watchResize(element, onResize);
    await settle();
    element.style.width = "102px";
    await vi.waitFor(() => expect(onResize).toHaveBeenCalledWith(102, 40));
    // 1 px from the last report, though 3 px from the start: not reported.
    element.style.width = "103px";
    await settle();
    expect(onResize).toHaveBeenCalledTimes(1);
    stop();
  });

  it("stops reporting once stopped", async () => {
    const element = box(100);
    const onResize = vi.fn();
    const stop = watchResize(element, onResize);
    await settle();
    stop();
    element.style.width = "200px";
    await settle();
    expect(onResize).not.toHaveBeenCalled();
  });
});
