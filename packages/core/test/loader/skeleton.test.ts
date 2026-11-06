// Tests for src/loader/skeleton.ts. Runs in Chromium (see BROWSER_TESTS in vitest.config.ts).

import { afterEach, describe, expect, it } from "vitest";
import { createElementSkeleton } from "../../src/loader/skeleton.ts";

/** Builds a small card: a region with an image and two text lines. */
function card() {
  const region = document.createElement("article");
  const image = document.createElement("canvas");
  image.width = 40;
  image.height = 40;
  const heading = document.createElement("h3");
  heading.textContent = "MCHOSE L7 Pro";
  heading.style.color = "rgb(1, 2, 3)";
  const price = document.createElement("p");
  price.textContent = "$59.99";
  region.append(image, heading, price);
  document.body.append(region);
  return { region, elements: [image, heading, price] as HTMLElement[] };
}

/** The id the skeleton gave an element. */
const idOf = (element: Element) => element.getAttribute("data-veilo-skeleton");

afterEach(() => {
  document.body.replaceChildren();
  for (const style of document.head.querySelectorAll("style")) {
    if (style.textContent?.includes("data-veilo-skeleton")) style.remove();
  }
});

describe("createElementSkeleton", () => {
  it("does nothing until started", () => {
    const { region, elements } = card();
    const before = region.outerHTML;
    const skeleton = createElementSkeleton(elements, {});
    expect(skeleton.active).toBe(false);
    expect(region.outerHTML).toBe(before);
  });

  it("marks every element with one id, its index, and aria-hidden", () => {
    const { elements } = card();
    createElementSkeleton(elements, {}).start();
    const id = idOf(elements[0]!);
    expect(id).toMatch(/^[a-z0-9]+$/);
    elements.forEach((element, index) => {
      expect(idOf(element)).toBe(id);
      expect(element.getAttribute("aria-hidden")).toBe("true");
      expect(element.style.getPropertyValue("--i")).toBe(String(index));
    });
  });

  it("runs the generated animation with its own keyframes", () => {
    const { elements } = card();
    createElementSkeleton(elements, { effect: "shimmer", lDur: 1, lGap: 0.5 }).start();
    const style = getComputedStyle(elements[1]!);
    expect(style.animationName).toBe(`veilo-skeleton-${idOf(elements[1]!)}`);
    expect(style.animationDuration).toBe("1.5s");
    expect(style.color).toBe("rgba(0, 0, 0, 0)");
    expect(style.backgroundImage).toContain("linear-gradient");
  });

  it("falls back to the light theme colors when the page defines none", () => {
    const { elements } = card();
    createElementSkeleton(elements, { effect: "pulse" }).start();
    expect(getComputedStyle(elements[1]!).backgroundColor).toBe("rgb(220, 220, 220)");
  });

  it("follows --veilo-base when the page defines it", () => {
    const { region, elements } = card();
    region.style.setProperty("--veilo-base", "rgb(9, 8, 7)");
    createElementSkeleton(elements, { effect: "pulse" }).start();
    expect(getComputedStyle(elements[1]!).backgroundColor).toBe("rgb(9, 8, 7)");
  });

  it("hides the picture of images, canvases and videos", () => {
    const { elements } = card();
    createElementSkeleton(elements, {}).start();
    expect(getComputedStyle(elements[0]!).objectPosition).toBe("-99999px 0px");
    expect(getComputedStyle(elements[1]!).objectPosition).toBe("50% 50%");
  });

  it("stops the animation under reduced motion", () => {
    const { elements } = card();
    createElementSkeleton(elements, {}).start();
    const sheet = [...document.styleSheets].at(-1)!;
    const media = [...sheet.cssRules].find((rule) => rule instanceof CSSMediaRule) as CSSMediaRule;
    expect(media.conditionText).toBe("(prefers-reduced-motion: reduce)");
    expect(media.cssRules[0]!.cssText).toBe(
      `[data-veilo-skeleton="${idOf(elements[0]!)}"] { animation: auto ease 0s 1 normal none running none; }`,
    );
  });

  it("sets aria-busy on the busy region", () => {
    const { region, elements } = card();
    const skeleton = createElementSkeleton(elements, {}, { busy: region });
    skeleton.start();
    expect(region.getAttribute("aria-busy")).toBe("true");
    skeleton.stop();
    expect(region.hasAttribute("aria-busy")).toBe(false);
  });

  it("restores the page exactly on stop", () => {
    const { region, elements } = card();
    elements[1]!.setAttribute("aria-hidden", "false");
    const before = region.outerHTML;
    const styles = document.head.children.length;
    const skeleton = createElementSkeleton(elements, {}, { busy: region });
    skeleton.start();
    skeleton.stop();
    expect(region.outerHTML).toBe(before);
    expect(document.head.children).toHaveLength(styles);
    expect(skeleton.active).toBe(false);
  });

  it("restarts the animation on a second start, with new keyframes", () => {
    const { elements } = card();
    const skeleton = createElementSkeleton(elements, {});
    skeleton.start();
    const first = idOf(elements[0]!);
    const styles = document.head.children.length;
    skeleton.start();
    expect(idOf(elements[0]!)).not.toBe(first);
    expect(document.head.children).toHaveLength(styles);
  });

  it("keeps two skeletons with different settings apart", () => {
    const one = card();
    const two = card();
    createElementSkeleton(one.elements, { effect: "shimmer", lDur: 1, lGap: 0 }).start();
    createElementSkeleton(two.elements, { effect: "pulse", lDur: 3 }).start();
    const a = getComputedStyle(one.elements[1]!);
    const b = getComputedStyle(two.elements[1]!);
    expect(a.animationName).not.toBe(b.animationName);
    expect([a.animationDuration, b.animationDuration]).toEqual(["1s", "3s"]);
  });

  it("validates and clamps the settings", () => {
    const { elements } = card();
    createElementSkeleton(elements, { effect: "pulse", lDur: 99, radius: "big" }).start();
    const style = getComputedStyle(elements[1]!);
    expect(style.animationDuration).toBe("4s");
    expect(style.borderTopLeftRadius).toBe("6px");
  });

  it("does nothing after destroy", () => {
    const { region, elements } = card();
    const before = region.outerHTML;
    const skeleton = createElementSkeleton(elements, {});
    skeleton.start();
    skeleton.destroy();
    skeleton.start();
    expect(region.outerHTML).toBe(before);
    expect(skeleton.active).toBe(false);
  });

  it("adds its stylesheet to a shadow root when given one", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = host.attachShadow({ mode: "open" });
    const line = document.createElement("p");
    line.textContent = "x";
    root.append(line);
    createElementSkeleton([line], { effect: "pulse" }, { root }).start();
    expect(root.querySelector("style")).not.toBeNull();
    expect(getComputedStyle(line).backgroundColor).toBe("rgb(220, 220, 220)");
  });
});

