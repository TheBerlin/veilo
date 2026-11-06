// Tests for src/stage/transport-bar.tsx, through the stage, in Chromium with a hand-driven clock.

import { defaultSettings } from "@veilo/core";
import { act, render, screen, waitFor } from "@testing-library/react";
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
 * Moves the fake clock in 100 ms steps, with real waits for `ready`, until a condition holds.
 *
 * @param clock - The fake clock.
 * @param done - The condition.
 */
async function runUntil(clock: ReturnType<typeof fakeScheduler>, done: () => boolean) {
  for (let step = 0; step < 200 && !done(); step++) await run(clock, 100);
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

  it("Play sequence restarts from Loading, and Loop repeats the sequence", async () => {
    const { status, clock } = renderStage();
    await runUntil(clock, () => status() === "Revealed");
    await userEvent.click(screen.getByRole("switch", { name: "Loop" }));
    expect(status()).toBe("Loading");
    await run(clock, (settings.hold + settings.rDur) * 1000 + 600);
    await waitFor(() => expect(status()).toBe("Revealed"));
    // 900 ms after the end the loop starts again.
    await run(clock, 1000);
    expect(status()).toBe("Loading");
    await userEvent.click(screen.getByRole("button", { name: "Play sequence" }));
    expect(status()).toBe("Loading");
  });
});
