// Tests for src/grid/ramps.ts, from the spec's measured density ramps.
// Runs in Chromium (see BROWSER_TESTS in vitest.config.ts), because measuring draws on a canvas.

/// <reference types="vite/client" />
import plexUrl from "@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2?url";
import { beforeAll, describe, expect, it } from "vitest";
import { loadFont } from "../../src/dom/fonts.ts";
import {
  BINARY_CHARS,
  DEFAULT_GLYPH_FONT,
  glyphAt,
  HEX_CHARS,
  measureRamp,
  rampFromInk,
  type GlyphRamp,
} from "../../src/grid/ramps.ts";

// IBM Plex Mono under a name of its own, so a copy installed on the machine is never used and
// every machine measures the same font file.
const PLEX = '"Veilo Test Plex"';

/** Registers the bundled IBM Plex Mono file under a family name and waits for it. */
async function addPlex(family: string) {
  document.fonts.add(new FontFace(family.replaceAll('"', ""), `url(${plexUrl})`));
  return loadFont(`40px ${family}`);
}

/** Builds a ramp from made-up ink values. */
const ramp = (chars: string, ink: number[]) => rampFromInk(chars, new Float64Array(ink), "test");

/** Every glyph of a ramp, entry by entry. */
const glyphs = (r: GlyphRamp) => [...r.lookup].map((i) => r.chars[i]).join("");

beforeAll(async () => {
  expect(await addPlex(PLEX)).toBe(true);
});

describe("character sets", () => {
  it("match the spec", () => {
    expect(HEX_CHARS).toBe("0123456789ABCDEF-_.~");
    expect(BINARY_CHARS).toBe("01");
  });

  it("default to IBM Plex Mono with a monospace fallback", () => {
    expect(DEFAULT_GLYPH_FONT).toBe('"IBM Plex Mono", monospace');
  });
});

describe("rampFromInk", () => {
  it("has 256 entries from the lightest glyph to the densest", () => {
    const r = ramp("abc", [10, 50, 100]);
    expect(r.lookup).toHaveLength(256);
    expect(glyphAt(r, 0)).toBe("a");
    expect(glyphAt(r, 1)).toBe("c");
  });

  it("picks the glyph closest to darkness x maxInk", () => {
    // Targets are i / 255 x 100. Midpoints: a|b at 30, b|c at 75.
    const r = ramp("abc", [10, 50, 100]);
    expect(r.chars[r.lookup[76] as number]).toBe("a"); // 29.8
    expect(r.chars[r.lookup[77] as number]).toBe("b"); // 30.2
    expect(r.chars[r.lookup[191] as number]).toBe("b"); // 74.9
    expect(r.chars[r.lookup[192] as number]).toBe("c"); // 75.3
  });

  it("does not need the characters sorted by ink", () => {
    const r = ramp("cab", [100, 10, 50]);
    expect(glyphs(r)).toBe(glyphs(ramp("abc", [10, 50, 100])));
  });

  it("gives a tie to the earlier character", () => {
    expect(glyphs(ramp("xy", [20, 20]))).toBe("x".repeat(256));
    expect(glyphs(ramp("lhH", [0, 2, 2]))).not.toContain("H");
  });

  it("works with a single character", () => {
    expect(glyphs(ramp("#", [42]))).toBe("#".repeat(256));
  });

  it("keeps the measured values and font", () => {
    const ink = new Float64Array([1, 2]);
    const r = rampFromInk("01", ink, "40px x");
    expect(r.ink).toBe(ink);
    expect(r.font).toBe("40px x");
    expect(r.chars).toBe("01");
  });
});

describe("glyphAt", () => {
  const r = ramp("ab", [0, 100]);

  it("rounds darkness to the nearest entry", () => {
    // Entries up to 127 target below 50, so a wins; 128 and up go to b.
    expect(glyphAt(r, 127 / 255)).toBe("a");
    expect(glyphAt(r, 127.6 / 255)).toBe("b");
  });

  it("clamps values outside 0 to 1", () => {
    expect(glyphAt(r, -3)).toBe("a");
    expect(glyphAt(r, 7)).toBe("b");
  });
});

describe("measureRamp with IBM Plex Mono", () => {
  it("measures every glyph with some ink", () => {
    const r = measureRamp(HEX_CHARS, PLEX);
    expect(r.ink).toHaveLength(HEX_CHARS.length);
    for (const value of r.ink) expect(value).toBeGreaterThan(0);
  });

  it("finds the four marks lighter than every digit and letter", () => {
    const r = measureRamp(HEX_CHARS, PLEX);
    const inkOf = (ch: string) => r.ink[HEX_CHARS.indexOf(ch)] as number;
    const lightest = Math.max(...[..."-_.~"].map(inkOf));
    for (const ch of "0123456789ABCDEF") expect(inkOf(ch)).toBeGreaterThan(lightest);
    expect(inkOf(".")).toBeLessThan(inkOf("0"));
  });

  it("maps darkness 1 to the densest glyph and 0 to the lightest", () => {
    const r = measureRamp(HEX_CHARS, PLEX);
    const order = [...HEX_CHARS].sort(
      (a, b) => (r.ink[HEX_CHARS.indexOf(a)] as number) - (r.ink[HEX_CHARS.indexOf(b)] as number),
    );
    expect(glyphAt(r, 1)).toBe(order.at(-1));
    expect(glyphAt(r, 0)).toBe(order[0]);
  });

  it("gives the same result every time", () => {
    expect(measureRamp(HEX_CHARS, PLEX)).toEqual(measureRamp(HEX_CHARS, PLEX));
  });

  it("records the 40 px font it measured", () => {
    expect(measureRamp(BINARY_CHARS, PLEX).font).toBe(`40px ${PLEX}`);
    expect(measureRamp(BINARY_CHARS).font).toBe(`40px ${DEFAULT_GLYPH_FONT}`);
  });

  it("measures differently once the web font has loaded", async () => {
    // Before the face exists the fallback is measured; this is why the controller measures
    // again when loadFont resolves.
    const family = '"Veilo Late Plex", monospace';
    const before = measureRamp(HEX_CHARS, family);
    expect(await addPlex('"Veilo Late Plex"')).toBe(true);
    const after = measureRamp(HEX_CHARS, family);
    expect(after.ink).not.toEqual(before.ink);
    expect(after.ink).toEqual(measureRamp(HEX_CHARS, PLEX).ink);
  });
});
