// Tests for src/home/motion-demo.tsx, in Chromium with the real engine and the real photograph.

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MotionDemo } from "../../src/home/motion-demo.tsx";
import { reduceMotion } from "../support/media.ts";

afterEach(() => {
  vi.restoreAllMocks();
});

/**
 * The placeholders on screen now.
 *
 * @param container - The demo's container.
 * @returns The elements the engine is showing as placeholders.
 */
const placeholders = (container: HTMLElement) => [
  ...container.querySelectorAll<HTMLElement>("[data-veilo-skeleton]"),
];

/**
 * Whether any placeholder is animating.
 *
 * @param container - The demo's container.
 * @returns True when a placeholder has a running animation.
 */
const shimmering = (container: HTMLElement) =>
  placeholders(container).some((element) => getComputedStyle(element).animationName !== "none");

/**
 * Waits.
 *
 * @param ms - Milliseconds.
 * @returns A promise that resolves after them.
 */
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("MotionDemo", () => {
  it("has a switch named Reduced motion, off unless the visitor's own setting is on", () => {
    render(<MotionDemo active={false} />);
    const toggle = screen.getByRole("switch", { name: "Reduced motion" });
    expect(toggle.getAttribute("aria-checked")).toBe("false");
    expect(screen.getByText(/shimmers, then the reveal plays/)).toBeTruthy();
  });

  it("starts on when the visitor's own setting asks for less motion", () => {
    reduceMotion();
    render(<MotionDemo active={false} />);
    expect(
      screen.getByRole("switch", { name: "Reduced motion" }).getAttribute("aria-checked"),
    ).toBe("true");
    expect(screen.getByText(/stands still and the content appears at once/)).toBeTruthy();
  });

  it("off: the skeleton shimmers, and the sequence repeats", async () => {
    const { container } = render(<MotionDemo active />);
    const options = { timeout: 8000, interval: 50 };
    await expect.poll(() => shimmering(container), options).toBe(true);
    // Content arrives, then the skeleton comes back: a loop.
    await expect.poll(() => placeholders(container).length, options).toBe(0);
    await expect.poll(() => shimmering(container), options).toBe(true);
  }, 20000);

  it("on: the skeleton stands still, the content appears at once and stays", async () => {
    reduceMotion();
    const { container } = render(<MotionDemo active />);
    const options = { timeout: 8000, interval: 50 };
    await expect.poll(() => placeholders(container).length, options).toBeGreaterThan(0);
    expect(shimmering(container), "a still skeleton").toBe(false);
    await expect.poll(() => placeholders(container).length, options).toBe(0);
    // No repeat: longer than a whole looping cycle (hold, reveal and the gap) passes quietly.
    for (let waited = 0; waited < 3500; waited += 250) {
      await wait(250);
      expect(placeholders(container).length).toBe(0);
    }
  }, 20000);

  it("flipping the switch changes the behavior and the words", async () => {
    const { container } = render(<MotionDemo active />);
    const options = { timeout: 8000, interval: 50 };
    await expect.poll(() => shimmering(container), options).toBe(true);
    await userEvent.click(screen.getByRole("switch", { name: "Reduced motion" }));
    expect(screen.getByText(/stands still and the content appears at once/)).toBeTruthy();
    // The card is made again as a reduced one: its skeleton is still.
    await expect.poll(() => placeholders(container).length, options).toBeGreaterThan(0);
    expect(shimmering(container)).toBe(false);
    await userEvent.click(screen.getByRole("switch", { name: "Reduced motion" }));
    expect(screen.getByText(/shimmers, then the reveal plays/)).toBeTruthy();
    await expect.poll(() => shimmering(container), options).toBe(true);
  }, 30000);

  it("keeps the picture out of the accessibility tree; the switch and the line carry the meaning", () => {
    const { container } = render(<MotionDemo active={false} />);
    expect(
      container.querySelector("[aria-hidden=true] canvas, canvas[aria-hidden=true]"),
    ).not.toBeNull();
    expect(screen.getByRole("switch")).toBeTruthy();
  });
});
