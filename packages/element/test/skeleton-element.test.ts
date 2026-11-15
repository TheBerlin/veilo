// Tests for src/skeleton-element.ts: <veilo-skeleton> in a real browser.

import { beforeAll, describe, expect, it, vi } from "vitest";
import { defineVeiloElements } from "../src/define.ts";
import type { VeiloSkeletonElement } from "../src/skeleton-element.ts";

beforeAll(() => {
  defineVeiloElements();
});

/** Elements core adds to the document head (the skeleton stylesheet). */
const headStyles = () => document.head.querySelectorAll("style").length;

/**
 * Puts markup in the page and waits for the element's first update.
 *
 * @param html - Markup with one `<veilo-skeleton>`.
 * @returns The element.
 */
async function mount(html: string): Promise<VeiloSkeletonElement> {
  document.body.innerHTML = html;
  const element = document.querySelector("veilo-skeleton")!;
  await element.updateComplete;
  return element;
}

const SLOTS = `
  <h2 data-veilo-slot="title">Title</h2>
  <p data-veilo-slot="line">A line of text</p>
`;

describe("<veilo-skeleton>", () => {
  it("turns the slots inside into placeholders while loading", async () => {
    const element = await mount(`<veilo-skeleton loading effect="wave">${SLOTS}</veilo-skeleton>`);
    expect(element.getAttribute("aria-busy")).toBe("true");
    const slots = element.querySelectorAll<HTMLElement>("[data-veilo-slot]");
    expect(slots).toHaveLength(2);
    for (const slot of slots) expect(slot.getAttribute("aria-hidden")).toBe("true");
    // The wave delay index, in page order.
    expect(slots[1]!.style.getPropertyValue("--i")).toBe("1");
  });

  it("adds no shadow root and no nodes of its own", async () => {
    const element = await mount(`<veilo-skeleton>${SLOTS}</veilo-skeleton>`);
    expect(element.shadowRoot).toBeNull();
    expect(element.innerHTML).toBe(SLOTS);
  });

  it("restores the elements exactly when loading ends", async () => {
    const element = await mount(`<veilo-skeleton>${SLOTS}</veilo-skeleton>`);
    const html = element.outerHTML;
    element.loading = true;
    await element.updateComplete;
    expect(element.outerHTML).not.toBe(html);
    element.removeAttribute("loading");
    await element.updateComplete;
    expect(element.outerHTML).toBe(html);
  });

  it("restores the page when removed, and starts again when put back", async () => {
    const before = headStyles();
    const element = await mount(`<veilo-skeleton loading>${SLOTS}</veilo-skeleton>`);
    const title = element.querySelector("h2")!;
    expect(headStyles()).toBe(before + 1);
    element.remove();
    expect(title.hasAttribute("aria-hidden")).toBe(false);
    expect(element.hasAttribute("aria-busy")).toBe(false);
    expect(headStyles()).toBe(before);
    document.body.append(element);
    await element.updateComplete;
    expect(title.getAttribute("aria-hidden")).toBe("true");
  });

  it("follows effect, preset and settings changes, with effect winning", async () => {
    const element = await mount(
      `<veilo-skeleton loading preset="soft-pulse" settings='{"lDur":2}'>${SLOTS}</veilo-skeleton>`,
    );
    const title = element.querySelector("h2")!;
    // Keyframe names are unique per start, so the effect shows in the paint: the shimmer's sweep
    // is a gradient, the pulse a plain fill.
    const gradient = () => getComputedStyle(title).backgroundImage.includes("gradient");
    // The preset's pulse, at the settings' duration.
    expect(gradient()).toBe(false);
    expect(getComputedStyle(title).animationDuration).toBe("2s");
    element.setAttribute("effect", "shimmer");
    await element.updateComplete;
    expect(gradient()).toBe(true);
    // A sweep lasts lDur plus its pause, so check the duration follows lDur.
    const seconds = () => parseFloat(getComputedStyle(title).animationDuration);
    const slow = seconds();
    element.settings = { lDur: 1 };
    await element.updateComplete;
    expect(seconds()).toBeCloseTo(slow - 1, 5);
  });

  it("ignores an invalid settings attribute with a warning", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const element = await mount(
      `<veilo-skeleton loading settings="{lDur:2}">${SLOTS}</veilo-skeleton>`,
    );
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("not a JSON object"));
    expect(element.querySelector("h2")!.getAttribute("aria-hidden")).toBe("true");
    warn.mockRestore();
  });
});
