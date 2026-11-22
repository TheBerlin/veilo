// hero-effect.ts: the effect the hero's demo cards play: a skeleton loader and a reveal.

import type { Settings } from "@veilo-ui/core";

/**
 * The hero's effect, exported from the playground's "My presets" (the preset named "cool
 * preset"). The skeleton is a looping shimmer with a custom curve; the reveal is dots growing
 * from random origins, with rising text, after a 1.2 s hold. It is plain settings JSON, so the
 * playground can load it back.
 */
export const HERO_SETTINGS: Partial<Settings> = {
  version: 1,
  effect: "shimmer",
  lDur: 1.75,
  lGap: 0.3,
  lEase: "custom",
  lx1: 0.81,
  ly1: -0.01,
  lx2: 0.17,
  ly2: 0.99,
  repeat: "loop",
  stagger: 0.12,
  angle: 110,
  lWidth: 30,
  depth: 0.5,
  radius: 6,
  imageFx: "dots",
  origin: "random",
  cols: 86,
  startScale: 2.7,
  spread: 0.65,
  textFx: "rise",
  charset: "dots",
  unit: "char",
  rDur: 1,
  rEase: "custom",
  rx1: 0.67,
  ry1: 0,
  rx2: 0.36,
  ry2: 1,
  hold: 1.2,
};

/**
 * The effect of the closing call to action, exported from the playground: a looping wave skeleton,
 * then dots from random origins with fading text after a 1.2 s hold. Plain settings JSON, so the
 * playground can load it back.
 */
export const WAVE_SETTINGS: Partial<Settings> = {
  version: 1,
  effect: "wave",
  lDur: 1,
  lGap: 0.5,
  lEase: "custom",
  lx1: 0.84,
  ly1: 0,
  lx2: 0.17,
  ly2: 1,
  repeat: "loop",
  stagger: 0.12,
  angle: 100,
  lWidth: 30,
  depth: 0.5,
  radius: 6,
  imageFx: "dots",
  origin: "random",
  cols: 88,
  startScale: 2,
  spread: 0.7,
  textFx: "fade",
  charset: "dots",
  unit: "char",
  rDur: 1,
  rEase: "custom",
  rx1: 0.81,
  ry1: 0,
  rx2: 0.18,
  ry2: 1,
  hold: 1.2,
};

/**
 * The effect of the hero's three demo cards, exported from the playground: a quicker wave
 * skeleton that plays once (0.75 s, a 0.03 s step between bars), then dots from random origins
 * with fading text after a 2 s hold, the simulated loading time.
 */
export const CARDS_SETTINGS: Partial<Settings> = {
  version: 1,
  effect: "wave",
  lDur: 0.75,
  lGap: 0.5,
  lEase: "custom",
  lx1: 0.84,
  ly1: 0,
  lx2: 0.17,
  ly2: 1,
  repeat: "once",
  stagger: 0.03,
  angle: 100,
  lWidth: 30,
  depth: 0.5,
  radius: 6,
  imageFx: "dots",
  origin: "random",
  cols: 90,
  startScale: 2,
  spread: 0.7,
  textFx: "fade",
  charset: "dots",
  unit: "char",
  rDur: 0.75,
  rEase: "custom",
  rx1: 0.81,
  ry1: 0,
  rx2: 0.18,
  ry2: 1,
  hold: 2,
};
