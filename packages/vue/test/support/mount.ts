// mount.ts: helpers shared by the browser tests. An agreed exception to the test mirror, as
// test/support/ is in the other packages.

import { mount, type VueWrapper } from "@vue/test-utils";
import { afterEach } from "vitest";
import type { Component } from "vue";
import { fakeScheduler } from "../../../core/test/support/scheduler.ts";

/** Every wrapper mounted by a test, so each one is unmounted afterwards. */
const mounted: VueWrapper[] = [];

afterEach(() => {
  for (const wrapper of mounted.splice(0)) wrapper.unmount();
});

/**
 * Mounts a component into the document, where core can measure it, and unmounts it after the
 * test.
 *
 * @param component - The component.
 * @param options - Props, slots and attributes for it.
 * @returns The wrapper.
 */
export function mountAttached(
  component: Component,
  options: Parameters<typeof mount>[1] = {},
): VueWrapper {
  const wrapper = mount(component, { ...options, attachTo: document.body });
  mounted.push(wrapper);
  return wrapper;
}

/**
 * A hand-driven clock for core, with helpers that let core's async `ready` settle first.
 *
 * @returns The clock, the reveal options that use it, and `run` and `runPart` to move time.
 */
export function clock() {
  const time = fakeScheduler();
  // Read once at creation, so the same object is passed on every render.
  const options = { scheduler: time.scheduler, reducedMotion: false };
  /** Lets core's async work settle, then moves the clock by `ms` (a whole reveal by default). */
  const run = async (ms = 6000) => {
    await new Promise((resolve) => setTimeout(resolve, 0));
    time.advance(ms);
  };
  return { time, options, run };
}
