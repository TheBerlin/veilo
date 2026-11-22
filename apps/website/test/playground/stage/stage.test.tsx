// Tests for src/stage/stage.tsx: choosing the card's photo (from the Content tab) and its ratio,
// in Chromium with a hand-driven clock.

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TooltipProvider } from "@veilo-ui/ui";
import { describe, expect, it } from "vitest";
// Core's hand-driven scheduler, shared so both packages drive time the same way.
import { fakeScheduler } from "../../../../../packages/core/test/support/scheduler.ts";
import { Panel } from "../../../src/playground/panel/panel.tsx";
import { NOT_AN_IMAGE } from "../../../src/playground/stage/image-source.ts";
import { Stage } from "../../../src/playground/stage/stage.tsx";
import { createContentStore } from "../../../src/playground/state/content-store.ts";
import { createSettingsStore } from "../../../src/playground/state/settings-store.ts";

/**
 * Renders the stage with the panel beside it, as the app does, with a fake clock, and opens the
 * Content tab, where the image controls are.
 *
 * @param content - The content store both share. Defaults to a fresh one.
 * @returns The card and photo getters and the clock.
 */
async function renderStage(content = createContentStore()) {
  const clock = fakeScheduler();
  const store = createSettingsStore();
  render(
    <TooltipProvider>
      <Stage store={store} content={content} revealOptions={{ scheduler: clock.scheduler }} />
      <Panel store={store} content={content} />
    </TooltipProvider>,
  );
  await userEvent.click(screen.getByRole("tab", { name: "Content" }));
  // The music player appears once its cover photograph has loaded.
  await screen.findByRole("button", { name: /Test card/ });
  const card = () => screen.getByRole("button", { name: /Test card/ });
  const photo = () => card().querySelector<HTMLCanvasElement>("canvas")!;
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
  it("starts on the placeholder with no sample chosen", async () => {
    await renderStage();
    expect(screen.getByRole("button", { name: /Sample/ }).getAttribute("aria-pressed")).toBe(
      "false",
    );
    expect(screen.getByRole("alert").textContent).toBe("");
  });

  it("shows a sample on a new card that restarts in the Loading view", async () => {
    const { card, photo, clock } = await renderStage();
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
    const { photo } = await renderStage();
    const placeholder = center(photo());
    const input = document.querySelector<HTMLInputElement>("input[type=file]")!;
    await userEvent.upload(input, await pngFile("rgb(0, 255, 0)"));
    await waitFor(() => expect(center(photo())).toEqual([0, 255, 0, 255]));
    await userEvent.click(screen.getByRole("button", { name: "Reset" }));
    await waitFor(() => expect(center(photo())).toEqual(placeholder));
  });

  it("loads a file dropped on the image area", async () => {
    const { photo } = await renderStage();
    const transfer = new DataTransfer();
    transfer.items.add(await pngFile("rgb(0, 0, 255)"));
    photo().dispatchEvent(new DragEvent("drop", { bubbles: true, dataTransfer: transfer }));
    await waitFor(() => expect(center(photo())).toEqual([0, 0, 255, 255]));
  });

  it("says when a file is not an image and keeps the current photo", async () => {
    const { card } = await renderStage();
    const before = card();
    const input = document.querySelector<HTMLInputElement>("input[type=file]")!;
    // applyAccept off: the picker's filter is only a hint, a dropped or forced file can be anything.
    await userEvent.setup({ applyAccept: false }).upload(input, new File(["x"], "a.txt"));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toBe(NOT_AN_IMAGE));
    expect(card()).toBe(before);
  });
});
