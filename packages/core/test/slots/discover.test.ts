// Tests for src/slots/discover.ts. Runs in Chromium (see BROWSER_TESTS in vitest.config.ts).

import { afterEach, describe, expect, it } from "vitest";
import { parseLayout } from "../../src/schema/layout.ts";
import { findSlots, SLOT_ATTRIBUTE } from "../../src/slots/discover.ts";

/** Builds markup in a fresh container. */
function markup(html: string) {
  const container = document.createElement("article");
  container.innerHTML = html;
  document.body.append(container);
  return container;
}

/** The found slots as [name, tag, role]. */
const summary = (container: Element, input: unknown) =>
  findSlots(container, parseLayout(input)).slots.map((s) => [
    s.name,
    s.element.tagName.toLowerCase(),
    s.role,
  ]);

const CARD = `
  <img data-veilo-slot="photo">
  <h3 data-veilo-slot="title">MCHOSE L7 Pro</h3>
  <p data-veilo-slot="price">$59.99</p>
  <button data-veilo-slot="buy"><span data-veilo-slot="buy-label">Buy now</span></button>`;

afterEach(() => {
  document.body.replaceChildren();
});

describe("findSlots", () => {
  it("uses the attribute name", () => {
    expect(SLOT_ATTRIBUTE).toBe("data-veilo-slot");
  });

  it("finds slots in page order and guesses roles with no layout", () => {
    const container = markup(CARD);
    expect(summary(container, {})).toEqual([
      ["photo", "img", "image"],
      ["title", "h3", "text"],
      ["price", "p", "text"],
      ["buy", "button", "button"],
      ["buy-label", "span", "text"],
    ]);
    expect(findSlots(container, parseLayout({})).problems).toEqual([]);
  });

  it("uses the layout's roles and hints", () => {
    const container = markup(CARD);
    const layout = parseLayout({
      slots: {
        photo: { role: "image" },
        title: { role: "block", lines: 2 },
        price: { role: "text", width: 28 },
        buy: { role: "button" },
        "buy-label": { role: "text" },
      },
    });
    const { slots, problems } = findSlots(container, layout);
    expect(slots.map((s) => s.role)).toEqual(["image", "block", "text", "button", "text"]);
    expect(slots[1]!.hint).toEqual({ role: "block", lines: 2 });
    expect(slots[2]!.hint).toEqual({ role: "text", width: 28 });
    expect(problems).toEqual([]);
  });

  it("gives every element of a repeated slot the same role, in page order", () => {
    const container = markup(`<p data-veilo-slot="row">a</p><p data-veilo-slot="row">b</p>`);
    const { slots } = findSlots(
      container,
      parseLayout({ slots: { row: { role: "text", width: 50 } } }),
    );
    expect(slots.map((s) => [s.element.textContent, s.role, s.hint.width])).toEqual([
      ["a", "text", 50],
      ["b", "text", 50],
    ]);
  });

  it("trims the attribute value", () => {
    expect(summary(markup(`<p data-veilo-slot="  title ">x</p>`), {})).toEqual([
      ["title", "p", "text"],
    ]);
  });

  it("does not count the container itself", () => {
    const container = markup(`<p data-veilo-slot="a">x</p>`);
    container.setAttribute(SLOT_ATTRIBUTE, "card");
    expect(summary(container, {}).map(([name]) => name)).toEqual(["a"]);
  });
});

describe("findSlots problems", () => {
  /** The problems for a markup and layout. */
  const problems = (html: string, input: unknown) =>
    findSlots(markup(html), parseLayout(input)).problems;

  it("skips a layout slot missing from the markup", () => {
    expect(
      problems(`<p data-veilo-slot="title">x</p>`, { slots: { title: {}, price: {} } }),
    ).toEqual(['slot "price" is in the layout but not in the markup; it is skipped.']);
  });

  it("guesses the role of an element the layout does not name", () => {
    const html = `<p data-veilo-slot="title">x</p><p data-veilo-slot="extra">y</p>`;
    expect(problems(html, { slots: { title: {} } })).toEqual([
      'slot "extra" is not in the layout, so its role is guessed.',
    ]);
  });

  it("makes an image role on a non-image a block", () => {
    const container = markup(`<div data-veilo-slot="photo"></div>`);
    const { slots, problems: found } = findSlots(
      container,
      parseLayout({ slots: { photo: { role: "image" } } }),
    );
    expect(slots[0]!.role).toBe("block");
    expect(found).toEqual([
      'slot "photo" has the image role but is not an <img> or <canvas>; it is a block.',
    ]);
  });

  it("uses only the first image and the first button", () => {
    const container = markup(
      `<img data-veilo-slot="a"><canvas data-veilo-slot="b"></canvas>` +
        `<button data-veilo-slot="c"></button><button data-veilo-slot="d"></button>`,
    );
    const { slots, problems: found } = findSlots(container, parseLayout({}));
    expect(slots.map((s) => s.role)).toEqual(["image", "block", "button", "block"]);
    expect(found).toEqual([
      'slot "b" is a second image; only the first is revealed, so it is a block.',
      'slot "d" is a second button; only the first fades in, so it is a block.',
    ]);
  });

  it("skips an element with an empty name", () => {
    const container = markup(`<p data-veilo-slot="  ">x</p>`);
    const { slots, problems: found } = findSlots(container, parseLayout({}));
    expect(slots).toEqual([]);
    expect(found).toEqual(["an element has an empty data-veilo-slot attribute and is skipped."]);
  });

  it("changes nothing in the markup", () => {
    const container = markup(CARD);
    const before = container.outerHTML;
    findSlots(container, parseLayout({ slots: { photo: { role: "image" }, missing: {} } }));
    expect(container.outerHTML).toBe(before);
  });
});
