// Tests for src/home/why-tiles.tsx: the tiles' copy and their demos, in Chromium with the real
// engine and the real stylesheet.

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WHY_TILES } from "../../src/home/why-tiles.tsx";

/**
 * Renders one tile's demo.
 *
 * @param id - The tile's id.
 * @param active - Whether the tile counts as scrolled into view.
 * @returns The container that holds the demo.
 */
function demo(id: string, active = true): HTMLElement {
  const tile = WHY_TILES.find((candidate) => candidate.id === id)!;
  return render(<div>{tile.demo({ active })}</div>).container;
}

describe("WHY_TILES", () => {
  it("has the four tiles, in order, with the agreed copy", () => {
    expect(WHY_TILES.map((tile) => [tile.title, tile.caption])).toEqual([
      ["Layout stays put.", "Placeholders keep the content's size."],
      ["CSS-only loaders.", "No JavaScript needed to shimmer."],
      ["Your framework.", "React, Vue, Svelte, Angular or HTML."],
      ["Reduced motion.", "Effects calm down when users ask."],
    ]);
  });

  it("marks the first and third tiles as the wide ones", () => {
    expect(WHY_TILES.map((tile) => tile.wide)).toEqual([true, false, true, false]);
  });

  it("CSS-only loaders: the three classes really animate, from the stylesheet alone", () => {
    const container = demo("css", false);
    for (const [name, className] of [
      ["shimmer", ".veilo-shimmer"],
      ["wave", ".veilo-wave"],
      ["pulse", ".veilo-pulse"],
    ] as const) {
      const bar = container.querySelector(className)!;
      expect(getComputedStyle(bar).animationName, name).toBe(`veilo-${name}`);
    }
  });

  it("Reduced motion: one bar moves and the other rests", () => {
    const container = demo("motion", false);
    const [moving, resting] = [...container.querySelectorAll(".veilo")];
    expect(getComputedStyle(moving!).animationName).toBe("veilo-shimmer");
    expect(getComputedStyle(resting!).animationName).toBe("none");
  });

  it("Your framework: lists the six ways in that exist as packages", () => {
    demo("framework", false);
    for (const name of ["React", "Vue", "Svelte", "Angular", "Web components", "Plain HTML"]) {
      expect(screen.getByText(name)).toBeTruthy();
    }
  });
});
