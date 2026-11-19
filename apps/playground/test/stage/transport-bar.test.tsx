// Tests for src/stage/transport-bar.tsx, through the stage, in Chromium with a hand-driven clock.

import { defaultSettings } from "@veilo-ui/core";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
// Core's hand-driven scheduler, shared so both packages drive time the same way.
import { fakeScheduler } from "../../../../packages/core/test/support/scheduler.ts";
import { Stage } from "../../src/stage/stage.tsx";
import { stateLabel, timeReadout } from "../../src/stage/transport-bar.tsx";
import { createSettingsStore } from "../../src/state/settings-store.ts";

const settings = defaultSettings();

/**
 * Renders the stage with a fake clock.
 *
 * @returns Getters for the card and status, and the clock.
 */
function renderStage() {
  const clock = fakeScheduler();
  render(<Stage store={createSettingsStore()} revealOptions={{ scheduler: clock.scheduler }} />);
  const card = () => screen.getByRole("button", { name: /Test card/ });
  const status = () => screen.getByRole("status").textContent;
  return { card, status, clock };
}

/**
 * Moves the fake clock in 100 ms steps, with real waits for `ready`, until a condition holds or
 * 4 s of real time have passed.
 *
 * @param clock - The fake clock.
 * @param done - The condition.
 */
async function runUntil(clock: ReturnType<typeof fakeScheduler>, done: () => boolean) {
  // Bounded by real time, not clock time: `ready` is real async and may finish late on a slow
  // runner, and the reveal then still needs rDur of clock time after it.
  const deadline = performance.now() + 4_000; // under Vitest's 5 s test timeout
  while (!done() && performance.now() < deadline) await run(clock, 100);
  expect(done()).toBe(true);
}

/**
 * Moves the fake clock in small steps with real waits, so `ready` (real async) can settle.
 *
 * @param clock - The fake clock.
 * @param ms - Total time to advance.
 */
async function run(clock: ReturnType<typeof fakeScheduler>, ms: number) {
  for (let elapsed = 0; elapsed < ms; elapsed += 100) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
      clock.advance(100);
    });
  }
}

describe("stateLabel and timeReadout", () => {
  it("follow spec 1.4", () => {
    expect(stateLabel("idle", 0)).toBe("Loading");
    expect(stateLabel("loading", 0)).toBe("Loading");
    expect(stateLabel("revealing", 0.424)).toBe("Revealing 42%");
    expect(stateLabel("revealed", 1)).toBe("Revealed");
    expect(timeReadout(0.8077, 1.04)).toBe("0.84 / 1.04 s");
  });
});

