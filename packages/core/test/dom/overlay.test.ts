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
  it("keeps the real text in place, unpainted, and hides the overlay from screen readers", () => {
    const element = textElement();
    const { overlay } = mountTextOverlay(element);
    expect(element.firstChild?.textContent).toBe(TEXT);
    expect(getComputedStyle(element).webkitTextFillColor).toBe("rgba(0, 0, 0, 0)");
    expect(getComputedStyle(element).color).toBe("rgb(10, 20, 30)");
    expect(overlay.getAttribute("aria-hidden")).toBe("true");
    expect(getComputedStyle(overlay).webkitTextFillColor).toBe("rgb(10, 20, 30)");
    expect(getComputedStyle(overlay).pointerEvents).toBe("none");
  });

  it("follows a text color that changes while mounted, such as a theme switch", () => {
    const element = textElement();
    const { overlay } = mountTextOverlay(element);
    element.style.color = "rgb(200, 100, 50)";
    expect(getComputedStyle(overlay).webkitTextFillColor).toBe("rgb(200, 100, 50)");
  });

  it("also hides child elements that set their own color", () => {
    const element = textElement();
    const bold = document.createElement("b");
    bold.textContent = "!";
    bold.style.color = "red";
    element.append(bold);
    mountTextOverlay(element);
    expect(getComputedStyle(bold).webkitTextFillColor).toBe("rgba(0, 0, 0, 0)");
  });

  it("keeps the overlay of an inline element on one line", () => {
    const element = textElement();
    element.style.display = "inline";
    const { overlay } = mountTextOverlay(element);
    overlay.textContent = `${TEXT}▍`;
    expect(overlay.getBoundingClientRect().height).toBe(element.getBoundingClientRect().height);
    expect(getComputedStyle(overlay).whiteSpace).toBe("nowrap");
  });

  it("lets the overlay of a block element wrap like the real text", () => {
    const { overlay } = mountTextOverlay(textElement());
    expect(getComputedStyle(overlay).whiteSpace).toBe("normal");
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

  it("restores the element exactly on unmount", () => {
    const element = textElement();
    const before = element.outerHTML;
    mountTextOverlay(element).unmount();
    expect(element.outerHTML).toBe(before);

    const bare = document.createElement("p");
    bare.textContent = "x";
    document.body.append(bare);
    mountTextOverlay(bare).unmount();
    expect(bare.hasAttribute("style")).toBe(false);

    const filled = textElement();
    filled.style.setProperty("-webkit-text-fill-color", "blue", "important");
    mountTextOverlay(filled).unmount();
    expect(filled.style.getPropertyValue("-webkit-text-fill-color")).toBe("blue");
    expect(filled.style.getPropertyPriority("-webkit-text-fill-color")).toBe("important");
  });
});
