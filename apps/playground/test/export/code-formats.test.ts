// Tests for src/export/code-formats.ts, in Node.

import { defaultSettings } from "@veilo/core";
import { describe, expect, it } from "vitest";
import { CODE_FORMATS, codeFor, DEFAULT_CODE_FORMAT } from "../../src/export/code-formats.ts";
import { defaultContent } from "../../src/state/content-store.ts";

const context = {
  settings: { ...defaultSettings(), imageFx: "hex" as const },
  content: defaultContent(),
  base: "#171717",
  highlight: "#262626",
};

describe("code formats", () => {
  it("lists nine formats with unique ids, and the default is one of them", () => {
    expect(CODE_FORMATS).toHaveLength(9);
    expect(new Set(CODE_FORMATS.map((format) => format.id)).size).toBe(9);
    expect(CODE_FORMATS.some((format) => format.id === DEFAULT_CODE_FORMAT)).toBe(true);
  });

  it("builds non-empty code for every format", () => {
    for (const format of CODE_FORMATS) {
      expect(codeFor(format.id, context).length, format.id).toBeGreaterThan(50);
    }
  });

  it("settings JSON and CSS use every key and the theme colors", () => {
    expect(JSON.parse(codeFor("settings", context))).toEqual(context.settings);
    const css = codeFor("css", context);
    expect(css).toContain(".skeleton {");
    expect(css).toContain("#171717");
  });

  it("the other formats carry only the changed settings", () => {
    const layout = JSON.parse(codeFor("layout", context));
    expect(layout.settings).toEqual({ imageFx: "hex" });
    for (const id of ["vanilla", "react", "vue", "svelte", "element", "cdn"] as const) {
      expect(codeFor(id, context), id).toContain('"imageFx": "hex"');
      expect(codeFor(id, context), id).not.toContain('"cols"');
    }
  });

  it("follows the layout, text and width of the content", () => {
    const content = {
      ...defaultContent(),
      layout: "list" as const,
      texts: { list: { heading: "Quiet mouse" } },
      widths: { list: 520 },
    };
    const code = codeFor("vanilla", { ...context, content });
    expect(code).toContain("Quiet mouse");
    expect(code).toContain("width: 520px");
    expect(code).toContain('data-veilo-slot="photo"');
    expect(code).not.toContain('data-veilo-slot="buy"');
  });

  it("marks exactly the formats that import a package", () => {
    const withPackage = CODE_FORMATS.filter((format) => format.usesPackage).map((f) => f.id);
    expect(withPackage).toEqual(["vanilla", "react", "vue", "svelte", "element", "cdn"]);
  });
});
