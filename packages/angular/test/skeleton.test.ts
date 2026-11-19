// Tests for src/skeleton.directive.ts and the veilo-skeleton component, in Chromium.

import { Component, signal } from "@angular/core";
import { describe, expect, it } from "vitest";
import { VeiloSkeleton, VeiloSkeletonDirective } from "@veilo-ui/angular";
import { create, settle } from "./support/harness";

/** Elements core adds to the document head (the skeleton stylesheet). */
const headStyles = () => document.head.querySelectorAll("style").length;

/** The component with its card inside. */
@Component({
  imports: [VeiloSkeleton],
  template: `
    <veilo-skeleton
      data-testid="container"
      [loading]="loading()"
      [effect]="effect()"
      [settings]="settings()"
    >
      <h2 data-veilo-slot="title">Title</h2>
      <p data-veilo-slot="line">A line of text</p>
    </veilo-skeleton>
  `,
})
class Host {
  readonly loading = signal(true);
  readonly effect = signal<"wave" | "pulse" | undefined>("wave");
  readonly settings = signal<{ effect: "wave" } | undefined>(undefined);
}

/** The directive on one element, as one solid placeholder. */
@Component({
  imports: [VeiloSkeletonDirective],
  template: `<span class="avatar" veiloSkeleton [loading]="loading()" [self]="true"></span>`,
})
class SelfHost {
  readonly loading = signal(true);
}

describe("veilo-skeleton", () => {
  it("turns the slots inside it into placeholders while loading", async () => {
    const fixture = create(Host);
    await settle(fixture);
    const container = fixture.nativeElement.querySelector("veilo-skeleton") as HTMLElement;
    expect(container.getAttribute("aria-busy")).toBe("true");
    for (const slot of container.querySelectorAll("[data-veilo-slot]")) {
      expect(slot.getAttribute("aria-hidden")).toBe("true");
    }
  });

  it("restores the elements exactly when loading ends and on destroy", async () => {
    const before = headStyles();
    const fixture = create(Host);
    fixture.componentInstance.loading.set(false);
    await settle(fixture);
    const container = fixture.nativeElement.querySelector("veilo-skeleton") as HTMLElement;
    const html = container.outerHTML;
    fixture.componentInstance.loading.set(true);
    await settle(fixture);
    expect(container.outerHTML).not.toBe(html);
    fixture.componentInstance.loading.set(false);
    await settle(fixture);
    expect(container.outerHTML).toBe(html);
    fixture.componentInstance.loading.set(true);
    await settle(fixture);
    fixture.destroy();
    expect(headStyles()).toBe(before);
  });

  it("lets the effect shortcut win over settings", async () => {
    const fixture = create(Host);
    fixture.componentInstance.effect.set("pulse");
    fixture.componentInstance.settings.set({ effect: "wave" });
    await settle(fixture);
    // Pulse fades (opacity); wave and shimmer sweep a gradient (background-position).
    const slot = fixture.nativeElement.querySelector("[data-veilo-slot]") as HTMLElement;
    const name = getComputedStyle(slot).animationName;
    const css = [...document.querySelectorAll("style")]
      .map((tag) => tag.textContent ?? "")
      .find((text) => text.includes(`@keyframes ${name}`));
    expect(css).toContain("opacity: 0.5");
    expect(css).not.toContain("background-position: 0% 0");
  });

  it("is a block element", async () => {
    const fixture = create(Host);
    await settle(fixture);
    const container = fixture.nativeElement.querySelector("veilo-skeleton") as HTMLElement;
    expect(getComputedStyle(container).display).toBe("block");
  });
});

describe("veiloSkeleton directive", () => {
  it("makes the element itself one solid placeholder with self", async () => {
    const fixture = create(SelfHost);
    await settle(fixture);
    const avatar = fixture.nativeElement.querySelector(".avatar") as HTMLElement;
    expect(avatar.getAttribute("aria-hidden")).toBe("true");
    expect(avatar.style.getPropertyValue("--i")).toBe("0");
    fixture.componentInstance.loading.set(false);
    await settle(fixture);
    expect(avatar.getAttribute("aria-hidden")).toBeNull();
  });
});
