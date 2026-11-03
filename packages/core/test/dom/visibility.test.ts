// Tests for src/dom/visibility.ts. Runs in Chromium (see BROWSER_TESTS in vitest.config.ts).

import { afterEach, describe, expect, it, vi } from "vitest";
import { watchVisibility } from "../../src/dom/visibility.ts";

/** Adds a 50 x 50 px box at the given page position. */
function box(top: number) {
  const element = document.createElement("div");
  Object.assign(element.style, {
    position: "fixed",
    left: "0",
    top: `${top}px`,
    width: "50px",
    height: "50px",
  });
  document.body.append(element);
  return element;
}

/** Pretends the tab was hidden or shown, and tells the page. */
function setPageHidden(hidden: boolean) {
  Object.defineProperty(document, "visibilityState", {
    value: hidden ? "hidden" : "visible",
    configurable: true,
  });
  document.dispatchEvent(new Event("visibilitychange"));
}

afterEach(() => {
  // Removes the own property, so the real getter on the prototype shows through again.
  delete (document as { visibilityState?: unknown }).visibilityState;
  document.body.replaceChildren();
});

describe("watchVisibility", () => {
  it("stays quiet for an element that starts on screen", async () => {
    const onChange = vi.fn();
    const stop = watchVisibility(box(0), onChange);
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(onChange).not.toHaveBeenCalled();
    stop();
  });

  it("reports an element that starts off screen, then comes into view", async () => {
    const element = box(-10_000);
    const onChange = vi.fn();
    const stop = watchVisibility(element, onChange);
    await vi.waitFor(() => expect(onChange).toHaveBeenLastCalledWith(false));
    element.style.top = "0px";
    await vi.waitFor(() => expect(onChange).toHaveBeenLastCalledWith(true));
    expect(onChange).toHaveBeenCalledTimes(2);
    stop();
  });

  it("reports the tab being hidden and shown again", async () => {
    const onChange = vi.fn();
    const stop = watchVisibility(box(0), onChange);
    setPageHidden(true);
    expect(onChange).toHaveBeenLastCalledWith(false);
    setPageHidden(false);
    expect(onChange).toHaveBeenLastCalledWith(true);
    expect(onChange).toHaveBeenCalledTimes(2);
    stop();
  });

  it("stops reporting once stopped", async () => {
    const element = box(0);
    const onChange = vi.fn();
    const stop = watchVisibility(element, onChange);
    stop();
    setPageHidden(true);
    element.style.top = "-10000px";
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(onChange).not.toHaveBeenCalled();
    stop();
  });
});
