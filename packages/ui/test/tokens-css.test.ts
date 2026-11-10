// Tests for src/tokens-css.ts: tokens.css is current, valid and complete.

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
// The strict CSS checker from @veilo/css's tests, so both packages check CSS the same way.
import { cssProblems } from "../../css/test/support/parse-css.ts";
import { buildTokensCss } from "../src/tokens-css.ts";
import { COLORS, DURATIONS, RADIUS, SIZES, SPACE, TYPE } from "../src/tokens.ts";

const committed = readFileSync(new URL("../tokens.css", import.meta.url), "utf8");

/**
 * The declarations inside the first block that starts with the given text.
 *
 * @param start - The selector or at-rule line.
 * @returns The block's text.
 */
function block(start: string): string {
  const from = committed.indexOf(start);
  return committed.slice(from, committed.indexOf("\n}", from));
}

describe("tokens.css", () => {
  it("is up to date; run `pnpm --filter @veilo/ui generate:tokens` if not", () => {
    expect(committed).toBe(buildTokensCss());
  });

  it("parses cleanly", () => {
    expect(cssProblems(committed)).toEqual([]);
  });

  it("defines every token with the --veilo- prefix", () => {
    const names = [
      ...Object.keys(COLORS),
      ...Object.keys(SPACE),
      ...Object.keys(SIZES),
      ...Object.keys(RADIUS),
      ...Object.keys(DURATIONS),
      ...Object.keys(TYPE).map((name) => `type-${name}`),
      "shadow-soft",
      "ease-out",
      "ease-in",
      "ease-in-out",
      "ease-hint",
    ];
    for (const name of names) expect(committed).toContain(`  --veilo-${name}: `);
    expect(committed).not.toMatch(/^\s+--(?!veilo-)/m);
  });

  it("is dark by default and light by attribute or by system preference", () => {
    expect(block(":root {")).toContain(`--veilo-bg: ${COLORS.bg.dark};`);
    for (const start of [':root[data-theme="light"]', "@media (prefers-color-scheme: light)"]) {
      const light = block(start);
      for (const [name, color] of Object.entries(COLORS)) {
        expect(light).toContain(`--veilo-${name}: ${color.light};`);
      }
    }
    expect(committed).toContain(':root:not([data-theme="dark"])');
  });

  it("drops every duration to 0 under reduced motion", () => {
    const reduced = block("@media (prefers-reduced-motion: reduce)");
    for (const name of Object.keys(DURATIONS)) expect(reduced).toContain(`--veilo-${name}: 0ms;`);
  });

  it("gives @veilo/css skeletons the control radius", () => {
    expect(committed).toContain("--veilo-radius: var(--veilo-radius-base);");
  });
});
