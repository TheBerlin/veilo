/**
 * ramps.ts: measures how much ink each glyph uses and maps darkness to the closest glyph.
 * Layer 1 (needs a canvas). One of the two grid files allowed to use dom/.
 */

import { context2d, createCanvas } from "../dom/canvas.ts";
import { clamp } from "../math/number.ts";

/** The hex effect's characters, as the spec lists them. */
export const HEX_CHARS = "0123456789ABCDEF-_.~";

/** The binary effect's characters. */
export const BINARY_CHARS = "01";

/** The font family glyphs are measured and drawn in, with a fallback while it loads. */
export const DEFAULT_GLYPH_FONT = '"IBM Plex Mono", monospace';

/** A lookup from darkness to the glyph with the closest measured ink. */
export interface GlyphRamp {
  /** The characters, one glyph each. */
  chars: string;
  /** The CSS font the ink was measured in. Pass it to `loadFont` to know when to measure again. */
  font: string;
  /** Ink per character, in the order of `chars`. */
  ink: Float64Array;
  /** 256 entries: entry `i` is the position in `chars` of the glyph for darkness `i / 255`. */
  lookup: Uint8Array;
}

/** Entries in the lookup, one per 8-bit darkness level. */
const LOOKUP_SIZE = 256;

// The spec measures at 40 px. The canvas leaves room for any glyph drawn at its center.
const MEASURE_SIZE = 40;
const CANVAS_SIZE = 64;

/**
 * Builds a ramp from ink amounts that are already measured.
 *
 * Entry `i` gets the character whose ink is closest to `(i / 255) * maxInk`. On a tie the
 * character earlier in `chars` wins.
 *
 * @param chars - The characters, at least one and at most 256.
 * @param ink - Ink per character, in the same order.
 * @param font - The CSS font the ink was measured in.
 * @returns The ramp.
 */
export function rampFromInk(chars: string, ink: Float64Array, font: string): GlyphRamp {
  const maxInk = Math.max(...ink);
  const lookup = new Uint8Array(LOOKUP_SIZE);

  for (let i = 0; i < LOOKUP_SIZE; i++) {
    const target = (i / (LOOKUP_SIZE - 1)) * maxInk;
    let best = 0;
    let bestGap = Infinity;
    for (let c = 0; c < ink.length; c++) {
      const gap = Math.abs((ink[c] as number) - target);
      // Strictly smaller, so the earlier character keeps a tie.
      if (gap < bestGap) {
        best = c;
        bestGap = gap;
      }
    }
    lookup[i] = best;
  }
  return { chars, font, ink, lookup };
}

/**
 * Picks the glyph for a darkness value.
 *
 * @param ramp - The ramp to read.
 * @param darkness - Cell darkness, 0 to 1. Values outside are clamped.
 * @returns One character from the ramp.
 */
export function glyphAt(ramp: GlyphRamp, darkness: number): string {
  const entry = ramp.lookup[Math.round(clamp(darkness) * (LOOKUP_SIZE - 1))] as number;
  return ramp.chars[entry] as string;
}

/**
 * Measures each character's ink and builds its ramp.
 *
 * Draws every character at 40 px on a temporary canvas and sums its alpha. Uses whatever font
 * the browser has right now: if the web font is still loading, the fallback is measured, so
 * measure again once `loadFont(ramp.font)` resolves.
 *
 * @param chars - The characters, such as {@link HEX_CHARS}.
 * @param fontFamily - CSS font family list. Defaults to {@link DEFAULT_GLYPH_FONT}.
 * @returns The ramp.
 */
export function measureRamp(chars: string, fontFamily = DEFAULT_GLYPH_FONT): GlyphRamp {
  const font = `${MEASURE_SIZE}px ${fontFamily}`;
  const context = context2d(createCanvas(CANVAS_SIZE, CANVAS_SIZE), { willReadFrequently: true });
  context.font = font;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = "#000";

  const ink = new Float64Array(chars.length);
  for (let c = 0; c < chars.length; c++) {
    context.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    context.fillText(chars[c] as string, CANVAS_SIZE / 2, CANVAS_SIZE / 2);
    const pixels = context.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE).data;
    let sum = 0;
    for (let i = 3; i < pixels.length; i += 4) sum += pixels[i] as number;
    ink[c] = sum / 255;
  }
  return rampFromInk(chars, ink, font);
}
