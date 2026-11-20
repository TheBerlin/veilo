// Tests for src/gallery/gallery-page.tsx and its toolbar, in Chromium with the real engine.

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { GalleryPage } from "../../src/gallery/gallery-page.tsx";

afterEach(async () => {
  await page.viewport(414, 896);
});

/**
 * The names of the tiles on the page.
 *
 * @returns The effect names, in order.
 */
const tileNames = () =>
  screen.queryAllByRole("article").map((tile) => tile.getAttribute("aria-label"));

/**
 * The count line.
 *
 * @returns Its text.
 */
const count = () => screen.getByRole("status").textContent;

/**
 * Whether a chip is chosen.
 *
 * @param name - The chip's text.
 * @returns True when it is pressed.
 */
const pressed = (name: string) =>
  screen.getByRole("button", { name }).getAttribute("aria-pressed") === "true";

describe("GalleryPage", () => {
  it("has the page's one h1 and a caption that says what the page is for", () => {
    render(<GalleryPage />);
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings.map((heading) => heading.textContent)).toEqual(["Gallery."]);
    expect(
      screen.getByText("Every ready-made effect. Open one in the Playground to change it."),
    ).toBeTruthy();
  });

  it("starts with every effect, none filtered, and Clear filters unavailable", () => {
    render(<GalleryPage />);
    expect(tileNames()).toEqual([
      "Dot upscale",
      "Hex from center",
      "Matrix columns",
      "Cascade wave",
      "Soft pulse",
      "Compact shimmer",
      "Mosaic from edge",
    ]);
    expect(count()).toBe("7 effects");
    expect(screen.getByRole("button", { name: "Clear filters" })).toHaveProperty("disabled", true);
  });

  it("has a search box and three labelled rows of chips, none chosen", () => {
    render(<GalleryPage />);
    const search = screen.getByRole("search");
    expect(within(search).getByRole("textbox", { name: "Search effects" })).toBeTruthy();
    for (const [row, chips] of [
      ["Loader", ["Shimmer", "Wave", "Pulse"]],
      ["Image", ["Dots", "Hex", "Binary", "Mosaic", "Blur-up", "Crossfade", "Wipe"]],
      ["Text", ["Scramble", "Typewriter", "Rise", "Fade"]],
    ] as const) {
      const group = within(search).getByRole("group", { name: row });
      expect(
        within(group)
          .getAllByRole("button")
          .map((chip) => chip.textContent),
      ).toEqual([...chips]);
      for (const chip of chips) expect(pressed(chip)).toBe(false);
    }
  });

  it("typing narrows the list as it goes, and says how many of how many", async () => {
    render(<GalleryPage />);
    await userEvent.type(screen.getByRole("textbox", { name: "Search effects" }), "hex");
    expect(tileNames()).toEqual(["Hex from center"]);
    expect(count()).toBe("1 of 7 effects");
    expect(screen.getByRole("button", { name: "Clear filters" })).toHaveProperty("disabled", false);
  });

  it("a chip chooses an option, and any number of chips in a row can be chosen", async () => {
    render(<GalleryPage />);
    await userEvent.click(screen.getByRole("button", { name: "Wave" }));
    expect(pressed("Wave")).toBe(true);
    expect(tileNames()).toEqual(["Cascade wave"]);
    await userEvent.click(screen.getByRole("button", { name: "Pulse" }));
    expect(tileNames()).toEqual(["Cascade wave", "Soft pulse"]);
    expect(count()).toBe("2 of 7 effects");
    // Pressing a chosen chip takes it back.
    await userEvent.click(screen.getByRole("button", { name: "Wave" }));
    expect(pressed("Wave")).toBe(false);
    expect(tileNames()).toEqual(["Soft pulse"]);
  });

  it("chips of different rows narrow together, and with the search", async () => {
    render(<GalleryPage />);
    await userEvent.click(screen.getByRole("button", { name: "Shimmer" }));
    await userEvent.click(screen.getByRole("button", { name: "Scramble" }));
    expect(tileNames()).toEqual(["Dot upscale", "Hex from center", "Matrix columns"]);
    await userEvent.type(screen.getByRole("textbox", { name: "Search effects" }), "binary");
    expect(tileNames()).toEqual(["Matrix columns"]);
  });

  it("says when nothing matches, and the button clears everything", async () => {
    render(<GalleryPage />);
    await userEvent.click(screen.getByRole("button", { name: "Wave" }));
    await userEvent.click(screen.getByRole("button", { name: "Scramble" }));
    expect(tileNames()).toEqual([]);
    expect(screen.getByText("No effects match these filters.")).toBeTruthy();
    expect(count()).toBe("0 of 7 effects");
    // Two buttons clear: the toolbar's and the one under the message.
    const buttons = screen.getAllByRole("button", { name: "Clear filters" });
    expect(buttons).toHaveLength(2);
    await userEvent.click(buttons[1]!);
    expect(tileNames()).toHaveLength(7);
    expect(screen.queryByText("No effects match these filters.")).toBeNull();
    expect(pressed("Wave")).toBe(false);
    expect(pressed("Scramble")).toBe(false);
    expect(count()).toBe("7 effects");
  });

  it("the toolbar's Clear filters empties the search and the chips", async () => {
    render(<GalleryPage />);
    const box = screen.getByRole<HTMLInputElement>("textbox", { name: "Search effects" });
    await userEvent.type(box, "mosaic");
    await userEvent.click(screen.getByRole("button", { name: "Shimmer" }));
    expect(tileNames()).toEqual(["Mosaic from edge"]);
    await userEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(box.value).toBe("");
    expect(pressed("Shimmer")).toBe(false);
    expect(tileNames()).toHaveLength(7);
  });

  it("every tile opens its own preset in the playground", () => {
    render(<GalleryPage />);
    const hrefs = screen
      .getAllByRole("link", { name: "Open in Playground" })
      .map((link) => link.getAttribute("href"));
    expect(hrefs).toEqual([
      "/playground?preset=dot-upscale",
      "/playground?preset=hex-from-center",
      "/playground?preset=matrix-columns",
      "/playground?preset=cascade-wave",
      "/playground?preset=soft-pulse",
      "/playground?preset=compact-shimmer",
      "/playground?preset=mosaic-from-edge",
    ]);
  });

  it("on a wide screen the tiles are three to a row, of equal width", async () => {
    await page.viewport(1440, 900);
    render(<GalleryPage />);
    const boxes = screen.getAllByRole("article").map((tile) => tile.getBoundingClientRect());
    const tops = boxes.map((box) => Math.round(box.top));
    // 7 tiles in 3 rows: 3, 3 and 1.
    expect(new Set(tops).size).toBe(3);
    expect(tops.filter((top) => top === tops[0])).toHaveLength(3);
    expect(new Set(boxes.map((box) => Math.round(box.width))).size).toBe(1);
  });

  it("on a phone the tiles are one to a row, as wide as the page's content", async () => {
    await page.viewport(375, 800);
    render(<GalleryPage />);
    const boxes = screen.getAllByRole("article").map((tile) => tile.getBoundingClientRect());
    expect(new Set(boxes.map((box) => Math.round(box.top))).size).toBe(7);
    for (const box of boxes) expect(box.width).toBeCloseTo(335, 0);
  });
});
