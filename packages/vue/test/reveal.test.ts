// Tests for src/reveal.ts, in Chromium with a hand-driven clock.

import { nextTick, h } from "vue";
import { describe, expect, it } from "vitest";
import { Reveal } from "../src/reveal.ts";
import { clock, mountAttached } from "./support/mount.ts";

/** The test card's parts, as a user's component would mark them. */
const card = () => [
  h("h2", { "data-veilo-slot": "title" }, "Title"),
  h("p", { "data-veilo-slot": "line" }, "A line of text"),
];

/** The container as Vue rendered it, before core touched anything. */
const PLAIN =
  '<div data-testid="container"><h2 data-veilo-slot="title">Title</h2>' +
  '<p data-veilo-slot="line">A line of text</p></div>';

/**
 * Mounts a Reveal around the card with a hand-driven clock.
 *
 * @param props - The Reveal's props, without `options`.
 * @returns The wrapper, the clock helpers and the list of `complete` events.
 */
function setup(props: Record<string, unknown>) {
  const time = clock();
  let completes = 0;
  const wrapper = mountAttached(Reveal, {
    props: {
      "data-testid": "container",
      options: time.options,
      onComplete: () => completes++,
      ...props,
    },
    slots: { default: card },
  });
  return { wrapper, ...time, completes: () => completes, el: () => wrapper.element as HTMLElement };
}

describe("Reveal", () => {
  it("shows the skeleton while not ready", async () => {
    const { el } = setup({ ready: false });
    await nextTick();
    expect(el().getAttribute("aria-busy")).toBe("true");
  });

  it("plays the reveal when ready turns true", async () => {
    const { wrapper, run, completes, el } = setup({ ready: false });
    await wrapper.setProps({ ready: true });
    await run();
    expect(completes()).toBe(1);
    expect(el().hasAttribute("aria-busy")).toBe(false);
  });

  it("shows ready content at once, without a reveal", async () => {
    const { run, completes, el } = setup({ ready: true });
    await nextTick();
    const html = el().outerHTML;
    await run();
    expect(completes()).toBe(0);
    expect(el().outerHTML).toBe(html);
  });

  it("plays at mount with revealOnMount", async () => {
    const { run, completes } = setup({ ready: true, revealOnMount: true });
    await run();
    expect(completes()).toBe(1);
  });

  it("shows the skeleton again when ready turns false", async () => {
    const { wrapper, run, el } = setup({ ready: false });
    await wrapper.setProps({ ready: true });
    await run();
    await wrapper.setProps({ ready: false });
    expect(el().getAttribute("aria-busy")).toBe("true");
  });

  it("plays once for one change of ready", async () => {
    const { wrapper, run, completes } = setup({ ready: false });
    await wrapper.setProps({ ready: true });
    await wrapper.setProps({ settings: { rDur: 1 } });
    await run();
    // The settings change made a new reveal, which does not play on its own.
    expect(completes()).toBeLessThanOrEqual(1);
  });

  it("stops every frame and timer when unmounted mid-reveal", async () => {
    const { wrapper, run, time, completes, el } = setup({ ready: false });
    const container = el();
    await wrapper.setProps({ ready: true });
    await run(300);
    // Mid-reveal: frames are scheduled and the text overlays are on the page.
    expect(time.pending()).toBeGreaterThan(0);
    wrapper.unmount();
    expect(time.pending()).toBe(0);
    container.removeAttribute("data-v-app");
    expect(container.outerHTML).toBe(PLAIN);
    // Nothing fires later, so no event reaches an unmounted component.
    time.advance(6000);
    expect(completes()).toBe(0);
  });

  it("renders the chosen element with the given attributes", async () => {
    const { el } = setup({ ready: true, as: "section", class: "card" });
    await nextTick();
    expect(el().tagName).toBe("SECTION");
    expect(el().className).toBe("card");
    // Effect props never reach the DOM.
    expect(el().hasAttribute("ready")).toBe(false);
    expect(el().hasAttribute("preset")).toBe(false);
  });

  it("applies a preset", async () => {
    const { wrapper, run, completes } = setup({ ready: false, preset: "hex-from-center" });
    await wrapper.setProps({ ready: true });
    await run();
    expect(completes()).toBe(1);
  });
});
