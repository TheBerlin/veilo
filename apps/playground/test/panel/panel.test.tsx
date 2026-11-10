// Tests for src/panel/panel.tsx with its groups and color fields, and how the stage restarts
// after a change (spec 1.4), in Chromium with a hand-driven clock.

import { defaultSettings } from "@veilo/core";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
// Core's hand-driven scheduler, shared so both packages drive time the same way.
import { fakeScheduler } from "../../../../packages/core/test/support/scheduler.ts";
import { TooltipProvider } from "@veilo/ui";
import { Panel } from "../../src/panel/panel.tsx";
import { Stage, startAfterChange } from "../../src/stage/stage.tsx";
import { createSettingsStore } from "../../src/state/settings-store.ts";

const settings = defaultSettings();

/**
 * Renders the stage and panel on one store with a fake clock.
 *
 * @returns The store, clock, and getters for the status and card.
 */
function renderApp() {
  const store = createSettingsStore();
  const clock = fakeScheduler();
  render(
    <>
      <Stage store={store} revealOptions={{ scheduler: clock.scheduler }} />
      <TooltipProvider>
        <Panel store={store} />
      </TooltipProvider>
    </>,
  );
  // Earlier tests scroll down to the panel; the reveal pauses while the card is off screen.
  window.scrollTo(0, 0);
  const status = () => screen.getByRole("status").textContent;
  const card = () => screen.getByRole("button", { name: /Test card/ });
  return { store, clock, status, card };
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

describe("startAfterChange", () => {
  it("maps changed keys to the restart of spec 1.4", () => {
    expect(startAfterChange(["effect"])).toBe("loading");
    expect(startAfterChange(["highlightColor"])).toBe("loading");
    expect(startAfterChange(["cols"])).toBe("reveal");
    expect(startAfterChange(["lDur", "rDur"])).toBe("sequence");
  });
});

describe("Panel", () => {
  it("writes chips and selects to the store, and hides controls that do not apply", async () => {
    const { store } = renderApp();
    expect(screen.queryByText("Pulse depth")).toBeNull();
    await userEvent.click(screen.getByRole("radio", { name: "Pulse" }));
    expect(store.getState().settings.effect).toBe("pulse");
    expect(screen.getByText("Pulse depth")).toBeTruthy();
    expect(screen.queryByText("Sweep angle")).toBeNull();

    await userEvent.click(screen.getByRole("tab", { name: "Reveal" }));
    await userEvent.selectOptions(screen.getByLabelText("Image reveal"), "crossfade");
    expect(store.getState().settings.imageFx).toBe("crossfade");
    expect(screen.queryByText("Grid columns")).toBeNull();
  });

  it("moves a slider by its step within the schema's range", async () => {
    const { store } = renderApp();
    screen.getByRole("slider", { name: "Duration" }).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(store.getState().settings.lDur).toBeCloseTo(settings.lDur + 0.05);
    await userEvent.keyboard("{End}");
    expect(store.getState().settings.lDur).toBe(4);
  });

  it("shows the curve only for Custom curve, starting from the curve chosen before", async () => {
    const { store } = renderApp();
    expect(screen.queryByRole("group", { name: "Curve" })).toBeNull();
    await userEvent.selectOptions(screen.getByLabelText("Easing"), "in");
    await userEvent.selectOptions(screen.getByLabelText("Easing"), "custom");
    // Ease in is (0.5, 0, 0.75, 0).
    expect(
      screen.getByRole("slider", { name: "Start handle" }).getAttribute("aria-valuetext"),
    ).toBe("x 0.50, y 0.00");
    expect(screen.getByRole("slider", { name: "End handle" }).getAttribute("aria-valuetext")).toBe(
      "x 0.75, y 0.00",
    );

    screen.getByRole("slider", { name: "Start handle" }).focus();
    await userEvent.keyboard("{ArrowUp}");
    const { lEase, lx1, ly1, lx2, ly2 } = store.getState().settings;
    expect({ lEase, lx1, ly1, lx2, ly2 }).toEqual({
      lEase: "custom",
      lx1: 0.5,
      ly1: 0.01,
      lx2: 0.75,
      ly2: 0,
    });

    await userEvent.selectOptions(screen.getByLabelText("Easing"), "out");
    expect(screen.queryByRole("group", { name: "Curve" })).toBeNull();
    // Leaving Custom curve keeps the points; only the easing name changes.
    expect(store.getState().settings.lx1).toBe(0.5);
  });

  it("overrides a color and resets both", async () => {
    const { store } = renderApp();
    const reset = screen.getByRole<HTMLButtonElement>("button", { name: "Reset colors" });
    expect(reset.disabled).toBe(true);
    act(() => store.getState().set("baseColor", "#123456"));
    expect(reset.disabled).toBe(false);
    await userEvent.click(reset);
    expect(store.getState().settings.baseColor).toBeUndefined();
  });
});

describe("restart after a change", () => {
  it("a Loader change shows Loading and holds it", async () => {
    const { store, clock, status } = renderApp();
    await runUntil(clock, () => status() === "Revealed");
    act(() => store.getState().set("effect", "wave"));
    await waitFor(() => expect(status()).toBe("Loading"));
    await run(clock, settings.hold * 1000 + 500);
    expect(status()).toBe("Loading");
  });

  it("a Reveal change replays the reveal without loading", async () => {
    const { store, clock, status, card } = renderApp();
    await runUntil(clock, () => status() === "Revealed");
    const before = card();
    act(() => store.getState().set("cols", 40));
    await waitFor(() => expect(card()).not.toBe(before));
    await run(clock, 300);
    expect(card().getAttribute("aria-busy")).toBeNull();
    expect(status()).toMatch(/^Revealing \d+%$/);
  });

  it("several changes in one frame rebuild the card once", async () => {
    const { store, card } = renderApp();
    const first = card();
    act(() => {
      store.getState().set("cols", 40);
      store.getState().set("spread", 0.3);
    });
    await waitFor(() => expect(card()).not.toBe(first));
    const second = card();
    await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 20)));
    expect(card()).toBe(second);
  });
});
