// Rule 3 for every component stylesheet in src: values come from --veilo-* tokens, nothing ad
// hoc. Covers all *.module.css files at once, an agreed exception to the one-to-one test mirror.

import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const dir = new URL("../src/components/", import.meta.url);
const sheets = readdirSync(dir).filter((name) => name.endsWith(".module.css"));

// Allowed raw values: 0, hairline and focus widths (1px, 2px), and plain numbers such as
// opacity. Everything else (colors, other lengths, times, curves) must be a token.
const AD_HOC = [
  [/#[0-9a-f]{3,8}\b/i, "a hex color"],
  [/\b(?:rgb|rgba|hsl|hsla|oklch)\(/i, "a color function"],
  [/(?<![\w-])(?!0px|1px|2px)\d+(?:\.\d+)?px\b/, "a length other than 1px or 2px"],
  [/(?<![\w-])\d+(?:\.\d+)?(?:ms|s)\b/, "a time"],
  [/cubic-bezier\(/, "a curve"],
  [/(?<![\w-])\d+(?:\.\d+)?(?:em|rem)\b/, "an em or rem length"],
] as const;

describe("component stylesheets", () => {
  it("exist", () => {
    expect(sheets.length).toBeGreaterThan(0);
  });

  it.each(sheets)("%s uses only tokens", (name) => {
    // Comments may mention numbers freely.
    const css = readFileSync(new URL(name, dir), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
    const found = AD_HOC.flatMap(([pattern, what]) => {
      const match = css.match(pattern);
      return match ? [`${what}: ${match[0]}`] : [];
    });
    expect(found).toEqual([]);
  });
});
