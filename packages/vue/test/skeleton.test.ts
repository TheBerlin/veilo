// Tests for src/skeleton.ts, in Chromium.

import { h, nextTick } from "vue";
import { describe, expect, it } from "vitest";
import { Skeleton } from "../src/skeleton.ts";
import { mountAttached } from "./support/mount.ts";

/** Elements core adds to the document head (the skeleton stylesheet). */
const headStyles = () => document.head.querySelectorAll("style").length;

describe("Skeleton", () => {
  it("turns the slots inside a container into placeholders while loading", async () => {
    const wrapper = mountAttached(Skeleton, {
      props: { loading: true, effect: "wave", "data-testid": "container" },
      slots: {
        default: () => [
          h("h2", { "data-veilo-slot": "title" }, "Title"),
          h("p", { "data-veilo-slot": "line" }, "A line of text"),
        ],
      },
    });
    await nextTick();
    const container = wrapper.element as HTMLElement;
    expect(container.getAttribute("aria-busy")).toBe("true");
    for (const slot of container.querySelectorAll("[data-veilo-slot]")) {
      expect(slot.getAttribute("aria-hidden")).toBe("true");
    }
  });

  it("restores the elements exactly when loading ends and on unmount", async () => {
    const before = headStyles();
    const wrapper = mountAttached(Skeleton, {
      props: { loading: false, "data-testid": "container" },
      slots: { default: () => [h("p", { "data-veilo-slot": "line" }, "A line of text")] },
    });
    await nextTick();
    const container = wrapper.element as HTMLElement;
    const html = container.outerHTML;
    await wrapper.setProps({ loading: true });
    expect(container.outerHTML).not.toBe(html);
    await wrapper.setProps({ loading: false });
    expect(container.outerHTML).toBe(html);
    await wrapper.setProps({ loading: true });
    wrapper.unmount();
    container.removeAttribute("data-v-app");
    expect(container.outerHTML).toBe(html);
    expect(headStyles()).toBe(before);
  });

  it("puts the loader on the single child with asChild, adding no element", async () => {
    const wrapper = mountAttached(Skeleton, {
      props: { loading: true, asChild: true },
      slots: { default: () => h("span", { class: "avatar", "data-testid": "avatar" }) },
    });
    await nextTick();
    const avatar = wrapper.element as HTMLElement;
    expect(avatar.dataset.testid).toBe("avatar");
    expect(avatar.className).toBe("avatar");
    expect(avatar.getAttribute("aria-hidden")).toBe("true");
    expect(avatar.style.getPropertyValue("--i")).toBe("0");
  });

  it("keeps the child's own ref with asChild", async () => {
    let own: unknown = null;
    mountAttached(Skeleton, {
      props: { loading: true, asChild: true },
      slots: { default: () => h("span", { ref: (node) => (own = node) }) },
    });
    await nextTick();
    expect(own).toBeInstanceOf(HTMLSpanElement);
  });

  it("lets the effect shortcut win over settings", async () => {
    const wrapper = mountAttached(Skeleton, {
      props: { loading: true, effect: "pulse", settings: { effect: "wave" } },
      slots: { default: () => [h("p", { "data-veilo-slot": "line" }, "Text")] },
    });
    await nextTick();
    // Pulse fades (opacity); wave and shimmer sweep a gradient (background-position).
    const slot = wrapper.element.querySelector("[data-veilo-slot]") as HTMLElement;
    const name = getComputedStyle(slot).animationName;
    const css = [...document.querySelectorAll("style")]
      .map((tag) => tag.textContent ?? "")
      .find((text) => text.includes(`@keyframes ${name}`));
    expect(css).toContain("opacity: 0.5");
    expect(css).not.toContain("background-position: 0% 0");
  });

  it("renders the chosen element and passes attributes on", async () => {
    const wrapper = mountAttached(Skeleton, {
      props: { loading: false, as: "section", class: "card" },
    });
    await nextTick();
    expect(wrapper.element.tagName).toBe("SECTION");
    expect(wrapper.element.className).toBe("card");
    expect(wrapper.element.hasAttribute("loading")).toBe(false);
  });
});
