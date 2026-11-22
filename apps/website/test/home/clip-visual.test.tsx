// Tests for src/home/clip-visual.tsx, in Chromium.

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ClipVisual } from "../../src/home/clip-visual.tsx";
import { reduceMotion } from "../support/media.ts";

afterEach(() => {
  vi.restoreAllMocks();
  document.documentElement.removeAttribute("data-theme");
});

const POLL = { timeout: 6000, interval: 50 };

/**
 * Waits for the video element to appear, which it does once the clip has been seen.
 *
 * @returns The video.
 */
const findVideo = () =>
  vi.waitFor(() => {
    const found = document.querySelector("video");
    expect(found).not.toBeNull();
    return found!;
  }, POLL);

describe("ClipVisual", () => {
  it("shows a still frame until it is in view, then a muted looping video named for what it shows", async () => {
    render(<ClipVisual name="export" description="Choosing a card" />);
    const video = await findVideo();
    expect(video.muted).toBe(true);
    expect(video.loop).toBe(true);
    expect(video.getAttribute("aria-label")).toBe("Choosing a card");
    expect(video.poster).toMatch(/export-/);
  });

  it("follows the page's theme", async () => {
    document.documentElement.setAttribute("data-theme", "light");
    render(<ClipVisual name="export" description="Copying" />);
    const video = await findVideo();
    expect(video.src).toMatch(/export-light/);
    document.documentElement.setAttribute("data-theme", "dark");
    await vi.waitFor(
      () => expect(document.querySelector("video")!.src).toMatch(/export-dark/),
      POLL,
    );
  });

  it("has a Pause button that stops the video and a Play button that starts it again", async () => {
    const user = userEvent.setup();
    render(<ClipVisual name="export" description="Choosing a card" />);
    const video = await findVideo();
    await vi.waitFor(() => expect(video.paused).toBe(false), POLL);
    await user.click(screen.getByRole("button", { name: "Pause the clip" }));
    await vi.waitFor(() => expect(video.paused).toBe(true), POLL);
    await user.click(screen.getByRole("button", { name: "Play the clip" }));
    await vi.waitFor(() => expect(video.paused).toBe(false), POLL);
  });

  it("for a visitor who asks for less motion is one still frame, with no video and nothing to pause", () => {
    reduceMotion();
    render(<ClipVisual name="export" description="Choosing a card" />);
    expect(document.querySelector("video")).toBeNull();
    expect(screen.getByRole("img", { name: "Choosing a card" })).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });
});
