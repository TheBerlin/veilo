// Tests for src/dom/overlay.ts. Runs in Chromium (see BROWSER_TESTS in vitest.config.ts).

import { afterEach, describe, expect, it } from "vitest";
import { mountTextOverlay } from "../../src/dom/overlay.ts";

const TEXT = "Lightweight 8K polling mouse with";

/** Adds a styled text element to the page. */
function textElement() {
  const element = document.createElement("p");
  element.textContent = TEXT;
  Object.assign(element.style, {
    width: "200px",
    font: "16px monospace",
    color: "rgb(10, 20, 30)",
    margin: "0",
  });
  document.body.append(element);
  return element;
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("mountTextOverlay", () => {
  it("keeps the real text in place, transparent, and hides the overlay from screen readers", () => {
    const element = textElement();
    const { overlay } = mountTextOverlay(element);
    expect(element.firstChild?.textContent).toBe(TEXT);
    expect(getComputedStyle(element).color).toBe("rgba(0, 0, 0, 0)");
    expect(overlay.getAttribute("aria-hidden")).toBe("true");
    expect(getComputedStyle(overlay).color).toBe("rgb(10, 20, 30)");
    expect(getComputedStyle(overlay).pointerEvents).toBe("none");
  });

  it("does not change the element's size and covers it exactly", () => {
    const element = textElement();
    const before = element.getBoundingClientRect();
    const { overlay } = mountTextOverlay(element);
    overlay.textContent = "●".repeat(TEXT.length);
    const after = element.getBoundingClientRect();
    expect([after.width, after.height, after.x, after.y]).toEqual([
      before.width,
      before.height,
      before.x,
      before.y,
    ]);
    const box = overlay.getBoundingClientRect();
    expect([box.x, box.y, box.width]).toEqual([after.x, after.y, after.width]);
  });

  it("makes a static element relative, and leaves a positioned one alone", () => {
    const plain = textElement();
    mountTextOverlay(plain);
    expect(plain.style.position).toBe("relative");

    const absolute = textElement();
    absolute.style.position = "absolute";
    mountTextOverlay(absolute);
    expect(absolute.style.position).toBe("absolute");
  });

  it("restores the element on unmount", () => {
    const element = textElement();
    const handle = mountTextOverlay(element);
    handle.unmount();
    expect(element.childNodes).toHaveLength(1);
    expect(element.style.color).toBe("rgb(10, 20, 30)");
    expect(element.style.position).toBe("");
  });
});
