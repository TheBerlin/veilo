// Tests for src/home/gallery-preview.tsx, in Chromium.

import { render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { GalleryPreview } from "../../src/home/gallery-preview.tsx";
import { GALLERY_URL } from "../../src/site/links.ts";

afterEach(async () => {
  await page.viewport(414, 896);
});

/**
 * The links to the gallery that a reader can reach: not hidden by display or visibility.
 *
 * @returns The visible "Browse gallery" links.
 */
function visibleBrowseLinks(): HTMLElement[] {
  return screen
    .queryAllByText("Browse gallery")
    .map((text) => text.closest("a")!)
    .filter((link) => link.getClientRects().length > 0);
}

describe("GalleryPreview", () => {
  it("is a section labelled by its h2, which stands alone with no label above it", () => {
    render(<GalleryPreview />);
    const section = screen.getByRole("region", { name: "Browse the gallery." });
    const heading = within(section).getByRole("heading", { level: 2 });
    expect(heading.textContent).toBe("Browse the gallery.");
    expect(heading.parentElement!.children).toHaveLength(1);
  });

  it("on a wide screen: the heading and the button share a row, then three tiles of equal width", async () => {
    await page.viewport(1440, 900);
    render(<GalleryPreview />);
    const heading = screen.getByRole("heading", { level: 2 }).getBoundingClientRect();
    const links = visibleBrowseLinks();
    // One button, at the right of the heading's row.
    expect(links).toHaveLength(1);
    const button = links[0]!.getBoundingClientRect();
    expect(button.left).toBeGreaterThan(heading.right);
    expect(
      Math.abs(button.top + button.height / 2 - (heading.top + heading.height / 2)),
    ).toBeLessThan(heading.height);
    // Three tiles on one row, each four columns of twelve.
    const tiles = screen.getAllByRole("article").map((tile) => tile.getBoundingClientRect());
    expect(tiles).toHaveLength(3);
    expect(new Set(tiles.map((tile) => Math.round(tile.top))).size).toBe(1);
    expect(new Set(tiles.map((tile) => Math.round(tile.width))).size).toBe(1);
    // The button sits on the right edge of the last tile.
    expect(button.right).toBeCloseTo(tiles[2]!.right, 0);
  });

  it("the button goes to the gallery", () => {
    render(<GalleryPreview />);
    expect(visibleBrowseLinks()[0]!.getAttribute("href")).toBe(GALLERY_URL);
  });

  it("on a phone: one tile, then the button at full width, and no second button", async () => {
    await page.viewport(375, 800);
    render(<GalleryPreview />);
    const shown = screen
      .getAllByRole("article", { hidden: true })
      .filter((tile) => tile.getClientRects().length > 0);
    expect(shown).toHaveLength(1);
    const links = visibleBrowseLinks();
    expect(links).toHaveLength(1);
    const button = links[0]!.getBoundingClientRect();
    const tile = shown[0]!.getBoundingClientRect();
    // Under the tile, and as wide as it.
    expect(button.top).toBeGreaterThanOrEqual(tile.bottom);
    expect(button.width).toBeCloseTo(tile.width, 0);
  });

  it("every tile's link opens its own preset in the playground", () => {
    render(<GalleryPreview />);
    const hrefs = screen
      .getAllByRole("link", { name: "Open in Playground", hidden: true })
      .map((link) => link.getAttribute("href"));
    expect(hrefs).toEqual([
      "/playground?preset=hex-from-center",
      "/playground?preset=cascade-wave",
      "/playground?preset=mosaic-from-edge",
    ]);
  });
});
