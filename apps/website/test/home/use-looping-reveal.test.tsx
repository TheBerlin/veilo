// Tests for src/home/use-looping-reveal.ts, in Chromium with the real engine.

import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useLoopingReveal } from "../../src/home/use-looping-reveal.ts";

/** A one-line card: a text slot the demo reveals. */
function Demo(props: { active: boolean }) {
  const { ref } = useLoopingReveal(
    { version: 1, effect: "shimmer", hold: 0.3, rDur: 0.2, textFx: "fade" },
    { version: 1, slots: { line: { role: "text" } } },
    props.active,
  );
  return (
    <div ref={ref}>
      <p data-veilo-slot="line">Hello</p>
    </div>
  );
}

/**
 * Waits.
 *
 * @param ms - Milliseconds.
 * @returns A promise that resolves after them.
 */
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Whether the skeleton is showing.
 *
 * @param container - The demo's container.
 * @returns True while a placeholder is on screen.
 */
const loading = (container: HTMLElement) =>
  container.querySelector("[data-veilo-skeleton]") !== null;

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useLoopingReveal", () => {
  it("loops: the skeleton, then the content, then the skeleton again", async () => {
    const { container } = render(<Demo active />);
    const options = { timeout: 5000, interval: 50 };
    await expect.poll(() => loading(container), options).toBe(true);
    await expect.poll(() => loading(container), options).toBe(false);
    await expect.poll(() => loading(container), options).toBe(true);
  });

  it("under reduced motion: lands on the content and stays there", async () => {
    const real = window.matchMedia.bind(window);
    // A media query list's methods need the real object as `this`.
    const bound = (media: MediaQueryList, key: string | symbol) => {
      const value = Reflect.get(media, key);
      return typeof value === "function" ? value.bind(media) : value;
    };
    vi.spyOn(window, "matchMedia").mockImplementation((query: string) =>
      query.includes("prefers-reduced-motion")
        ? (new Proxy(real(query), {
            get: (media, key) => (key === "matches" ? true : bound(media, key)),
          }) as MediaQueryList)
        : real(query),
    );
    const { container } = render(<Demo active />);
    // Longer than a whole looping cycle (0.3 + 0.2 + 0.9 s), sampled throughout.
    for (let index = 0; index < 20; index += 1) {
      await wait(150);
      if (index > 2) expect(loading(container), `at ${index * 150} ms`).toBe(false);
    }
  });

  it("does nothing until the demo is active", async () => {
    const { container } = render(<Demo active={false} />);
    await wait(500);
    expect(loading(container)).toBe(false);
  });
});
