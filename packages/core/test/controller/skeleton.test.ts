// Tests for src/controller/skeleton.ts, the public createSkeleton.
// Runs in Chromium (see BROWSER_TESTS in vitest.config.ts).

import { afterEach, describe, expect, it, vi } from "vitest";
import { createSkeleton } from "../../src/controller/skeleton.ts";

/** Builds markup in a fresh container. */
function markup(html: string) {
  const container = document.createElement("article");
  container.innerHTML = html;
  document.body.append(container);
  return container;
}

const CARD = `<img data-veilo-slot="photo"><h3 data-veilo-slot="title">T</h3><p>not a slot</p>`;

afterEach(() => {
  document.body.replaceChildren();
  for (const style of document.head.querySelectorAll("style")) style.remove();
  vi.restoreAllMocks();
});

describe("createSkeleton", () => {
  it("shows the skeleton on every slot in a container, which is the busy region", () => {
    const container = markup(CARD);
    const before = container.outerHTML;
    const skeleton = createSkeleton(container, { effect: "pulse" });
    skeleton.start();
    const marked = [...container.querySelectorAll("[data-veilo-skeleton]")];
    expect(marked.map((e) => e.tagName)).toEqual(["IMG", "H3"]);
    expect(container.getAttribute("aria-busy")).toBe("true");
    skeleton.stop();
    expect(container.outerHTML).toBe(before);
  });

  it("still takes a list of elements, in that order", () => {
    const container = markup(CARD);
    const [img, title] = [container.querySelector("img")!, container.querySelector("h3")!];
    createSkeleton([title, img], {}).start();
    expect(title.style.getPropertyValue("--i")).toBe("0");
    expect(img.style.getPropertyValue("--i")).toBe("1");
    expect(container.hasAttribute("aria-busy")).toBe(false);
  });

  it("reads the settings out of a layout", () => {
    const container = markup(CARD);
    createSkeleton(container, { settings: { effect: "pulse", lDur: 3 }, slots: {} }).start();
    expect(getComputedStyle(container.querySelector("h3")!).animationDuration).toBe("3s");
  });

  it("keeps a busy region given in the options", () => {
    const container = markup(CARD);
    createSkeleton(container, {}, { busy: document.body }).start();
    expect(document.body.getAttribute("aria-busy")).toBe("true");
    expect(container.hasAttribute("aria-busy")).toBe(false);
  });

  it("warns about mismatches unless warnings are off", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    createSkeleton(markup(CARD), { slots: { price: {} } }, { warnings: false });
    expect(warn).not.toHaveBeenCalled();
    createSkeleton(markup(CARD), { slots: { price: {} } }, { warnings: true });
    expect(warn).toHaveBeenCalled();
  });
});
