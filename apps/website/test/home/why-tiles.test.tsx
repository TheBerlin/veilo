// Tests for src/home/why-tiles.tsx: the tiles' copy and their demos, in Chromium with the real
// engine and the real stylesheet.

import { render } from "@testing-library/react";
import { userEvent } from "vitest/browser";
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
      ["Layout stays put.", "Veilo draws over your own elements and never resizes them."],
      ["CSS-only loaders.", "A 2 KB stylesheet, and no JavaScript."],
      ["Your framework.", "One settings object, the same in every package."],
      ["Reduced motion.", "Veilo reads the visitor's setting itself. You configure nothing."],
    ]);
  });

  it("adds a fact in each caption that its card does not already say", () => {
    // The card says what happens; the caption says how, how big, or how much work. None of the
    // captions repeats the title or the words of the notes and lines inside the card.
    for (const tile of WHY_TILES) {
      expect(tile.caption.toLowerCase()).not.toContain(tile.title.replace(".", "").toLowerCase());
    }
    const notes = [
      "No room kept for the text",
      "Text lines are reserved",
      "The button never moves",
    ];
    for (const note of notes) expect(WHY_TILES[0]!.caption).not.toContain(note);
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

  it("CSS-only loaders: the rows rest until the pointer is on one, then that row runs alone", async () => {
    const container = demo("css", false);
    // Each row is a CSS-module class named row; the container's is named rows.
    const rows = [...container.querySelectorAll<HTMLElement>("[class*=_row_]")];
    expect(rows).toHaveLength(3);
    const states = () =>
      rows.map((row) =>
        [...row.querySelectorAll(".veilo")].map(
          (part) => getComputedStyle(part).animationPlayState,
        ),
      );
    // At rest every part is paused.
    expect(
      states()
        .flat()
        .every((state) => state === "paused"),
    ).toBe(true);
    await userEvent.hover(rows[1]!);
    expect(states()[1]!.every((state) => state === "running")).toBe(true);
    expect(states()[0]!.every((state) => state === "paused")).toBe(true);
    expect(states()[2]!.every((state) => state === "paused")).toBe(true);
    await userEvent.unhover(rows[1]!);
    expect(
      states()
        .flat()
        .every((state) => state === "paused"),
    ).toBe(true);
  });

  it("CSS-only loaders: a hint says how to run a row", () => {
    const container = demo("css", false);
    expect(container.textContent).toContain("Hover a row to run it.");
  });
});
