// mount.ts: helpers shared by the browser tests. An agreed exception to the test mirror, as
// test/support/ is in the other packages.

import { createRawSnippet, mount, unmount, type Component } from "svelte";
import { afterEach } from "vitest";
import { fakeScheduler } from "../../../core/test/support/scheduler.ts";

/** Every mounted component, so each one is unmounted after its test. */
const mounted: Array<() => Promise<void>> = [];

afterEach(async () => {
  for (const stop of mounted.splice(0)) await stop();
});

/** The test card's parts, as a user's component would mark them, in one wrapper element. */
export const card = createRawSnippet(() => ({
  render: () =>
    '<div class="inner"><h2 data-veilo-slot="title">Title</h2>' +
    '<p data-veilo-slot="line">A line of text</p></div>',
}));

/**
 * Mounts a component into the document, where core can measure it, and unmounts it after the
 * test.
 *
 * @param component - The component.
 * @param props - Its props (a `$state` object, so a test can change them later).
 * @returns The element that holds the component, and `unmountNow` to unmount it early (safe to
 *   call twice).
 */
// `any` values, as Svelte's own `mount` allows: a props interface has no index signature.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mountAttached<P extends Record<string, any>>(component: Component<P>, props: P) {
  const target = document.body.appendChild(document.createElement("div"));
  const app = mount(component, { target, props }) as Record<string, unknown>;
  let done = false;
  const unmountNow = async () => {
    if (done) return;
    done = true;
    await unmount(app);
    target.remove();
  };
  mounted.push(unmountNow);
  return { target, unmountNow };
}

/**
 * A hand-driven clock for core, with a helper that lets core's async work settle first.
 *
 * @returns The clock, the reveal options that use it, and `run` to move time.
 */
export function clock() {
  const time = fakeScheduler();
  // Read once at creation, so the same object is passed on every update.
  const options = { scheduler: time.scheduler, reducedMotion: false };
  /** Lets core's async work settle, then moves the clock by `ms` (a whole reveal by default). */
  const run = async (ms = 6000) => {
    await new Promise((resolve) => setTimeout(resolve, 0));
    time.advance(ms);
  };
  return { time, options, run };
}
