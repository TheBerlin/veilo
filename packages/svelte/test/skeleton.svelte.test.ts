// Tests for src/Skeleton.svelte and the `skeleton` action, in Chromium.

import { flushSync } from "svelte";
import { describe, expect, it } from "vitest";
import { skeleton } from "../src/actions.js";
import Skeleton, { type SkeletonProps } from "../src/Skeleton.svelte";
import { card, mountAttached } from "./support/mount.js";

/** Elements core adds to the document head (the skeleton stylesheet). */
const headStyles = () => document.head.querySelectorAll("style").length;

describe("Skeleton", () => {
  it("turns the slots inside a container into placeholders while loading", () => {
    const props: SkeletonProps = $state({
      loading: true,
      effect: "wave",
      children: card,
      "data-testid": "container",
    });
    const { target } = mountAttached(Skeleton, props);
    flushSync();
    const container = target.firstElementChild as HTMLElement;
    expect(container.getAttribute("aria-busy")).toBe("true");
    for (const slot of container.querySelectorAll("[data-veilo-slot]")) {
      expect(slot.getAttribute("aria-hidden")).toBe("true");
    }
  });

  it("restores the elements exactly when loading ends and on unmount", async () => {
    const before = headStyles();
    const props: SkeletonProps = $state({
      loading: false,
      children: card,
      "data-testid": "container",
    });
    const { target, unmountNow } = mountAttached(Skeleton, props);
    flushSync();
    const container = target.firstElementChild as HTMLElement;
    const html = container.outerHTML;
    props.loading = true;
    flushSync();
    expect(container.outerHTML).not.toBe(html);
    props.loading = false;
    flushSync();
    expect(container.outerHTML).toBe(html);
    props.loading = true;
    flushSync();
    await unmountNow();
    expect(headStyles()).toBe(before);
  });

  it("lets the effect shortcut win over settings", () => {
    const { target } = mountAttached(Skeleton, {
      loading: true,
      effect: "pulse",
      settings: { effect: "wave" },
      children: card,
    });
    flushSync();
    // Pulse fades (opacity); wave and shimmer sweep a gradient (background-position).
    const slot = target.querySelector("[data-veilo-slot]") as HTMLElement;
    const name = getComputedStyle(slot).animationName;
    const css = [...document.querySelectorAll("style")]
      .map((tag) => tag.textContent ?? "")
      .find((text) => text.includes(`@keyframes ${name}`));
    expect(css).toContain("opacity: 0.5");
    expect(css).not.toContain("background-position: 0% 0");
  });

  it("renders the chosen element and passes attributes on", () => {
    const { target } = mountAttached(Skeleton, { loading: false, as: "section", class: "card" });
    flushSync();
    const element = target.firstElementChild as HTMLElement;
    expect(element.tagName).toBe("SECTION");
    expect(element.className).toBe("card");
    expect(element.hasAttribute("loading")).toBe(false);
  });
});

describe("skeleton action", () => {
  it("makes the element itself one solid placeholder with self", () => {
    const node = document.body.appendChild(document.createElement("span"));
    node.className = "avatar";
    const action = skeleton(node, { loading: true, self: true }) as { destroy(): void };
    expect(node.getAttribute("aria-hidden")).toBe("true");
    expect(node.style.getPropertyValue("--i")).toBe("0");
    action.destroy();
    expect(node.getAttribute("aria-hidden")).toBeNull();
    node.remove();
  });

  it("starts and stops with update", () => {
    const node = document.body.appendChild(document.createElement("div"));
    node.innerHTML = '<p data-veilo-slot="line">A line of text</p>';
    const html = node.outerHTML;
    const action = skeleton(node, { loading: false }) as {
      update(next: { loading: boolean }): void;
      destroy(): void;
    };
    expect(node.outerHTML).toBe(html);
    action.update({ loading: true });
    expect(node.getAttribute("aria-busy")).toBe("true");
    action.update({ loading: false });
    expect(node.outerHTML).toBe(html);
    action.destroy();
    node.remove();
  });
});
