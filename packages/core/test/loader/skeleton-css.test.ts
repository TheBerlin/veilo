// Tests for src/loader/skeleton-css.ts. Runs in Chromium (see BROWSER_TESTS in vitest.config.ts),
// because the main check renders the server stylesheet and the live skeleton side by side.

import { afterEach, describe, expect, it } from "vitest";
import { createSkeleton } from "../../src/controller/skeleton.ts";
import { serverSkeletonCss } from "../../src/loader/skeleton-css.ts";
import { LAYOUT_VERSION, type Layout } from "../../src/schema/layout.ts";
import { defaultSettings } from "../../src/schema/defaults.ts";

const layout: Layout = {
  version: LAYOUT_VERSION,
  settings: { ...defaultSettings(), effect: "pulse", radius: 4 },
  slots: {
    photo: { role: "image" },
    title: { role: "text", width: 58 },
    empty: { role: "text", lines: 2 },
    buy: { role: "button" },
  },
};

/**
 * A card with every kind of slot: a named image, named text with hints, an empty named text, an
 * unnamed paragraph (guessed text), an unnamed button and a named button.
 *
 * @param id - The container's id.
 * @returns The container, in the page.
 */
function card(id: string): HTMLElement {
  const container = document.createElement("article");
  container.id = id;
  container.style.width = "240px";
  container.innerHTML = [
    '<canvas data-veilo-slot="photo" width="40" height="40"></canvas>',
    '<h2 data-veilo-slot="title">MCHOSE L7 Pro</h2>',
    '<p data-veilo-slot="empty"></p>',
    '<p data-veilo-slot="line">Lightweight 8K polling mouse with tri-mode wireless.</p>',
    '<button data-veilo-slot="other">Other</button>',
    '<span data-veilo-slot="buy">Buy now</span>',
  ].join("");
  document.body.append(container);
  return container;
}

afterEach(() => {
  document.body.replaceChildren();
  for (const style of document.head.querySelectorAll("style")) style.remove();
});

describe("serverSkeletonCss", () => {
  it("scopes every rule to the given selector", () => {
    const css = serverSkeletonCss(layout, "#card");
    for (const rule of css
      .split("}")
      .map((part) => part.trim())
      .filter(Boolean)) {
      // Keyframes and the reduced-motion block wrap scoped rules; every selector names #card.
      if (rule.startsWith("@keyframes") || /^\d|^from|^to/.test(rule)) continue;
      expect(rule).toContain("#card");
    }
  });

  it("writes the layout's hints for named text slots", () => {
    const css = serverSkeletonCss(layout, "#card");
    expect(css).toContain('#card [data-veilo-slot="title"] { --veilo-last: 58%; }');
    expect(css).toContain('#card [data-veilo-slot="empty"] { --veilo-lines: 2; }');
  });

  it("quotes slot names safely", () => {
    const css = serverSkeletonCss({ slots: { 'a"b\\c': { role: "text", width: 50 } } }, "#card");
    expect(css).toContain('[data-veilo-slot="a\\"b\\\\c"]');
    // A name can never close the <style> element the CSS is put in.
    const html = serverSkeletonCss({ slots: { "</style><b>": { role: "text" } } }, "#card");
    expect(html).not.toContain("</style>");
    expect(html).toContain('[data-veilo-slot="\\3c /style>\\3c b>"]');
  });

  it("makes the scope itself one solid placeholder with self", () => {
    const css = serverSkeletonCss({ effect: "pulse" }, "#avatar", { self: true });
    expect(css).toContain("#avatar {");
    expect(css).not.toContain("[data-veilo-slot]");
    expect(css).not.toContain("mask:");
  });

  it("names its keyframes after the scope, so two scopes never share an animation", () => {
    const name = (css: string) => /@keyframes ([\w-]+)/.exec(css)?.[1];
    const a = name(serverSkeletonCss({}, "#a"));
    expect(a).toMatch(/^veilo-ssr-[a-z0-9]+$/);
    expect(a).not.toBe(name(serverSkeletonCss({}, "#b")));
    expect(a).toBe(name(serverSkeletonCss({}, "#a")));
  });

  it("looks the same as the live skeleton on every kind of slot", () => {
    const server = card("server");
    const style = document.createElement("style");
    style.textContent = serverSkeletonCss(layout, "#server");
    document.head.append(style);
    const live = card("live");
    createSkeleton(live, layout, { warnings: false }).start();

    const looks = (container: HTMLElement) =>
      [...container.querySelectorAll<HTMLElement>("[data-veilo-slot]")].map((slot) => {
        const computed = getComputedStyle(slot);
        return {
          slot: slot.dataset.veiloSlot,
          color: computed.color,
          background: computed.backgroundColor,
          radius: computed.borderRadius,
          mask: computed.maskImage,
          maskSize: computed.maskSize,
          minHeight: computed.minHeight,
          height: slot.getBoundingClientRect().height,
          objectPosition: computed.objectPosition,
        };
      });
    const seen = looks(server);
    expect(seen).toEqual(looks(live));
    // Not equal by accident: the skeleton really applies on both sides.
    const of = (name: string) => seen.find((look) => look.slot === name);
    expect(of("title")?.color).toBe("rgba(0, 0, 0, 0)");
    expect(of("title")?.mask).not.toBe("none");
    expect(of("line")?.mask).not.toBe("none");
    expect(of("photo")?.mask).toBe("none");
    expect(of("other")?.mask).toBe("none");
    expect(of("buy")?.mask).toBe("none");
    expect(of("photo")?.objectPosition).toContain("-99999px");
    expect(of("empty")?.height).toBeGreaterThan(30);
  });
});