describe("TransportBar", () => {
  it("shows Loading, then Revealed with the full time after the sequence", async () => {
    const { status, clock } = renderStage();
    await waitFor(() => expect(status()).toBe("Loading"));
    await runUntil(clock, () => status() === "Revealed");
    const total = settings.rDur.toFixed(2);
    expect(screen.getByText(`${total} / ${total} s`)).toBeTruthy();
  });

  it("Loading state holds the skeleton; Replay reveal plays without it", async () => {
    const { card, status, clock } = renderStage();
    await runUntil(clock, () => status() === "Revealed");
    await userEvent.click(screen.getByRole("button", { name: "Loading state" }));
    expect(card().getAttribute("aria-busy")).toBe("true");
    expect(status()).toBe("Loading");
    await run(clock, settings.hold * 1000 + 500);
    // Held: no reveal starts on its own.
    expect(status()).toBe("Loading");
    await userEvent.click(screen.getByRole("button", { name: "Replay reveal" }));
    await run(clock, 200);
    expect(status()).toMatch(/^Revealing \d+%$|^Revealed$/);
  });

  it("the scrubber shows the exact frame and stops playback", async () => {
    const { status, clock } = renderStage();
    await run(clock, 300);
    const thumb = screen.getByRole("slider", { name: "Reveal progress" });
    thumb.focus();
    await userEvent.keyboard("{Home}{PageUp}{PageUp}{PageUp}");
    await waitFor(() => expect(status()).toBe("Revealing 3%"));
    expect(thumb.getAttribute("aria-valuetext")).toBe("3%");
    // Paused at that frame: time passing does not move it.
    await run(clock, 2000);
    expect(status()).toBe("Revealing 3%");
  });

  it("Play sequence restarts from Loading, and Loop preview repeats the sequence", async () => {
    const { status, clock } = renderStage();
    await runUntil(clock, () => status() === "Revealed");
    await userEvent.click(screen.getByRole("button", { name: "Preview options" }));
    await userEvent.click(screen.getByRole("switch", { name: "Loop preview" }));
    expect(status()).toBe("Loading");
    await run(clock, (settings.hold + settings.rDur) * 1000 + 600);
    await waitFor(() => expect(status()).toBe("Revealed"));
    // 900 ms after the end the loop starts again.
    await run(clock, 1000);
    expect(status()).toBe("Loading");
    await userEvent.click(screen.getByRole("button", { name: "Play sequence" }));
    expect(status()).toBe("Loading");
  });

  it("previews reduced motion: a still skeleton, then the content at once", async () => {
    const { card, status, clock } = renderStage();
    await userEvent.click(screen.getByRole("button", { name: "Preview options" }));
    const motion = screen.getByRole("switch", { name: "Reduced motion" });
    expect(motion.getAttribute("aria-checked")).toBe("false");
    await userEvent.click(motion);
    // A new card plays the full sequence, starting from Loading.
    await waitFor(() => expect(status()).toBe("Loading"));
    const heading = () => card().querySelector<HTMLElement>('[data-veilo-slot="heading"]')!;
    expect(getComputedStyle(heading()).animationName).toBe("none");
    // Collect every label on the way, so a frame in between would be seen.
    const labels = new Set<string>();
    const observer = new MutationObserver(() => labels.add(status() ?? ""));
    observer.observe(screen.getByRole("status"), {
      childList: true,
      characterData: true,
      subtree: true,
    });
    await runUntil(clock, () => status() === "Revealed");
    observer.disconnect();
    expect([...labels].filter((label) => /Revealing [1-9]/.test(label))).toEqual([]);
  });

  it("animates again when the preview is turned off", async () => {
    const { card, status } = renderStage();
    await userEvent.click(screen.getByRole("button", { name: "Preview options" }));
    const motion = screen.getByRole("switch", { name: "Reduced motion" });
    await userEvent.click(motion);
    await userEvent.click(motion);
    expect(motion.getAttribute("aria-checked")).toBe("false");
    await waitFor(() => expect(status()).toBe("Loading"));
    const heading = card().querySelector<HTMLElement>('[data-veilo-slot="heading"]')!;
    expect(getComputedStyle(heading).animationName).toMatch(/^veilo-skeleton-/);
    // The preview never follows the viewer's own setting: no rule that could stop it.
    // (Only the skeleton's own stylesheet: the design tokens rightly have such a rule.)
    const skeletonCss = [...document.querySelectorAll("style")]
      .map((style) => style.textContent ?? "")
      .filter((text) => text.includes("data-veilo-skeleton"));
    expect(skeletonCss).toHaveLength(1);
    expect(skeletonCss[0]).not.toContain("prefers-reduced-motion");
  });
});

describe("TransportBar options", () => {
  it("keeps Loop preview and Reduced motion in a popover, so the bar is one row", async () => {
    const { clock } = renderStage();
    expect(clock).toBeTruthy();
    expect(screen.queryByRole("switch", { name: "Loop preview" })).toBeNull();
    const bar = screen.getByRole("toolbar", { name: "Playback" });
    const row = bar.getBoundingClientRect().height;
    await userEvent.click(screen.getByRole("button", { name: "Preview options" }));
    const popover = await screen.findByRole("dialog", { name: "Preview options" });
    expect(within(popover).getByRole("switch", { name: "Loop preview" })).toBeTruthy();
    expect(within(popover).getByRole("switch", { name: "Reduced motion" })).toBeTruthy();
    // The popover floats: the bar does not grow.
    expect(bar.getBoundingClientRect().height).toBe(row);
  });
});
