// Tests for src/stylesheet.ts: skeleton.css matches the generator and has every effect.

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { STYLESHEET_EFFECTS, buildStylesheet } from "../src/stylesheet.ts";
import { cssProblems } from "./support/parse-css.ts";

const committed = readFileSync(new URL("../skeleton.css", import.meta.url), "utf8");

describe("skeleton.css", () => {
  it("is up to date; run `pnpm --filter @veilo/css generate:stylesheet` if not", () => {
    expect(committed).toBe(buildStylesheet());
  });

  it("parses cleanly", () => {
    expect(cssProblems(committed)).toEqual([]);
  });

  it("has a still placeholder for the plain class", () => {
    expect(committed).toContain(".veilo {\n  color: transparent;");
  });

  it.each(STYLESHEET_EFFECTS)("has a rule and its own keyframes for %s", (effect) => {
    expect(committed).toContain(`.veilo.veilo-${effect} {`);
    expect(committed).toContain(`@keyframes veilo-${effect} {`);
    expect(committed).toMatch(new RegExp(`animation: veilo-${effect} `));
  });

  it.each(STYLESHEET_EFFECTS)("stops %s under reduced motion", (effect) => {
    expect(committed).toContain(
      `@media (prefers-reduced-motion: reduce) {\n  .veilo.veilo-${effect} { animation: none; }\n}`,
    );
  });

  it("reads colors and radius from custom properties with fallbacks", () => {
    expect(committed).toContain("var(--veilo-base, #dcdcdc)");
    expect(committed).toContain("var(--veilo-hi, #f7f7f7)");
    expect(committed).toContain("border-radius: var(--veilo-radius, 6px);");
    expect(committed).not.toMatch(/border-radius: \d/);
  });

  it("delays the wave by its index and no other effect", () => {
    expect(committed.match(/var\(--i, 0\)/g)).toHaveLength(1);
  });
});
