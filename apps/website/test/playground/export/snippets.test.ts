// Tests for src/export/snippets.ts, in Node.

import { defaultSettings, parseLayout } from "@veilo-ui/core";
import { describe, expect, it } from "vitest";
import {
  angularSnippet,
  cdnSnippet,
  changedSettings,
  elementSnippet,
  layoutJson,
  reactSnippet,
  svelteSnippet,
  vanillaSnippet,
  vueSnippet,
  type SnippetInput,
} from "../../../src/playground/export/snippets.ts";
import { CARD_LAYOUTS, LAYOUT_IDS } from "../../../src/playground/stage/card-layouts.ts";

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
      for (const make of [
        vanillaSnippet,
        reactSnippet,
        vueSnippet,
        svelteSnippet,
        elementSnippet,
        cdnSnippet,
      ]) {
        expect(slotsIn(make(input(id))).sort(), make.name).toEqual(expected);
      }
    });
  }

  it("writes the user's text, escaped for HTML", () => {
    const text = { track: 'Mice & <keys> "quoted"', time: "$1" };
    const html = vanillaSnippet(input("music", { texts: text }));
    expect(html).toContain('Mice &amp; &lt;keys&gt; "quoted"</p>');
    expect(html).toContain('<span data-veilo-slot="time">$1</span>');
    // The rest keeps its default text.
    expect(html).toContain("Blue Meridian");
  });

  it("writes JSX with a self-closing img and braced text where it needs it", () => {
    const tsx = reactSnippet(input("video", { texts: { title: "A {braced} <b>" } }));
    expect(tsx).toContain('<img data-veilo-slot="thumb" src="photo.jpg" alt="" />');
    expect(tsx).toContain('<p data-veilo-slot="title">{"A {braced} <b>"}</p>');
    expect(tsx).toContain("<Reveal");
  });
});

describe("snippets", () => {
  it("vanilla JS imports core and plays the sequence with the layout", () => {
    const code = vanillaSnippet(input("video", { width: 500 }));
    expect(code).toContain('<article class="card" style="width: 500px">');
    expect(code).toContain('import { createReveal } from "@veilo-ui/core";');
    expect(code).toContain("createReveal(card, layout)");
    expect(code).toContain("reveal.playSequence()");
    expect(code).toContain('"imageFx": "hex"');
  });

  it("uses the layout's own width when none is chosen", () => {
    expect(vanillaSnippet(input("inbox"))).toContain("width: 480px");
    expect(reactSnippet(input("video"))).toContain("style={{ width: 320 }}");
  });

  it("React imports from @veilo-ui/react and takes the layout as a prop", () => {
    const code = reactSnippet(input("music"));
    expect(code).toContain('import { Reveal, type RevealProps } from "@veilo-ui/react";');
    expect(code).toContain('const layout: RevealProps["layout"] = {');
    expect(code).toContain("ready={ready} layout={layout}>");
  });

  it("Vue is a script-setup component with the layout as a prop, and escapes interpolation", () => {
    const code = vueSnippet(input("video", { texts: { title: "A {{ b }} <c>" } }));
    expect(code.startsWith('<script setup lang="ts">')).toBe(true);
    expect(code).toContain('import { Reveal, type LayoutInput } from "@veilo-ui/vue";');
    expect(code).toContain("defineProps<{ ready: boolean }>();");
    expect(code).toContain(':ready="ready" :layout="layout"');
    // An absolute path: a relative one would be compiled into a module import.
    expect(code).toContain('<img data-veilo-slot="thumb" src="/photo.jpg" alt="" />');
    // `{{` would start an interpolation in a template; `<` is escaped as in HTML.
    expect(code).toContain('A {{ "{{" }} b }} &lt;c&gt;</p>');
  });

  it("Svelte is a runes component with the layout as a prop, and escapes braces", () => {
    const code = svelteSnippet(input("video", { texts: { title: "A {b} <c>" } }));
    expect(code.startsWith('<script lang="ts">')).toBe(true);
    expect(code).toContain('import { Reveal, type LayoutInput } from "@veilo-ui/svelte";');
    expect(code).toContain("let { ready }: { ready: boolean } = $props();");
    expect(code).toContain("{ready} {layout}>");
    expect(code).toContain('<img data-veilo-slot="thumb" src="photo.jpg" alt="" />');
    // A brace would start an expression in a template; `<` is escaped as in HTML.
    expect(code).toContain('A {"{"}b{"}"} &lt;c&gt;</p>');
  });

  it("Angular is a standalone component with the layout as an input, and escapes its template", () => {
    const code = angularSnippet(input("video", { texts: { title: "A {b} @c `d` ${e} <f>" } }));
    expect(code).toContain('import { VeiloReveal, type LayoutInput } from "@veilo-ui/angular";');
    expect(code).toContain("imports: [VeiloReveal],");
    expect(code).toContain("readonly ready = input.required<boolean>();");
    expect(code).toContain('[ready]="ready()" [layout]="layout">');
    expect(code).toContain('<img data-veilo-slot="thumb" src="photo.jpg" alt="" />');
    // Braces and @ become character references; backtick and ${ are escaped for the literal.
    // (String.raw keeps the backslashes the snippet writes before each backtick.) A `$` before a
    // brace needs no escape: the brace is already a character reference, so `${` never appears.
    expect(code).toContain(String.raw`A &#123;b&#125; &#64;c \`d\` $&#123;e&#125; &lt;f&gt;</p>`);
  });

  it("the web component snippet registers the element and ends loading", () => {
    const code = elementSnippet(input("video"));
    expect(code).toContain('import "@veilo-ui/element/define";');
    expect(code).toContain("<veilo-reveal");
    expect(code).toContain("card.loading = false;");
    expect(code).not.toContain("cdn.jsdelivr.net");
  });

  it("the CDN snippet loads the script by URL and has no import", () => {
    const code = cdnSnippet(input("video"));
    expect(
      code.startsWith(
        '<script type="module" src="https://cdn.jsdelivr.net/npm/@veilo-ui/element">',
      ),
    ).toBe(true);
    expect(code).not.toContain("import ");
  });

  it("the layout attribute reads back as the same layout", () => {
    const code = cdnSnippet(input("inbox"));
    const attribute = /layout='([^']*)'/.exec(code)![1]!;
    expect(JSON.parse(attribute)).toEqual(JSON.parse(layoutJson(input("inbox"))));
  });

  it("has no trailing spaces", () => {
    for (const make of [
      vanillaSnippet,
      reactSnippet,
      vueSnippet,
      svelteSnippet,
      elementSnippet,
      cdnSnippet,
    ]) {
      expect(make(input("music")), make.name).not.toMatch(/[ \t]+\n/);
    }
  });
});
