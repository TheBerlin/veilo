// harness.ts: helpers shared by the tests. An agreed exception to the test mirror, as
// test/support/ is in the other packages.

import { provideZonelessChangeDetection, type Type } from "@angular/core";
import { TestBed, type ComponentFixture } from "@angular/core/testing";
import { fakeScheduler } from "../../../core/test/support/scheduler.ts";

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

/**
 * Creates a host component zoneless and renders it once. Effects of the directives run on later
 * passes, so {@link settle} follows.
 *
 * @param component - The host component.
 * @returns The fixture.
 */
export function create<T>(component: Type<T>): ComponentFixture<T> {
  TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  return TestBed.createComponent(component);
}

/**
 * Runs change detection until the view and the effects have settled: the directives start after
 * the first render, and then react to what that render set.
 *
 * @param fixture - The fixture to settle.
 */
export async function settle(fixture: ComponentFixture<unknown>) {
  for (let pass = 0; pass < 4; pass++) {
    fixture.detectChanges();
    await fixture.whenStable();
  }
}
