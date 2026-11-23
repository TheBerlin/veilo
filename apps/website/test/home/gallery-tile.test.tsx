// Tests for src/home/gallery-tile.tsx, in Chromium with the real engine and the real photograph.

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent as realUser } from "vitest/browser";
import { GalleryTile, playgroundLinkFor, REPLAY_PAUSE_MS } from "../../src/home/gallery-tile.tsx";
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

  it("has a frame that is a button naming what it does, with the picture hidden from assistive technology", async () => {
    render(<GalleryTile spec={HEX} />);
    const frame = screen.getByRole("button", { name: "Play the Hex from center effect" });
    // The card, made once the tile has been seen and the photograph is ready.
    await vi.waitFor(() => expect(frame.querySelector("[aria-hidden=true]")).not.toBeNull(), POLL);
    // Nothing in the frame is announced: take away what is hidden and no text is left. (The engine's
    // own text overlays are hidden too, so this holds while an effect scrambles the lines.)
    const visible = frame.cloneNode(true) as HTMLElement;
    visible.querySelectorAll("[aria-hidden=true]").forEach((hidden) => hidden.remove());
    expect(visible.textContent).toBe("");
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

  it("hovering plays the whole effect, even when the pointer leaves", async () => {
    render(<GalleryTile spec={HEX} />);
    const tile = screen.getByRole("article");
    const frame = screen.getByRole("button", { name: /Play the Hex/ });
    await vi.waitFor(() => expect(canvases(tile)).toBe(2), POLL);
    await realUser.hover(frame);
    await vi.waitFor(() => expect(skeletons(tile)).toBeGreaterThan(0), POLL);
    // Leaving mid-run does not cut it short: it goes on to the finished card (one canvas).
    await realUser.unhover(frame);
    await vi.waitFor(() => expect(skeletons(tile)).toBe(0), POLL);
    await vi.waitFor(() => expect(canvases(tile)).toBe(1), POLL);
    // Park the pointer elsewhere, so the next test's tile does not mount under it.
    await realUser.unhover(frame);
  }, 30000);

  it("ignores hovers until the effect has ended and the pause has passed", async () => {
    render(<GalleryTile spec={HEX} />);
    const tile = screen.getByRole("article");
    const frame = screen.getByRole("button", { name: /Play the Hex/ });
    await vi.waitFor(() => expect(canvases(tile)).toBe(2), POLL);
    await realUser.hover(frame);
    await vi.waitFor(() => expect(skeletons(tile)).toBeGreaterThan(0), POLL);
    await vi.waitFor(() => expect(skeletons(tile)).toBe(0), POLL);
    await vi.waitFor(() => expect(canvases(tile)).toBe(1), POLL);
    const endedAt = performance.now();
    // Hovering again inside the pause does nothing.
    await realUser.unhover(frame);
    await realUser.hover(frame);
    await wait(500);
    expect(skeletons(tile)).toBe(0);
    // After the pause a new hover plays it again.
    await wait(Math.max(0, REPLAY_PAUSE_MS + 200 - (performance.now() - endedAt)));
    await realUser.unhover(frame);
    await realUser.hover(frame);
    await vi.waitFor(() => expect(skeletons(tile)).toBeGreaterThan(0), POLL);
    await realUser.unhover(frame);
  }, 40000);

  it("keyboard focus plays it, like a hover", async () => {
    render(<GalleryTile spec={HEX} />);
    const tile = screen.getByRole("article");
    await vi.waitFor(() => expect(canvases(tile)).toBe(2), POLL);
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: /Play the Hex/ }));
    await vi.waitFor(() => expect(skeletons(tile)).toBeGreaterThan(0), POLL);
    await vi.waitFor(() => expect(skeletons(tile)).toBe(0), POLL);
    await vi.waitFor(() => expect(canvases(tile)).toBe(1), POLL);
  }, 30000);

  it("a press plays it, and a press during the pause does nothing", async () => {
    render(<GalleryTile spec={HEX} />);
    const tile = screen.getByRole("article");
    const frame = screen.getByRole("button", { name: /Play the Hex/ });
    await vi.waitFor(() => expect(canvases(tile)).toBe(2), POLL);
    // A tap: no hover, as on a touch screen, so only the click plays it.
    frame.click();
    await vi.waitFor(() => expect(skeletons(tile)).toBeGreaterThan(0), POLL);
    await vi.waitFor(() => expect(skeletons(tile)).toBe(0), POLL);
    await vi.waitFor(() => expect(canvases(tile)).toBe(1), POLL);
    frame.click();
    await wait(500);
    expect(skeletons(tile)).toBe(0);
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
