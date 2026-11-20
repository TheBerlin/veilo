// Tests for src/home/why-useful.tsx: the section's structure, in Chromium.

import { render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { WhyUseful } from "../../src/home/why-useful.tsx";

afterEach(async () => {
  await page.viewport(414, 896);
});

describe("WhyUseful", () => {
  it("is a section labelled by its h2, which stands alone with no label above it", () => {
    render(<WhyUseful />);
    const section = screen.getByRole("region", {
      name: "Loading states that stay out of your way.",
    });
    expect(within(section).getAllByRole("heading", { level: 2 })).toHaveLength(1);
    // Nothing in the heading's block but the h2.
    expect(within(section).getByRole("heading", { level: 2 }).parentElement!.children).toHaveLength(
      1,
    );
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

  describe("the frames' spacing", () => {
    /**
     * How far a frame's content is from its padded edges, top and bottom.
     *
     * @param tile - The tile element.
     * @returns The air above and below the content, in px.
     */
    function airIn(tile: HTMLElement) {
      const frame = tile.firstElementChild!.firstElementChild as HTMLElement;
      const box = frame.getBoundingClientRect();
      const style = getComputedStyle(frame);
      let top = Infinity;
      let bottom = -Infinity;
      for (const element of frame.querySelectorAll("*")) {
        const rect = element.getBoundingClientRect();
        if (!rect.width || !rect.height || getComputedStyle(element).visibility === "hidden")
          continue;
        top = Math.min(top, rect.top);
        bottom = Math.max(bottom, rect.bottom);
      }
      return {
        above: top - box.top - parseFloat(style.paddingTop),
        below: box.bottom - bottom - parseFloat(style.paddingBottom),
        width: box.width,
        height: box.height,
      };
    }

    it.each([1100, 960, 700, 375])(
      "the CSS-only tile's rows and the reduced motion tile's content fill their frames, at %i px",
      async (width) => {
        await page.viewport(width, 900);
        render(<WhyUseful />);
        const tiles = screen.getAllByRole("article");
        for (const [index, name] of [
          [1, "CSS-only"],
          [3, "reduced motion"],
        ] as const) {
          const { above, below } = airIn(tiles[index]!);
          expect(above, `${name} above`).toBeLessThanOrEqual(2);
          expect(below, `${name} below`).toBeLessThanOrEqual(2);
        }
      },
    );

    /**
     * Reads a computed CSS color as sRGB, whatever way the browser writes it.
     *
     * @param value - A computed color: `rgb(...)` or `color(srgb r g b)`.
     * @returns Red, green and blue, 0 to 255.
     */
    function srgb(value: string): [number, number, number] {
      const numbers = (value.match(/-?\d*\.?\d+/g) ?? []).map(Number);
      const scale = value.startsWith("color(") ? 255 : 1;
      return [numbers[0]! * scale, numbers[1]! * scale, numbers[2]! * scale];
    }

    /**
     * The WCAG contrast ratio of two colors.
     *
     * @param a - One color.
     * @param b - The other.
     * @returns The ratio, 1 or more.
     */
    function contrast(a: [number, number, number], b: [number, number, number]): number {
      const luminance = (rgb: [number, number, number]) => {
        const [r, g, bl] = rgb.map((channel) => {
          const c = channel / 255;
          return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
        }) as [number, number, number];
        return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
      };
      const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
      return (light + 0.05) / (dark + 0.05);
    }

    it.each(["dark", "light"])(
      "in %s: the placeholders' base is visibly off the frame, and the sweep's highlight clearly so",
      (theme) => {
        document.documentElement.dataset.theme = theme;
        render(<WhyUseful />);
        const frame = screen.getAllByRole("article")[1]!.firstElementChild!
          .firstElementChild as HTMLElement;
        // Resolve the custom properties through a real element, so color-mix is computed.
        const probe = (property: string) => {
          const element = document.createElement("span");
          element.style.background = `var(${property})`;
          frame.append(element);
          const color = getComputedStyle(element).backgroundColor;
          element.remove();
          return srgb(color);
        };
        const surface = srgb(getComputedStyle(frame).backgroundColor);
        expect(contrast(probe("--veilo-base"), surface)).toBeGreaterThanOrEqual(1.8);
        expect(contrast(probe("--veilo-hi"), surface)).toBeGreaterThanOrEqual(3);
      },
    );

    it.each([1440, 1214, 1100, 960])(
      "the two frames of a row end on one line, whatever their captions wrap to, at %i px",
      async (width) => {
        await page.viewport(width, 900);
        render(<WhyUseful />);
        const tiles = screen.getAllByRole("article");
        const frame = (index: number) =>
          (
            tiles[index]!.firstElementChild!.firstElementChild as HTMLElement
          ).getBoundingClientRect();
        // Row 1 is tiles 1 and 2, row 2 is tiles 3 and 4.
        for (const [a, b] of [
          [0, 1],
          [2, 3],
        ] as const) {
          expect(frame(a).height, `frames ${a + 1} and ${b + 1}`).toBeCloseTo(frame(b).height, 0);
          expect(frame(a).top).toBeCloseTo(frame(b).top, 0);
        }
      },
    );

    it("a full-width tile on a small screen is no taller than its demo needs, not a square", async () => {
      await page.viewport(700, 900);
      render(<WhyUseful />);
      for (const tile of screen.getAllByRole("article")) {
        const { width, height } = airIn(tile);
        expect(height, "shorter than it is wide").toBeLessThan(width);
      }
    });
  });
});
