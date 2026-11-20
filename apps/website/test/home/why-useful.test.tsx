// Tests for src/home/why-useful.tsx: the section's structure, in Chromium.

import { render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { WhyUseful } from "../../src/home/why-useful.tsx";

afterEach(async () => {
  await page.viewport(414, 896);
});

describe("WhyUseful", () => {
  it("is a section labelled by its h2, with the badge above it", () => {
    render(<WhyUseful />);
    const section = screen.getByRole("region", { name: "Why it's useful" });
    expect(within(section).getByText("Why Veilo").tagName).toBe("SPAN");
    expect(within(section).getAllByRole("heading", { level: 2 })).toHaveLength(1);
  });

  it("has four tiles, each an article with a title and a caption", () => {
    render(<WhyUseful />);
    const tiles = screen.getAllByRole("article");
    expect(tiles).toHaveLength(4);
    for (const tile of tiles) {
      expect(within(tile).getAllByRole("heading", { level: 3 })).toHaveLength(1);
    }
  });

  it("hides the one decorative demo from assistive technology and exposes the three that can be operated", () => {
    render(<WhyUseful />);
    const [layout, css, framework, motion] = screen.getAllByRole("article") as [
      HTMLElement,
      HTMLElement,
      HTMLElement,
      HTMLElement,
    ];
    // The layout tile's frame holds the divider, a slider; the framework tile's holds the choice of
    // framework, a group of radios; the motion tile's holds a switch. Their frames are exposed.
    expect(within(layout).getByRole("slider")).toBeTruthy();
    expect(within(framework).getByRole("radiogroup", { name: "Framework" })).toBeTruthy();
    expect(within(motion).getByRole("switch", { name: "Reduced motion" })).toBeTruthy();
    for (const tile of [layout, framework, motion]) {
      expect(tile.querySelector(":scope > div > [aria-hidden=true]")).toBeNull();
    }
    // The CSS-only tile is decoration: its frame is hidden and the text carries the message.
    expect(css.querySelector("[aria-hidden=true]")).not.toBeNull();
    expect(within(css).queryByRole("slider")).toBeNull();
    expect(within(css).queryByRole("switch")).toBeNull();
    expect(screen.getAllByRole("slider")).toHaveLength(1);
  });

  it("lays the tiles out as two rows of 8 and 4 columns, each row ending on one line", async () => {
    await page.viewport(1440, 900);
    render(<WhyUseful />);
    const boxes = screen.getAllByRole("article").map((tile) => tile.getBoundingClientRect());
    const [layout, css, framework, motion] = boxes as [DOMRect, DOMRect, DOMRect, DOMRect];
    // Wide tiles are twice as wide as narrow ones (8 columns against 4, minus a gutter).
    expect(layout.width / css.width).toBeGreaterThan(1.8);
    expect(framework.width / motion.width).toBeGreaterThan(1.8);
    // A row's tiles start and end on the same lines.
    expect(css.top).toBe(layout.top);
    expect(css.height).toBe(layout.height);
    expect(motion.top).toBe(framework.top);
    expect(motion.height).toBe(framework.height);
    // The second row is below the first.
    expect(framework.top).toBeGreaterThan(layout.bottom);
  });

  it("gives every tile its own row on a phone", async () => {
    await page.viewport(375, 800);
    render(<WhyUseful />);
    const tops = screen.getAllByRole("article").map((tile) => tile.getBoundingClientRect().top);
    expect(new Set(tops).size).toBe(4);
  });
});
