// Tests for src/element.ts, in Chromium.

import { describe, expect, it, vi } from "vitest";
import { SEASONAL_EFFECT_TAG, defineSeasonalEffect } from "../src/element.ts";

defineSeasonalEffect();

/**
 * Adds an element to the page.
 *
 * @param attributes - Its attributes.
 * @returns The element.
 */
function add(attributes: Record<string, string>): HTMLElement {
  const element = document.createElement(SEASONAL_EFFECT_TAG);
  element.style.cssText = "width:240px;height:240px";
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  document.body.append(element);
  return element;
}

describe("<veilo-seasonal-effect>", () => {
  it("can be defined twice without an error", () => {
    expect(() => defineSeasonalEffect()).not.toThrow();
    expect(customElements.get(SEASONAL_EFFECT_TAG)).toBeDefined();
  });

  it("draws a canvas inside itself, as a block", () => {
    const element = add({ name: "frost", mode: "still", label: "Loading" });
    const canvas = element.querySelector("canvas")!;
    expect(getComputedStyle(element).display).toBe("block");
    expect(canvas.getAttribute("aria-label")).toBe("Loading");
    expect(canvas.clientWidth).toBe(240);
  });

  it("changes the flake form without making a new canvas", () => {
    const element = add({ name: "frost", mode: "still" });
    const canvas = element.querySelector("canvas")!;
    const before = canvas.toDataURL();
    element.setAttribute("shape", "fir");
    expect(element.querySelector("canvas")).toBe(canvas);
    expect(canvas.toDataURL()).not.toBe(before);
  });

  it("swaps the effect when the name changes, and removes the canvas when it is removed", () => {
    const element = add({ name: "frost", mode: "still" });
    element.setAttribute("name", "cell-frost");
    expect(element.querySelectorAll("canvas")).toHaveLength(1);
    element.remove();
    expect(element.querySelector("canvas")).toBeNull();
  });

  it("warns, and draws nothing, for a name that is not an effect", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const element = add({ name: "nope" });
    expect(element.querySelector("canvas")).toBeNull();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("Unknown effect: nope"));
    warn.mockRestore();
  });
});