describe("createElementSkeleton line bars", () => {
  /** A paragraph with a fixed font, so one line is exactly 20 px. */
  function line(text: string) {
    const element = document.createElement("p");
    element.textContent = text;
    element.style.cssText = "font: 16px/20px monospace; width: 200px; margin: 0";
    document.body.append(element);
    return element;
  }

  it("masks a text element into bars, which the browser accepts", () => {
    const text = line("Lightweight 8K polling mouse with tri-mode wireless");
    createElementSkeleton([text], {}, { bars: new Map([[text, { width: 70 }]]) }).start();
    const style = getComputedStyle(text);
    expect(text.hasAttribute("data-veilo-bars")).toBe(true);
    expect(text.style.getPropertyValue("--veilo-last")).toBe("70%");
    expect(style.maskImage).toContain("repeating-linear-gradient");
    expect(style.maskImage.match(/linear-gradient/g)).toHaveLength(3);
    expect(style.maskComposite).toBe("intersect, add, add");
    expect(style.maskOrigin).toBe("content-box, content-box, content-box");
  });

  it("gives an empty element the hinted number of lines, and only while empty", () => {
    const empty = line("");
    const full = line("x");
    const bars = new Map([
      [empty, { lines: 3 }],
      [full, { lines: 3 }],
    ]);
    createElementSkeleton([empty, full], {}, { bars }).start();
    expect(empty.getBoundingClientRect().height).toBe(60);
    expect(full.getBoundingClientRect().height).toBe(20);
  });

  it("defaults to one line and full width", () => {
    const empty = line("");
    createElementSkeleton([empty], {}, { bars: new Map([[empty, {}]]) }).start();
    expect(empty.getBoundingClientRect().height).toBe(20);
    expect(empty.style.getPropertyValue("--veilo-last")).toBe("");
  });

  it("leaves elements without bars solid", () => {
    const text = line("x");
    createElementSkeleton([text], {}).start();
    expect(text.hasAttribute("data-veilo-bars")).toBe(false);
    expect(getComputedStyle(text).maskImage).toBe("none");
  });

  it("restores the element exactly on stop", () => {
    const text = line("");
    const before = text.outerHTML;
    const skeleton = createElementSkeleton(
      [text],
      {},
      { bars: new Map([[text, { lines: 2, width: 40 }]]) },
    );
    skeleton.start();
    skeleton.stop();
    expect(text.outerHTML).toBe(before);
  });
});
