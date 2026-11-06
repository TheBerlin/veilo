// Tests for src/loader/css-generator.ts. Expected CSS is written by hand from the spec's formulas.

import { describe, expect, it } from "vitest";
import { generateLoaderCss } from "../../src/loader/css-generator.ts";
import { defaultSettings } from "../../src/schema/defaults.ts";
import { parseSettings } from "../../src/schema/validate.ts";

const settings = (overrides: object = {}) => ({ ...defaultSettings(), ...overrides });

const THEME = { base: "#dde5e6", highlight: "#f6fafa" };

describe("generateLoaderCss", () => {
  it("matches the spec's shimmer for the default settings", () => {
    expect(generateLoaderCss(settings(), THEME)).toBe(`.skeleton {
  color: transparent;
  border-radius: 6px;
  background: linear-gradient(100deg, #dde5e6 0%, #dde5e6 35%, #f6fafa 50%, #dde5e6 65%, #dde5e6 100%);
  background-size: 300% 100%;
  background-position: 100% 0;
  animation: veilo-sweep 1.4s cubic-bezier(0.22, 1, 0.36, 1) 0s infinite both;
}

@keyframes veilo-sweep {
  0% { background-position: 100% 0; }
  85.7143% { background-position: 0% 0; }
  100% { background-position: 0% 0; }
}
`);
  });

  it("matches the spec's pulse", () => {
    const css = generateLoaderCss(
      settings({ effect: "pulse", lDur: 1.4, depth: 0.45, lEase: "inOut" }),
      THEME,
    );
    expect(css).toBe(`.skeleton {
  color: transparent;
  border-radius: 6px;
  background: #dde5e6;
  animation: veilo-pulse 1.4s cubic-bezier(0.65, 0, 0.35, 1) infinite both;
}

@keyframes veilo-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
}
`);
  });

  it("adds the wave delay and a note about --i", () => {
    const css = generateLoaderCss(settings({ effect: "wave", stagger: 0.12 }));
    expect(css).toContain("calc(var(--i, 0) * 0.12s) infinite both");
    expect(css.startsWith("/* Set --i on each element")).toBe(true);
  });

  it("gives shimmer and pulse no delay expression or note", () => {
    for (const effect of ["shimmer", "pulse"]) {
      const css = generateLoaderCss(settings({ effect }));
      expect(css).not.toContain("--i");
    }
  });

  it("uses the Cascade wave preset's timing", () => {
    const css = generateLoaderCss(settings({ effect: "wave", lDur: 1, lGap: 0.4 }));
    expect(css).toContain("animation: veilo-sweep 1.4s");
    expect(css).toContain("71.4286% { background-position: 0% 0; }");
  });

  it("puts the sweep end at 100% with no pause", () => {
    const css = generateLoaderCss(settings({ lGap: 0 }));
    expect(css).toContain("animation: veilo-sweep 1.2s");
    expect(css).toContain("  100% { background-position: 0% 0; }\n  100% {");
  });

  it("follows the highlight width", () => {
    const css = generateLoaderCss(settings({ lWidth: 70 }), THEME);
    expect(css).toContain("#dde5e6 15%, #f6fafa 50%, #dde5e6 85%");
  });

  it("follows the angle and radius", () => {
    const css = generateLoaderCss(settings({ angle: 45, radius: 12 }));
    expect(css).toContain("linear-gradient(45deg,");
    expect(css).toContain("border-radius: 12px;");
  });

  it.each(["shimmer", "wave", "pulse"])("plays %s once with repeat set to once", (effect) => {
    const css = generateLoaderCss(settings({ effect, repeat: "once" }));
    expect(css).toMatch(/ 1 both;/);
    expect(css).not.toContain("infinite");
  });

  it.each([
    ["out", "cubic-bezier(0.22, 1, 0.36, 1)"],
    ["outSoft", "cubic-bezier(0.33, 1, 0.68, 1)"],
    ["inOut", "cubic-bezier(0.65, 0, 0.35, 1)"],
    ["in", "cubic-bezier(0.5, 0, 0.75, 0)"],
    ["linear", "cubic-bezier(0, 0, 1, 1)"],
    ["back", "cubic-bezier(0.34, 1.56, 0.64, 1)"],
  ])("writes the %s curve", (lEase, curve) => {
    expect(generateLoaderCss(settings({ lEase }))).toContain(curve);
  });

  it("reads the loader's custom curve, not the reveal's", () => {
    const css = generateLoaderCss(
      settings({ lEase: "custom", lx1: 0.1, ly1: -0.6, lx2: 0.9, ly2: 1.6, rx1: 0.5 }),
    );
    expect(css).toContain("cubic-bezier(0.1, -0.6, 0.9, 1.6)");
  });

  it("falls back to the theme tokens", () => {
    const css = generateLoaderCss(settings());
    expect(css).toContain("var(--veilo-base) 0%");
    expect(css).toContain("var(--veilo-hi) 50%");
  });

  it("uses color overrides ahead of the fallback colors", () => {
    const css = generateLoaderCss(
      settings({ baseColor: "#111111", highlightColor: "#222222" }),
      THEME,
    );
    expect(css).toContain("#111111 0%");
    expect(css).toContain("#222222 50%");
    expect(css).not.toContain(THEME.base);
  });

  it("uses a radius value given as an option instead of the setting", () => {
    const css = generateLoaderCss(settings({ radius: 12 }), {
      radius: "var(--veilo-radius, 12px)",
    });
    expect(css).toContain("  border-radius: var(--veilo-radius, 12px);");
    expect(css.match(/border-radius/g)).toHaveLength(1);
  });

  it("uses a custom selector", () => {
    expect(generateLoaderCss(settings(), { selector: ".card::before" })).toMatch(
      /^\.card::before \{/,
    );
  });

  it("hides float noise in the output", () => {
    // 0.1 + 0.2 is 0.30000000000000004 in floating point.
    const css = generateLoaderCss(settings({ lDur: 0.1, lGap: 0.2 }));
    expect(css).toContain("animation: veilo-sweep 0.3s");
    expect(css).not.toMatch(/\d\.\d{5,}/);
  });

  it("handles a pause longer than the sweep", () => {
    const css = generateLoaderCss(settings({ lDur: 0.3, lGap: 2 }));
    expect(css).toContain("13.0435% { background-position: 0% 0; }");
  });

  it("keeps a bad color out of settings that pass through parseSettings", () => {
    const { settings: parsed } = parseSettings({ baseColor: "red;}body{display:none" });
    expect(generateLoaderCss(parsed)).not.toContain("display:none");
  });

  it("gives equal output for equal settings", () => {
    expect(generateLoaderCss(settings())).toBe(generateLoaderCss(settings()));
  });
});

describe("generateLoaderCss keyframes name", () => {
  it.each(["shimmer", "wave", "pulse"] as const)("uses the given name for %s", (effect) => {
    const css = generateLoaderCss(settings({ effect }), { keyframes: "veilo-skeleton-a1" });
    expect(css).toContain("animation: veilo-skeleton-a1 ");
    expect(css).toContain("@keyframes veilo-skeleton-a1 {");
    expect(css).not.toMatch(/sk-(sweep|pulse)/);
  });
});
