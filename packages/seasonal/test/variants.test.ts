// Tests for src/variants.ts, and through it the renderers, the flake drawing, the
// palette and the canvas state: every winter effect draws something, draws the same picture for
// the same time, and changes over time. Runs in Chromium: it needs a real canvas.

import { afterEach, describe, expect, it } from "vitest";
import { FLAKE_SHAPES } from "../src/flake.ts";
import { createCanvasState, type CanvasState } from "../src/state.ts";
import { EFFECT_IDS, VARIANTS, usesFlakeShape, type EffectId } from "../src/variants.ts";

const made: HTMLCanvasElement[] = [];

afterEach(() => {
  for (const canvas of made.splice(0)) canvas.remove();
});

/**
 * A laid-out canvas of the gallery's preview size, with a state for one effect.
 *
 * @param id - The effect.
 * @returns The canvas state.
 */
function setup(id: EffectId): CanvasState {
  const canvas = document.createElement("canvas");
  canvas.style.cssText = "display:block;width:300px;height:300px";
  document.body.append(canvas);
  made.push(canvas);
  return createCanvasState(canvas, VARIANTS[id].options, "dendrite");
}

/**
 * The picture on a state's canvas, as one string, to compare two frames.
 *
 * @param st - The canvas state.
 * @returns The canvas as a data URL.
 */
const picture = (st: CanvasState) => st.canvas.toDataURL();

/**
 * How many pixels of the canvas are not fully transparent.
 *
 * @param st - The canvas state.
 * @returns The count.
 */
function inked(st: CanvasState): number {
  const { data } = st.ctx.getImageData(0, 0, st.canvas.width, st.canvas.height);
  let count = 0;
  for (let i = 3; i < data.length; i += 4) if (data[i]! > 0) count++;
  return count;
}

describe("every winter effect", () => {
  for (const id of EFFECT_IDS) {
    it(`${id} draws something on its resting frame`, () => {
      const st = setup(id);
      VARIANTS[id].draw(st, VARIANTS[id].still);
      expect(inked(st)).toBeGreaterThan(500);
    });

    it(`${id} draws the same picture for the same time`, () => {
      const st = setup(id);
      VARIANTS[id].draw(st, VARIANTS[id].still);
      const first = picture(st);
      VARIANTS[id].draw(st, 1.3);
      VARIANTS[id].draw(st, VARIANTS[id].still);
      expect(picture(st)).toBe(first);
    });

    it(`${id} changes as time goes on`, () => {
      const st = setup(id);
      VARIANTS[id].draw(st, 1);
      const early = picture(st);
      VARIANTS[id].draw(st, VARIANTS[id].still);
      expect(picture(st)).not.toBe(early);
    });
  }

  it("has a period and a resting frame inside it", () => {
    for (const id of EFFECT_IDS) {
      expect(VARIANTS[id].period, id).toBeGreaterThan(0);
      expect(VARIANTS[id].still, id).toBeLessThan(VARIANTS[id].period);
    }
  });
});

describe("the flake form", () => {
  it("changes the picture of every effect that draws a flake, and no other", () => {
    for (const id of EFFECT_IDS) {
      const st = setup(id);
      VARIANTS[id].draw(st, VARIANTS[id].still);
      const dendrite = picture(st);
      st.shape = "fern";
      VARIANTS[id].draw(st, VARIANTS[id].still);
      if (usesFlakeShape(id)) expect(picture(st), id).not.toBe(dendrite);
      else expect(picture(st), id).toBe(dendrite);
    }
  });

  it("gives each of the four forms its own picture", () => {
    const st = setup("frost");
    const pictures = new Set<string>();
    for (const shape of FLAKE_SHAPES) {
      st.shape = shape;
      VARIANTS.frost.draw(st, VARIANTS.frost.still);
      pictures.add(picture(st));
    }
    expect(pictures.size).toBe(FLAKE_SHAPES.length);
  });
});

describe("the palette", () => {
  afterEach(() => {
    document.documentElement.style.removeProperty("--veilo-bg");
  });

  it("follows the page's tokens: a dark frame and a light frame of one effect differ", () => {
    const st = setup("cell-cells");
    document.documentElement.style.setProperty("--veilo-bg", "#16161a");
    const dark = createCanvasState(st.canvas, VARIANTS["cell-cells"].options, "dendrite");
    VARIANTS["cell-cells"].draw(dark, 4.6);
    const darkPicture = picture(dark);
    document.documentElement.style.setProperty("--veilo-bg", "#f1f1f3");
    const light = createCanvasState(st.canvas, VARIANTS["cell-cells"].options, "dendrite");
    VARIANTS["cell-cells"].draw(light, 4.6);
    expect(dark.pal.dark).toBe(true);
    expect(light.pal.dark).toBe(false);
    expect(picture(light)).not.toBe(darkPicture);
  });

  it("works with no Veilo tokens on the page, using the browser's own color scheme", () => {
    const st = setup("frost");
    expect(typeof st.pal.dark).toBe("boolean");
    expect(st.pal.text).toMatch(/^#/);
    VARIANTS.frost.draw(st, VARIANTS.frost.still);
    expect(inked(st)).toBeGreaterThan(500);
  });
});
