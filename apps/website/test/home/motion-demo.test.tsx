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

/** The polling options for waits on the real engine. */
const POLL = { timeout: 8000, interval: 50 };

/**
 * Presses the switch.
 *
 * @returns A promise that resolves after the click.
 */
const flip = () => userEvent.click(screen.getByRole("switch", { name: "Reduced motion" }));

/**
 * Waits until the card's photograph is on screen, so the card exists.
 *
 * @param container - The demo's container.
 * @returns A promise that resolves when it is.
 */
const cardReady = (container: HTMLElement) =>
  vi.waitFor(() => expect(container.querySelector("canvas")).not.toBeNull(), POLL);

describe("MotionDemo", () => {
  it("has a switch named Reduced motion, off unless the visitor's own setting is on", () => {
    render(<MotionDemo />);
    const toggle = screen.getByRole("switch", { name: "Reduced motion" });
    expect(toggle.getAttribute("aria-checked")).toBe("false");
    // The label shows the value of the setting the card follows, as CSS writes it.
    expect(screen.getByText("prefers-reduced-motion: no-preference")).toBeTruthy();
    // At rest the line says how to start.
    expect(screen.getByText(/Press Play, or flip the switch, to load the card/)).toBeTruthy();
  });

  it("starts on when the visitor's own setting asks for less motion", () => {
    reduceMotion();
    render(<MotionDemo />);
    expect(
      screen.getByRole("switch", { name: "Reduced motion" }).getAttribute("aria-checked"),
    ).toBe("true");
    expect(screen.getByText("prefers-reduced-motion: reduce")).toBeTruthy();
    expect(screen.getByText(/Press Play, or flip the switch, to load the card/)).toBeTruthy();
  });

  it("the label and the line follow the switch once the card has been run", async () => {
    const { container } = render(<MotionDemo />);
    await cardReady(container);
    await flip();
    expect(screen.getByText("prefers-reduced-motion: reduce")).toBeTruthy();
    expect(screen.getByText(/stands still and the content appears at once/)).toBeTruthy();
    expect(screen.queryByText(/Press Play, or flip the switch/)).toBeNull();
    await flip();
    expect(screen.getByText("prefers-reduced-motion: no-preference")).toBeTruthy();
    expect(screen.getByText(/shimmers, then the reveal plays/)).toBeTruthy();
  });

  it("has a Play button that can be seen: an outlined button, not a bare link", () => {
    render(<MotionDemo />);
    const play = screen.getByRole("button", { name: "Play" });
    const style = getComputedStyle(play);
    expect(style.borderTopWidth).toBe("1px");
    expect(style.borderTopStyle).toBe("solid");
  });

  it("rests on the finished card and moves nothing until the visitor asks", async () => {
    const { container } = render(<MotionDemo />);
    await cardReady(container);
    // Longer than a whole sequence (a 1.2 s hold, the reveal and a gap), sampled throughout.
    for (let waited = 0; waited < 3000; waited += 250) {
      await wait(250);
      expect(placeholders(container).length).toBe(0);
    }
    expect(screen.getByRole("button", { name: "Play" })).toBeTruthy();
  }, 15000);

  it("Play, switch off: the skeleton shimmers once, the content is revealed, nothing repeats", async () => {
    const { container } = render(<MotionDemo />);
    await cardReady(container);
    await userEvent.click(screen.getByRole("button", { name: "Play" }));
    await expect.poll(() => shimmering(container), POLL).toBe(true);
    await expect.poll(() => placeholders(container).length, POLL).toBe(0);
    // No loop: a whole cycle passes without the skeleton coming back.
    for (let waited = 0; waited < 3500; waited += 250) {
      await wait(250);
      expect(placeholders(container).length).toBe(0);
    }
    expect(screen.getByRole("button", { name: "Play again" })).toBeTruthy();
  }, 25000);

  it("flipping the switch on: a still skeleton, then the content at once, with no repeat", async () => {
    const { container } = render(<MotionDemo />);
    await cardReady(container);
    await flip();
    expect(screen.getByText(/stands still and the content appears at once/)).toBeTruthy();
    await expect.poll(() => placeholders(container).length, POLL).toBeGreaterThan(0);
    expect(shimmering(container), "a still skeleton").toBe(false);
    await expect.poll(() => placeholders(container).length, POLL).toBe(0);
    for (let waited = 0; waited < 3500; waited += 250) {
      await wait(250);
      expect(placeholders(container).length).toBe(0);
    }
  }, 25000);

  it("flipping the switch off again loads the card with motion, and Play again repeats a run", async () => {
    reduceMotion();
    const { container } = render(<MotionDemo />);
    await cardReady(container);
    await flip();
    expect(screen.getByText(/shimmers, then the reveal plays/)).toBeTruthy();
    await expect.poll(() => shimmering(container), POLL).toBe(true);
    await expect.poll(() => placeholders(container).length, POLL).toBe(0);
    await userEvent.click(screen.getByRole("button", { name: "Play again" }));
    await expect.poll(() => shimmering(container), POLL).toBe(true);
  }, 25000);

  it("keeps the picture out of the accessibility tree; the controls and the line carry the meaning", () => {
    const { container } = render(<MotionDemo />);
    expect(container.querySelector("[aria-hidden=true] canvas")).not.toBeNull();
    expect(screen.getByRole("switch")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Play" })).toBeTruthy();
  });
});
