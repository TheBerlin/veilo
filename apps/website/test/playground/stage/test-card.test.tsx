// Tests for src/stage/test-card.tsx and the reveal it runs, in Chromium with a hand-driven clock.

import { defaultSettings } from "@veilo-ui/core";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
// Core's hand-driven scheduler, shared so both packages drive time the same way.
import { fakeScheduler } from "../../../../../packages/core/test/support/scheduler.ts";
import { TestCard } from "../../../src/playground/stage/test-card.tsx";

const settings = defaultSettings();

/**
 * Renders the card with a fake clock. The card appears once the album cover has loaded.
 *
 * @returns The card element and the clock.
 */
async function renderCard() {
  const clock = fakeScheduler();
  const view = render(
    <TestCard settings={settings} revealOptions={{ scheduler: clock.scheduler }} />,
  );
  const card = await screen.findByRole("button", { name: /Test card/ });
  return { card, clock, view };
}

/**
 * Runs the clock until the sequence (hold, then the reveal) has finished. The reveal also waits
 * for `ready` (image sampling and the grid renderer, loaded on demand), which takes real async
 * time, so the clock moves in small steps with real waits between them, for at most 4 s of
 * real time.
 *
 * @param card - The card element.
 * @param clock - The fake clock.
 */
async function finishSequence(card: HTMLElement, clock: ReturnType<typeof fakeScheduler>) {
  // Bounded by real time, not clock time: `ready` may finish late on a slow runner, and the
  // reveal then still needs rDur of clock time after it. Extra clock time after the end is
  // harmless.
  const deadline = performance.now() + 4_000; // under Vitest's 5 s test timeout
  while (performance.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 5));
    clock.advance(100);
    if (card.getAttribute("aria-busy") === null && !card.querySelector("canvas + canvas")) {
      return;
    }
  }
  throw new Error("The sequence did not finish within 4 s of real time");
}

describe("TestCard", () => {
  it("is the music player of the home page, with its parts in order", async () => {
    const { card } = await renderCard();
    const slots = [...card.querySelectorAll("[data-veilo-slot]")].map((el) =>
      el.getAttribute("data-veilo-slot"),
    );
    expect(slots).toEqual([
      "cover",
      "track",
      "artist",
      "more",
      "progress",
      "time",
      "repeat",
      "back",
      "play",
      "forward",
      "like",
    ]);
    expect(card.textContent).toBe("Glass HorizonBlue Meridian00:42 / 03:18");
  });

  it("is a focusable button with no button nested inside", async () => {
    const { card } = await renderCard();
    expect(card.tabIndex).toBe(0);
    expect(card.querySelectorAll("button, [role=button]")).toHaveLength(0);
  });

  it("opens in the Loading view with the skeleton and --i per part", async () => {
    const { card } = await renderCard();
    expect(card.getAttribute("aria-busy")).toBe("true");
    const indexes = [...card.querySelectorAll<HTMLElement>("[data-veilo-slot]")]
      .slice(0, 7)
      .map((el) => el.style.getPropertyValue("--i"));
    expect(indexes).toEqual(["0", "1", "2", "3", "4", "5", "6"]);
  });

  it("reveals after the hold and ends with the real content", async () => {
    const { card, clock } = await renderCard();
    await finishSequence(card, clock);
    expect(card.getAttribute("aria-busy")).toBeNull();
    expect(card.querySelectorAll("canvas")).toHaveLength(1);
    // The grid's canvas and every text overlay are gone; the real text is back.
    expect(card.textContent).toBe("Glass HorizonBlue Meridian00:42 / 03:18");
  });

  it.each([
    ["a click", async (card: HTMLElement) => userEvent.click(card)],
    ["Enter", async (card: HTMLElement) => (card.focus(), userEvent.keyboard("{Enter}"))],
    ["Space", async (card: HTMLElement) => (card.focus(), userEvent.keyboard(" "))],
  ])("replays the sequence on %s", async (_name, press) => {
    const { card, clock } = await renderCard();
    await finishSequence(card, clock);
    expect(card.getAttribute("aria-busy")).toBeNull();
    await press(card);
    expect(card.getAttribute("aria-busy")).toBe("true");
  });

  it.each([
    ["music", "the cover is square", 1],
    ["video", "the thumbnail is 16:9", 16 / 9],
  ] as const)("%s: %s, and so is its drawing and the grid", async (layout, _name, ratio) => {
    const clock = fakeScheduler();
    render(
      <TestCard
        layout={layout}
        settings={{ ...settings, imageFx: "dots" }}
        revealOptions={{ scheduler: clock.scheduler }}
        start="frame"
        frame={0.4}
      />,
    );
    const card = await screen.findByRole("button", { name: /Test card/ });
    const photo = card.querySelector("canvas")!;
    const box = photo.getBoundingClientRect();
    expect(box.width / box.height).toBeCloseTo(ratio, 1);
    expect(photo.width / photo.height).toBeCloseTo(ratio, 2);
    // The held frame draws the dot grid on its own canvas over the photo, in the same box.
    await waitFor(() => expect(card.hasAttribute("data-frame-ready")).toBe(true));
    // Within a pixel: core sizes its canvas from the element's whole-pixel size.
    const grid = card.querySelector("canvas + canvas")!.getBoundingClientRect();
    expect(Math.abs(grid.width - box.width)).toBeLessThan(1);
    expect(Math.abs(grid.height - box.height)).toBeLessThan(1);
  });

  it("the inbox has no picture, and the card still plays", async () => {
    const clock = fakeScheduler();
    render(
      <TestCard
        layout="inbox"
        settings={settings}
        revealOptions={{ scheduler: clock.scheduler }}
      />,
    );
    const card = await screen.findByRole("button", { name: /Test card, inbox/ });
    expect(card.querySelectorAll("canvas")).toHaveLength(0);
    await finishSequence(card, clock);
    expect(card.getAttribute("aria-busy")).toBeNull();
  });

  it("leaves no styles, canvases or overlays behind after unmount", async () => {
    const styleCount = document.head.querySelectorAll("style").length;
    const { clock, view } = await renderCard();
    clock.advance(settings.hold * 1000 + 200);
    view.unmount();
    expect(document.head.querySelectorAll("style").length).toBe(styleCount);
    expect(document.querySelectorAll("[data-veilo-skeleton]")).toHaveLength(0);
  });
});
