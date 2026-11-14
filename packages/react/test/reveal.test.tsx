import { act, render } from "@testing-library/react";
import { StrictMode, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { fakeScheduler } from "../../core/test/support/scheduler.ts";
import { Reveal, type RevealProps } from "../src/reveal.tsx";

/** The test card's parts, as a user's component would mark them. */
function Card() {
  return (
    <>
      <h2 data-veilo-slot="title">Title</h2>
      <p data-veilo-slot="line">A line of text</p>
    </>
  );
}

/**
 * Renders a Reveal around the card with a hand-driven clock.
 *
 * @param props - Reveal props without `options`.
 * @param wrap - Optional wrapper, such as Strict Mode.
 * @returns The render result, a re-render with new props, and `run` to move time.
 */
function setup(
  props: Omit<RevealProps, "options">,
  wrap: (node: ReactNode) => ReactNode = (node) => node,
) {
  const time = fakeScheduler();
  // Read once at creation, so the same object is passed on every render.
  const options = { scheduler: time.scheduler, reducedMotion: false };
  const tree = (next: Omit<RevealProps, "options">) =>
    wrap(
      <Reveal data-testid="container" {...next} options={options}>
        <Card />
      </Reveal>,
    );
  const result = render(tree(props));
  /** Lets core's async `ready` settle, then moves the clock past a whole reveal. */
  const run = async () => {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
      time.advance(6000);
    });
  };
  /** Lets core's async `ready` settle, then moves the clock part of the way into a reveal. */
  const runPart = async (ms: number) => {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
      time.advance(ms);
    });
  };
  return {
    ...result,
    update: (next: Omit<RevealProps, "options">) => result.rerender(tree(next)),
    run,
    runPart,
    time,
  };
}

/** The container exactly as React rendered it, before core touched anything. */
const PLAIN =
  '<div data-testid="container"><h2 data-veilo-slot="title">Title</h2>' +
  '<p data-veilo-slot="line">A line of text</p></div>';

describe("Reveal", () => {
  it("shows the skeleton while not ready", () => {
    const { getByTestId } = setup({ ready: false });
    expect(getByTestId("container").getAttribute("aria-busy")).toBe("true");
  });

  it("plays the reveal when ready turns true", async () => {
    const onComplete = vi.fn();
    const { getByTestId, update, run } = setup({ ready: false, onComplete });
    update({ ready: true, onComplete });
    await run();
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(getByTestId("container").hasAttribute("aria-busy")).toBe(false);
  });

  it("shows ready content at once, without a reveal", async () => {
    const onComplete = vi.fn();
    const { getByTestId, run } = setup({ ready: true, onComplete });
    const html = getByTestId("container").outerHTML;
    await run();
    expect(onComplete).not.toHaveBeenCalled();
    expect(getByTestId("container").outerHTML).toBe(html);
  });

  it("plays at mount with revealOnMount", async () => {
    const onComplete = vi.fn();
    const { run } = setup({ ready: true, revealOnMount: true, onComplete });
    await run();
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("shows the skeleton again when ready turns false", async () => {
    const { getByTestId, update, run } = setup({ ready: false });
    update({ ready: true });
    await run();
    update({ ready: false });
    expect(getByTestId("container").getAttribute("aria-busy")).toBe("true");
  });

  it("plays once under Strict Mode", async () => {
    const onComplete = vi.fn();
    const strict = (node: ReactNode) => <StrictMode>{node}</StrictMode>;
    const { update, run } = setup({ ready: false, onComplete }, strict);
    update({ ready: true, onComplete });
    await run();
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("stops every frame and timer when unmounted mid-reveal", async () => {
    const onComplete = vi.fn();
    const { getByTestId, update, runPart, time, unmount } = setup({ ready: false, onComplete });
    const container = getByTestId("container");
    update({ ready: true, onComplete });
    await runPart(300);
    // Mid-reveal: frames are scheduled and the text overlays are on the page.
    expect(time.pending()).toBeGreaterThan(0);
    unmount();
    expect(time.pending()).toBe(0);
    expect(container.outerHTML).toBe(PLAIN);
    // Nothing fires later, so no callback reaches an unmounted component.
    time.advance(6000);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("restores the page when Strict Mode unmounts mid-reveal", async () => {
    const strict = (node: ReactNode) => <StrictMode>{node}</StrictMode>;
    const { getByTestId, update, runPart, time, unmount } = setup({ ready: false }, strict);
    const container = getByTestId("container");
    update({ ready: true });
    await runPart(300);
    unmount();
    expect(time.pending()).toBe(0);
    expect(container.outerHTML).toBe(PLAIN);
  });

  it("renders the chosen element with the given attributes", () => {
    const { getByTestId } = setup({ ready: true, as: "section", className: "card" });
    const container = getByTestId("container");
    expect(container.tagName).toBe("SECTION");
    expect(container.className).toBe("card");
    // Effect props never reach the DOM.
    expect(container.hasAttribute("ready")).toBe(false);
    expect(container.hasAttribute("preset")).toBe(false);
  });
});
