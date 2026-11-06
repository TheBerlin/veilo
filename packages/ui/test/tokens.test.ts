// Tests for src/tokens.ts: the radius rule and the contrast the design system promises.

import { describe, expect, it } from "vitest";
import { COLORS, RADIUS, SPACE } from "../src/tokens.ts";

/**
 * WCAG relative luminance of a #rrggbb color.
 *
 * @param hex - The color.
 * @returns The luminance, 0 to 1.
 */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

/**
 * WCAG contrast ratio of two #rrggbb colors.
 *
 * @param a - One color.
 * @param b - The other color.
 * @returns The ratio, 1 to 21.
 */
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

const THEMES = ["dark", "light"] as const;
const SURFACES = ["bg", "card", "secondary"] as const;

describe("radius", () => {
  it("is the base for controls and base plus padding for surfaces", () => {
    expect(RADIUS["radius-base"]).toBe(8);
    expect(RADIUS["radius-md"]).toBe(8 + SPACE["space-1"]);
    expect(RADIUS["radius-lg"]).toBe(8 + SPACE["space-2"]);
    expect(RADIUS["radius-xl"]).toBe(8 + SPACE["space-4"]);
    expect([RADIUS["radius-md"], RADIUS["radius-lg"], RADIUS["radius-xl"]]).toEqual([16, 24, 40]);
  });
});

describe("colors", () => {
  it("uses the fixed theme backgrounds and the monochrome inverse accent", () => {
    expect(COLORS.bg).toEqual({ dark: "#030303", light: "#f1f1f1" });
    expect(COLORS.accent).toEqual({ dark: COLORS.bg.light, light: COLORS.bg.dark });
    expect(COLORS["on-accent"]).toEqual(COLORS.bg);
  });

  it("never uses pure white or black for text", () => {
    for (const theme of THEMES) {
      for (const name of ["text", "text-muted"] as const) {
        expect(["#ffffff", "#000000"]).not.toContain(COLORS[name][theme]);
      }
    }
  });

  it.each(THEMES)("keeps the promised contrast on every surface in %s", (theme) => {
    for (const surface of SURFACES) {
      const ground = COLORS[surface][theme];
      expect(contrast(COLORS.text[theme], ground)).toBeGreaterThanOrEqual(4.5);
      // The design system's promise, above WCAG AA's 4.5.
      expect(contrast(COLORS["text-muted"][theme], ground)).toBeGreaterThanOrEqual(4.9);
      expect(contrast(COLORS["border-strong"][theme], ground)).toBeGreaterThanOrEqual(3);
      expect(contrast(COLORS.danger[theme], ground)).toBeGreaterThanOrEqual(4.5);
    }
    expect(contrast(COLORS["on-accent"][theme], COLORS.accent[theme])).toBeGreaterThanOrEqual(4.5);
  });

  it("uses the same skeleton colors as the @veilo/css light fallbacks", () => {
    expect(COLORS.base.light).toBe("#dcdcdc");
    expect(COLORS.hi.light).toBe("#f7f7f7");
  });
});
