// Tests for src/home/why-tiles.tsx: the tiles' copy and their demos, in Chromium with the real
// engine and the real stylesheet.

import { render } from "@testing-library/react";
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

  it("CSS-only loaders: names the stylesheet and each class, and each really animates", () => {
    const container = demo("css", false);
    expect(container.textContent).toContain('@import "@veilo-ui/css/skeleton.css";');
    for (const name of ["shimmer", "wave", "pulse"]) {
      const label = [...container.querySelectorAll("code")].find(
        (code) => code.textContent === `class="veilo veilo-${name}"`,
      )!;
      expect(label, name).toBeTruthy();
      // The placeholder under the label: an avatar and two lines, all with that class.
      const parts = label.nextElementSibling!.querySelectorAll("span");
      expect(parts, name).toHaveLength(3);
      for (const part of parts) {
        expect(getComputedStyle(part).animationName, name).toBe(`veilo-${name}`);
      }
    }
  });

  it("CSS-only loaders: the wave staggers its three parts through --i", () => {
    const container = demo("css", false);
    const parts = [...container.querySelectorAll(".veilo-wave")] as HTMLElement[];
    expect(parts.map((part) => part.style.getPropertyValue("--i"))).toEqual(["0", "1", "2"]);
    const delays = parts.map((part) => getComputedStyle(part).animationDelay);
    expect(new Set(delays).size).toBe(3);
  });

  it("Reduced motion: one placeholder moves, the other rests, and the media query is named", () => {
    const container = demo("motion", false);
    const items = [...container.querySelectorAll("[aria-hidden=true]")];
    const [moving, resting] = items.map((item) => [...item.querySelectorAll("span")]);
    expect(moving).toHaveLength(3);
    expect(resting).toHaveLength(3);
    for (const part of moving!) expect(getComputedStyle(part).animationName).toBe("veilo-shimmer");
    for (const part of resting!) expect(getComputedStyle(part).animationName).toBe("none");
    expect(container.textContent).toContain("@media (prefers-reduced-motion: reduce)");
  });
});
