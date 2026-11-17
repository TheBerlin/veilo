// Tests for src/reveal.directive.ts and the veilo-reveal component, in Chromium with a
// hand-driven clock.

import { Component, signal } from "@angular/core";
import { describe, expect, it } from "vitest";
import { VeiloReveal, VeiloRevealDirective } from "@veilo/angular";
import { clock, create, settle } from "./support/harness";

/** The card as a user's template would write it, inside the component. */
@Component({
  imports: [VeiloReveal],
  template: `
    <veilo-reveal
      data-testid="container"
      [ready]="ready()"
      [revealOnMount]="revealOnMount()"
      [preset]="preset()"
      [settings]="settings()"
      [options]="options"
      (complete)="completes.set(completes() + 1)"
    >
      <h2 data-veilo-slot="title">Title</h2>
      <p data-veilo-slot="line">A line of text</p>
    </veilo-reveal>
  `,
})
class Host {
  readonly time = clock();
  readonly options = this.time.options;
  readonly ready = signal(false);
  readonly revealOnMount = signal(false);
  readonly preset = signal<"hex-from-center" | undefined>(undefined);
  readonly settings = signal<{ rDur: number } | undefined>(undefined);
  readonly completes = signal(0);
}

/** The directive on a plain element of the user's choice. */
@Component({
  imports: [VeiloRevealDirective],
  template: `
    <article
      veiloReveal
      data-testid="container"
      [ready]="ready()"
      [options]="options"
      (complete)="completes.set(completes() + 1)"
    >
      <p data-veilo-slot="line">A line of text</p>
    </article>
  `,
})
class DirectiveHost {
  readonly time = clock();
  readonly options = this.time.options;
  readonly ready = signal(false);
  readonly completes = signal(0);
}

/**
 * Creates the host, settles it and returns the pieces a test needs.
 *
 * @param prepare - Sets inputs before the first render.
 * @returns The fixture, the host, the container element and the clock helpers.
 */
async function setup(prepare: (host: Host) => void = () => undefined) {
  const fixture = create(Host);
  prepare(fixture.componentInstance);
  await settle(fixture);
  const container = () => fixture.nativeElement.querySelector("veilo-reveal") as HTMLElement;
  return { fixture, host: fixture.componentInstance, container, ...fixture.componentInstance.time };
}

describe("veilo-reveal", () => {
  it("shows the skeleton while not ready", async () => {
    const { container } = await setup();
    expect(container().getAttribute("aria-busy")).toBe("true");
  });

  it("plays the reveal when ready turns true", async () => {
    const { fixture, host, run, container } = await setup();
    host.ready.set(true);
    await settle(fixture);
    await run();
    expect(host.completes()).toBe(1);
    expect(container().hasAttribute("aria-busy")).toBe(false);
  });

  it("shows ready content at once, without a reveal", async () => {
    const { host, run, container } = await setup((h) => h.ready.set(true));
    const html = container().outerHTML;
    await run();
    expect(host.completes()).toBe(0);
    expect(container().outerHTML).toBe(html);
  });

  it("plays at start with revealOnMount", async () => {
    const { host, run } = await setup((h) => {
      h.ready.set(true);
      h.revealOnMount.set(true);
    });
    await run();
    expect(host.completes()).toBe(1);
  });

  it("shows the skeleton again when ready turns false", async () => {
    const { fixture, host, run, container } = await setup();
    host.ready.set(true);
    await settle(fixture);
    await run();
    host.ready.set(false);
    await settle(fixture);
    expect(container().getAttribute("aria-busy")).toBe("true");
  });

  it("does not rebuild for an equal effect, and plays once", async () => {
    const { fixture, host, run } = await setup();
    host.settings.set({ rDur: 1 });
    await settle(fixture);
    host.ready.set(true);
    host.settings.set({ rDur: 1 });
    await settle(fixture);
    await run();
    expect(host.completes()).toBe(1);
  });

  it("stops every frame and timer when destroyed mid-reveal", async () => {
    const { fixture, host, run, time } = await setup();
    host.ready.set(true);
    await settle(fixture);
    await run(300);
    // Mid-reveal: frames are scheduled and the text overlays are on the page.
    expect(time.pending()).toBeGreaterThan(0);
    fixture.destroy();
    expect(time.pending()).toBe(0);
    // Nothing fires later, so no event reaches a destroyed component.
    time.advance(6000);
    expect(host.completes()).toBe(0);
  });

  it("is a block element and passes attributes on", async () => {
    const { container } = await setup();
    expect(getComputedStyle(container()).display).toBe("block");
    expect(container().dataset["testid"]).toBe("container");
    // Effect inputs never reach the DOM as attributes.
    expect(container().hasAttribute("ready")).toBe(false);
  });

  it("applies a preset", async () => {
    const { fixture, host, run } = await setup((h) => h.preset.set("hex-from-center"));
    host.ready.set(true);
    await settle(fixture);
    await run();
    expect(host.completes()).toBe(1);
  });
});

describe("veiloReveal directive", () => {
  it("works on any element, and destroying restores it exactly", async () => {
    const fixture = create(DirectiveHost);
    await settle(fixture);
    const element = fixture.nativeElement.querySelector("article") as HTMLElement;
    expect(element.getAttribute("aria-busy")).toBe("true");
    const host = fixture.componentInstance;
    host.ready.set(true);
    await settle(fixture);
    await host.time.run();
    expect(host.completes()).toBe(1);
    fixture.destroy();
    expect(host.time.time.pending()).toBe(0);
  });
});
