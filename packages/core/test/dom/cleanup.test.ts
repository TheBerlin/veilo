// Tests for src/dom/cleanup.ts. Runs in Chromium (see BROWSER_TESTS in vitest.config.ts).

import { describe, expect, it } from "vitest";
import { createCleanup } from "../../src/dom/cleanup.ts";

describe("createCleanup", () => {
  it("runs undo steps newest first, once", () => {
    const order: number[] = [];
    const cleanup = createCleanup();
    cleanup.add(() => order.push(1));
    cleanup.add(() => order.push(2));
    cleanup.run();
    cleanup.run();
    expect(order).toEqual([2, 1]);
  });

  it("restores an inline style, including one that was not set", () => {
    const element = document.createElement("div");
    element.style.color = "red";
    const cleanup = createCleanup();
    cleanup.style(element, "color", "blue");
    cleanup.style(element, "position", "relative");
    expect(element.getAttribute("style")).toBe("color: blue; position: relative;");
    cleanup.run();
    expect(element.getAttribute("style")).toBe("color: red;");
  });

  it("restores the original value after several changes of one property", () => {
    const element = document.createElement("div");
    element.style.opacity = "0.7";
    const cleanup = createCleanup();
    cleanup.style(element, "opacity", "0");
    cleanup.style(element, "opacity", "0.5");
    cleanup.style(element, "opacity", "1");
    cleanup.run();
    expect(element.style.opacity).toBe("0.7");
  });

  it("keeps !important", () => {
    const element = document.createElement("div");
    element.style.setProperty("color", "red", "important");
    const cleanup = createCleanup();
    cleanup.style(element, "color", "blue");
    cleanup.run();
    expect(element.style.getPropertyPriority("color")).toBe("important");
    expect(element.style.color).toBe("red");
  });

  it("restores custom properties", () => {
    const element = document.createElement("div");
    const cleanup = createCleanup();
    cleanup.style(element, "--bg-a", "0.5");
    expect(element.style.getPropertyValue("--bg-a")).toBe("0.5");
    cleanup.run();
    expect(element.getAttribute("style")).toBe("");
  });

  it("restores attributes, and removes ones that were not there", () => {
    const element = document.createElement("div");
    element.setAttribute("data-a", "old");
    const cleanup = createCleanup();
    cleanup.attribute(element, "data-a", "new");
    cleanup.attribute(element, "data-a", "newer");
    cleanup.attribute(element, "data-b", "added");
    cleanup.run();
    expect(element.getAttribute("data-a")).toBe("old");
    expect(element.hasAttribute("data-b")).toBe(false);
  });

  it("runs every step even when one throws, then reports the first error", () => {
    const ran: number[] = [];
    const cleanup = createCleanup();
    cleanup.add(() => ran.push(1));
    cleanup.add(() => {
      throw new Error("first");
    });
    cleanup.add(() => {
      throw new Error("second");
    });
    expect(() => cleanup.run()).toThrow("second");
    expect(ran).toEqual([1]);
  });

  it("starts recording again after a run", () => {
    const element = document.createElement("div");
    const cleanup = createCleanup();
    cleanup.style(element, "color", "blue");
    cleanup.run();
    element.style.color = "green";
    cleanup.style(element, "color", "blue");
    cleanup.run();
    expect(element.style.color).toBe("green");
  });
});
