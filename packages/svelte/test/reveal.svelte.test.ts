// Tests for src/Reveal.svelte and the `reveal` action, in Chromium with a hand-driven clock.

import { flushSync } from "svelte";
import { describe, expect, it } from "vitest";
import { reveal } from "../src/actions.js";
import Reveal, { type RevealProps } from "../src/Reveal.svelte";
import { card, clock, mountAttached } from "./support/mount.js";

/**
 * Mounts a Reveal around the card with a hand-driven clock.
 *
 * @param extra - Props beyond the defaults.
 * @returns The props (reactive: change them and flush), the clock helpers and the container.
 */
function setup(extra: Record<string, unknown> = {}) {
  const time = clock();
  let completes = 0;
  const props: RevealProps = $state({
    ready: false,
    options: time.options,
    oncomplete: () => completes++,
    children: card,
    "data-testid": "container",
    ...extra,
  });
  const { target, unmountNow } = mountAttached(Reveal, props);
  flushSync();
  const container = () => target.firstElementChild as HTMLElement;
  return { props, ...time, completes: () => completes, container, unmountNow };
}

describe("Reveal", () => {
  it("shows the skeleton while not ready", () => {
    const { container } = setup();
    expect(container().getAttribute("aria-busy")).toBe("true");
  });

  it("plays the reveal when ready turns true", async () => {
    const { props, run, completes, container } = setup();
    props.ready = true;
    flushSync();
    await run();
    expect(completes()).toBe(1);
    expect(container().hasAttribute("aria-busy")).toBe(false);
  });

  it("shows ready content at once, without a reveal", async () => {
    const { run, completes, container } = setup({ ready: true });
    const html = container().outerHTML;
    await run();
    expect(completes()).toBe(0);
    expect(container().outerHTML).toBe(html);
  });

  it("plays at mount with revealOnMount", async () => {
    const { run, completes } = setup({ ready: true, revealOnMount: true });
    await run();
    expect(completes()).toBe(1);
  });

  it("shows the skeleton again when ready turns false", async () => {
    const { props, run, container } = setup();
    props.ready = true;
    flushSync();
    await run();
    props.ready = false;
    flushSync();
    expect(container().getAttribute("aria-busy")).toBe("true");
  });

  it("does not rebuild for an equal effect, and plays once", async () => {
    const { props, run, completes } = setup();
    props.settings = { rDur: 1 };
    flushSync();
    props.ready = true;
    flushSync();
    props.settings = { rDur: 1 };
    flushSync();
    await run();
    expect(completes()).toBe(1);
  });

  it("stops every frame and timer when unmounted mid-reveal", async () => {
    const { props, run, time, completes, unmountNow } = setup();
    props.ready = true;
    flushSync();
    await run(300);
    // Mid-reveal: frames are scheduled and the text overlays are on the page.
    expect(time.pending()).toBeGreaterThan(0);
    await unmountNow();
    expect(time.pending()).toBe(0);
    // Nothing fires later, so no callback reaches an unmounted component.
    time.advance(6000);
    expect(completes()).toBe(0);
  });

  it("renders the chosen element with the given attributes", () => {
    const { container } = setup({ ready: true, as: "section", class: "card" });
    expect(container().tagName).toBe("SECTION");
    expect(container().className).toBe("card");
    // Effect props never reach the DOM.
    expect(container().hasAttribute("ready")).toBe(false);
    expect(container().hasAttribute("preset")).toBe(false);
  });

  it("applies a preset", async () => {
    const { props, run, completes } = setup({ preset: "hex-from-center" });
    props.ready = true;
    flushSync();
    await run();
    expect(completes()).toBe(1);
  });
});

describe("reveal action", () => {
  it("works on any element, and destroy restores it exactly", async () => {
    const time = clock();
    const node = document.body.appendChild(document.createElement("article"));
    node.innerHTML = '<p data-veilo-slot="line">A line of text</p>';
    const html = node.outerHTML;
    const action = reveal(node, { ready: false, options: time.options }) as {
      destroy(): void;
    };
    expect(node.getAttribute("aria-busy")).toBe("true");
    action.destroy();
    expect(node.outerHTML).toBe(html);
    expect(time.time.pending()).toBe(0);
    node.remove();
  });
});
