// Tests for src/home/gallery-tile.tsx, in Chromium with the real engine and the real photograph.

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent as realUser } from "vitest/browser";
import { GalleryTile, playgroundLinkFor } from "../../src/home/gallery-tile.tsx";
import { GALLERY_PREVIEW } from "../../src/home/gallery-tiles.ts";
import { reduceMotion } from "../support/media.ts";

afterEach(() => {
  vi.restoreAllMocks();
});

const HEX = GALLERY_PREVIEW[0]!;
const WAVE = GALLERY_PREVIEW[1]!;

/** The polling options for waits on the real engine. */
const POLL = { timeout: 8000, interval: 50 };

/**
 * Waits.
 *
 * @param ms - Milliseconds.
 * @returns A promise that resolves after them.
 */
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * The engine's skeleton elements now on the tile.
 *
 * @param tile - The tile's article.
 * @returns How many placeholders show.
 */
const skeletons = (tile: HTMLElement) => tile.querySelectorAll("[data-veilo-skeleton]").length;

/**
 * Canvases on the tile: the photo, and a second one while the grid effect is drawn over it.
 *
 * @param tile - The tile's article.
 * @returns How many there are.
 */
const canvases = (tile: HTMLElement) => tile.querySelectorAll("canvas").length;

describe("GalleryTile", () => {
  it("is an article named for the effect, with its badges and a link that opens it in the playground", () => {
    render(<GalleryTile spec={HEX} />);
    const tile = screen.getByRole("article", { name: "Hex from center" });
    expect(within(tile).getByRole("heading", { level: 3 }).textContent).toBe("Hex from center");
    const badges = within(within(tile).getByRole("list", { name: "Effects" })).getAllByRole(
      "listitem",
    );
    expect(badges.map((badge) => badge.textContent)).toEqual(["Shimmer", "Hex", "Scramble"]);
    const link = within(tile).getByRole("link", { name: "Open in Playground" });
    expect(link.getAttribute("href")).toBe("/playground?preset=hex-from-center");
    expect(playgroundLinkFor("cascade-wave")).toBe("/playground?preset=cascade-wave");
  });

  it("has a frame that is a button naming what it does, with the picture hidden from assistive technology", () => {
    render(<GalleryTile spec={HEX} />);
    const frame = screen.getByRole("button", { name: "Play the Hex from center effect" });
    expect(frame.querySelector("[aria-hidden=true]")).not.toBeNull();
    // Nothing else in the frame is announced: the name above says it all.
    expect(frame.textContent).toBe("Aero desk lamp$48 · In stock");
  });

  it("a grid effect rests on a held frame of its reveal and stays there", async () => {
    render(<GalleryTile spec={HEX} />);
    const tile = screen.getByRole("article");
    // The grid is drawn over the photo: two canvases. It stays so, however long the tile sits.
    await vi.waitFor(() => expect(canvases(tile)).toBe(2), POLL);
    for (let waited = 0; waited < 3500; waited += 500) {
      await wait(500);
      expect(canvases(tile), `at ${waited} ms`).toBe(2);
      expect(skeletons(tile)).toBe(0);
    }
  }, 20000);

  it("a loader effect rests on its still skeleton", async () => {
    render(<GalleryTile spec={WAVE} />);
    const tile = screen.getByRole("article");
    await vi.waitFor(() => expect(skeletons(tile)).toBeGreaterThan(0), POLL);
    // The animation is held at its start: paused, so the bars do not sweep.
    for (const part of tile.querySelectorAll("[data-veilo-skeleton]")) {
      expect(getComputedStyle(part).animationPlayState).toBe("paused");
    }
    for (const part of tile.querySelectorAll<HTMLElement>("[data-veilo-skeleton]")) {
      expect(part.getAnimations().every((animation) => animation.playState !== "running")).toBe(
        true,
      );
    }
  }, 20000);

  it("hovering plays the effect once, and leaving returns it to its resting frame", async () => {
    render(<GalleryTile spec={HEX} />);
    const tile = screen.getByRole("article");
    const frame = screen.getByRole("button", { name: /Play the Hex/ });
    await vi.waitFor(() => expect(canvases(tile)).toBe(2), POLL);
    await realUser.hover(frame);
    // The sequence: the skeleton, then the reveal, then the finished card (one canvas).
    await vi.waitFor(() => expect(skeletons(tile)).toBeGreaterThan(0), POLL);
    await vi.waitFor(() => expect(skeletons(tile)).toBe(0), POLL);
    await vi.waitFor(() => expect(canvases(tile)).toBe(1), POLL);
    await realUser.unhover(frame);
    // Back on the held frame.
    await vi.waitFor(() => expect(canvases(tile)).toBe(2), POLL);
  }, 30000);

  it("keyboard focus plays it, like a hover, and a blur returns it to rest", async () => {
    render(<GalleryTile spec={HEX} />);
    const tile = screen.getByRole("article");
    await vi.waitFor(() => expect(canvases(tile)).toBe(2), POLL);
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: /Play the Hex/ }));
    await vi.waitFor(() => expect(skeletons(tile)).toBeGreaterThan(0), POLL);
    await userEvent.tab();
    await vi.waitFor(() => expect(skeletons(tile)).toBe(0), POLL);
    await vi.waitFor(() => expect(canvases(tile)).toBe(2), POLL);
  }, 30000);

  it("a press plays it, and a second press plays it again", async () => {
    render(<GalleryTile spec={HEX} />);
    const tile = screen.getByRole("article");
    const frame = screen.getByRole("button", { name: /Play the Hex/ });
    await vi.waitFor(() => expect(canvases(tile)).toBe(2), POLL);
    // A tap: no hover, as on a touch screen, so only the click plays it.
    frame.click();
    await vi.waitFor(() => expect(skeletons(tile)).toBeGreaterThan(0), POLL);
    await vi.waitFor(() => expect(canvases(tile)).toBe(1), POLL);
    frame.click();
    await vi.waitFor(() => expect(skeletons(tile)).toBeGreaterThan(0), POLL);
  }, 30000);

  it("for a visitor who asks for less motion the effect plays once and the content appears at once", async () => {
    reduceMotion();
    render(<GalleryTile spec={HEX} />);
    const tile = screen.getByRole("article");
    const frame = screen.getByRole("button", { name: /Play the Hex/ });
    await vi.waitFor(() => expect(canvases(tile)).toBe(2), POLL);
    frame.click();
    await vi.waitFor(() => expect(skeletons(tile)).toBeGreaterThan(0), POLL);
    await vi.waitFor(() => expect(skeletons(tile)).toBe(0), POLL);
    // No frame-by-frame reveal: the grid is not drawn again, the finished card is simply there.
    for (let waited = 0; waited < 1000; waited += 100) {
      expect(canvases(tile)).toBe(1);
      await wait(100);
    }
  }, 30000);
});
