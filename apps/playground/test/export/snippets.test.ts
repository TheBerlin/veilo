// Tests for src/export/snippets.ts, in Node.

import { defaultSettings, parseLayout } from "@veilo/core";
import { describe, expect, it } from "vitest";
import {
  cdnSnippet,
  changedSettings,
  elementSnippet,
  layoutJson,
  reactSnippet,
  vanillaSnippet,
  type SnippetInput,
} from "../../src/export/snippets.ts";
import { CARD_LAYOUTS, LAYOUT_IDS } from "../../src/stage/card-layouts.ts";

/**
 * A snippet input for a layout, with a few settings changed.
 *
 * @param layoutId - The layout.
 * @param extra - Fields to override.
 * @returns The input.
 */
function input(
  layoutId: SnippetInput["layoutId"],
  extra: Partial<SnippetInput> = {},
): SnippetInput {
  return { layoutId, settings: { imageFx: "hex", rDur: 1.6 }, ...extra };
}

/**
 * The slot names written in a snippet's markup, in order.
 *
 * @param snippet - The snippet text.
 * @returns The names.
 */
function slotsIn(snippet: string): string[] {
  // Only the markup: attributes on elements, not the layout JSON's keys.
  return [...snippet.matchAll(/data-veilo-slot="([^"]+)"/g)].map((match) => match[1]!);
}

describe("changedSettings", () => {
  it("keeps only the keys that differ from the defaults", () => {
    const defaults = defaultSettings();
    expect(changedSettings(defaults, defaults)).toEqual({});
    expect(changedSettings({ ...defaults, imageFx: "hex", rDur: 1.6 }, defaults)).toEqual({
      imageFx: "hex",
      rDur: 1.6,
    });
  });
});

describe("layoutJson", () => {
  for (const id of LAYOUT_IDS) {
    it(`${id}: is a layout that core accepts, with the table's slots`, () => {
      const layout = parseLayout(JSON.parse(layoutJson(input(id))));
      expect(Object.keys(layout.slots ?? {}).sort()).toEqual(
        Object.keys(CARD_LAYOUTS[id].slots).sort(),
      );
      expect(layout.settings.imageFx).toBe("hex");
      expect(layout.settings.rDur).toBe(1.6);
    });
  }
});

describe("snippet markup", () => {
  for (const id of LAYOUT_IDS) {
    it(`${id}: every snippet marks exactly the layout's slots`, () => {
      const expected = Object.keys(CARD_LAYOUTS[id].slots).sort();
      for (const make of [vanillaSnippet, reactSnippet, elementSnippet, cdnSnippet]) {
        expect(slotsIn(make(input(id))).sort(), make.name).toEqual(expected);
      }
    });
  }

  it("writes the user's text, escaped for HTML", () => {
    const text = { heading: 'Mice & <keys> "quoted"', price: "$1" };
    const html = vanillaSnippet(input("product", { texts: text }));
    expect(html).toContain('Mice &amp; &lt;keys&gt; "quoted"</h2>');
    expect(html).toContain('<span data-veilo-slot="price">$1</span>');
    // The rest keeps its default text.
    expect(html).toContain("Lightweight 8K polling mouse with");
  });

  it("writes JSX with a self-closing img and braced text where it needs it", () => {
    const tsx = reactSnippet(input("product", { texts: { heading: "A {braced} <b>" } }));
    expect(tsx).toContain('<img data-veilo-slot="photo" src="photo.jpg" alt="" />');
    expect(tsx).toContain('<h2 data-veilo-slot="heading">{"A {braced} <b>"}</h2>');
    expect(tsx).toContain("<Reveal");
  });
});

describe("snippets", () => {
  it("vanilla JS imports core and plays the sequence with the layout", () => {
    const code = vanillaSnippet(input("list", { width: 500 }));
    expect(code).toContain('<article class="card" style="width: 500px">');
    expect(code).toContain('import { createReveal } from "@veilo/core";');
    expect(code).toContain("createReveal(card, layout)");
    expect(code).toContain("reveal.playSequence()");
    expect(code).toContain('"imageFx": "hex"');
  });

  it("uses the layout's own width when none is chosen", () => {
    expect(vanillaSnippet(input("table"))).toContain("width: 640px");
    expect(reactSnippet(input("article"))).toContain("style={{ width: 360 }}");
  });

  it("React imports from @veilo/react and takes the layout as a prop", () => {
    const code = reactSnippet(input("product"));
    expect(code).toContain('import { Reveal, type RevealProps } from "@veilo/react";');
    expect(code).toContain('const layout: RevealProps["layout"] = {');
    expect(code).toContain("ready={ready} layout={layout}>");
  });

  it("the web component snippet registers the element and ends loading", () => {
    const code = elementSnippet(input("profile"));
    expect(code).toContain('import "@veilo/element/define";');
    expect(code).toContain("<veilo-reveal");
    expect(code).toContain("card.loading = false;");
    expect(code).not.toContain("cdn.jsdelivr.net");
  });

  it("the CDN snippet loads the script by URL and has no import", () => {
    const code = cdnSnippet(input("profile"));
    expect(
      code.startsWith('<script type="module" src="https://cdn.jsdelivr.net/npm/@veilo/element">'),
    ).toBe(true);
    expect(code).not.toContain("import ");
  });

  it("the layout attribute reads back as the same layout", () => {
    const code = cdnSnippet(input("article"));
    const attribute = /layout='([^']*)'/.exec(code)![1]!;
    expect(JSON.parse(attribute)).toEqual(JSON.parse(layoutJson(input("article"))));
  });

  it("has no trailing spaces", () => {
    for (const make of [vanillaSnippet, reactSnippet, elementSnippet, cdnSnippet]) {
      expect(make(input("product")), make.name).not.toMatch(/[ \t]+\n/);
    }
  });
});
