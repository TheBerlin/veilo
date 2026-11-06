// Tests for src/stage/stage.tsx: choosing the card's photo, in Chromium with a hand-driven clock.

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
// Core's hand-driven scheduler, shared so both packages drive time the same way.
import { fakeScheduler } from "../../../../packages/core/test/support/scheduler.ts";
import { NOT_AN_IMAGE } from "../../src/stage/image-source.ts";
import { Stage } from "../../src/stage/stage.tsx";
import { createSettingsStore } from "../../src/state/settings-store.ts";

/**
 * Renders the stage with a fake clock and lets the first sequence's hold run out.
 *
 * @returns The card's photo getter and the clock.
 */
function renderStage() {
  const clock = fakeScheduler();
  render(<Stage store={createSettingsStore()} revealOptions={{ scheduler: clock.scheduler }} />);
  const card = () => screen.getByRole("button", { name: /Test card/ });
  const photo = () => card().querySelector<HTMLCanvasElement>("[data-veilo-slot=photo]")!;
  return { card, photo, clock };
}

/**
 * Makes a PNG file of a solid color.
 *
 * @param color - Fill color.
 * @returns The file.
 */
async function pngFile(color: string): Promise<File> {
  const canvas = new OffscreenCanvas(8, 8);
  const context = canvas.getContext("2d")!;
  context.fillStyle = color;
  context.fillRect(0, 0, 8, 8);
  return new File([await canvas.convertToBlob({ type: "image/png" })], "dot.png", {
    type: "image/png",
  });
}

/**
 * The color at the photo's center.
 *
 * @param canvas - The photo canvas.
 * @returns RGBA values.
 */
function center(canvas: HTMLCanvasElement): number[] {
  const middle = Math.floor(canvas.width / 2);
  return [...canvas.getContext("2d")!.getImageData(middle, middle, 1, 1).data];
}

describe("Stage image source", () => {
  it("starts on the placeholder with no sample chosen", () => {
    renderStage();
    expect(screen.getByRole("button", { name: /Sample/ }).getAttribute("aria-pressed")).toBe(
      "false",
    );
    expect(screen.getByRole("alert").textContent).toBe("");
  });

  it("shows a sample on a new card that restarts in the Loading view", async () => {
    const { card, photo, clock } = renderStage();
    const first = card();
    clock.advance(10_000);
    await userEvent.click(screen.getByRole("button", { name: /Sample/ }));
    // The new card's reveal starts in a passive effect, which may run after the commit, since
    // the load resolves outside act.
    await waitFor(() => {
      expect(card()).not.toBe(first);
      expect(card().getAttribute("aria-busy")).toBe("true");
    });
    expect(screen.getByRole("button", { name: /Sample/ }).getAttribute("aria-pressed")).toBe(
      "true",
    );
    expect(photo().width).toBeGreaterThanOrEqual(160);
  });

  it("draws a chosen file, and Reset goes back to the placeholder", async () => {
    const { photo } = renderStage();
    const placeholder = center(photo());
    const input = document.querySelector<HTMLInputElement>("input[type=file]")!;
    await userEvent.upload(input, await pngFile("rgb(0, 255, 0)"));
    await waitFor(() => expect(center(photo())).toEqual([0, 255, 0, 255]));
    await userEvent.click(screen.getByRole("button", { name: "Reset" }));
    await waitFor(() => expect(center(photo())).toEqual(placeholder));
  });

  it("loads a file dropped on the image area", async () => {
    const { photo } = renderStage();
    const transfer = new DataTransfer();
    transfer.items.add(await pngFile("rgb(0, 0, 255)"));
    photo().dispatchEvent(new DragEvent("drop", { bubbles: true, dataTransfer: transfer }));
    await waitFor(() => expect(center(photo())).toEqual([0, 0, 255, 255]));
  });

  it("says when a file is not an image and keeps the current photo", async () => {
    const { card } = renderStage();
    const before = card();
    const input = document.querySelector<HTMLInputElement>("input[type=file]")!;
    // applyAccept off: the picker's filter is only a hint, a dropped or forced file can be anything.
    await userEvent.setup({ applyAccept: false }).upload(input, new File(["x"], "a.txt"));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toBe(NOT_AN_IMAGE));
    expect(card()).toBe(before);
  });
});
