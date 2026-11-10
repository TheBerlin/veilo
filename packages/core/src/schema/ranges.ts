// ranges.ts: the settings table, with every default, range and option in one place.
// Layer 0 (pure). Must not import DOM code.

/** Easing preset keys shared by the loader and the reveal (spec: Easing presets). */
export const EASING_KEYS = ["out", "outSoft", "inOut", "in", "linear", "back", "custom"] as const;

/**
 * Optional color overrides. They have no default, so they live outside the table: the skeleton's
 * base and highlight, and the ink of the dots and characters in the grid reveals.
 */
export const COLOR_KEYS = ["baseColor", "highlightColor", "inkColor"] as const;

/** Accepted color format: `#rrggbb`, either case. */
export const COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

/** One row of the settings table: a numeric range or a list of string options. */
export type SettingEntry =
  | {
      readonly kind: "number";
      readonly default: number;
      readonly min: number;
      readonly max: number;
      readonly step: number;
    }
  | { readonly kind: "enum"; readonly default: string; readonly options: readonly string[] };

/** A numeric setting: default plus the allowed range from the spec's control tables. */
const num = (def: number, min: number, max: number, step: number) =>
  ({ kind: "number", default: def, min, max, step }) as const;

/** An enumerated setting: a fixed list of string options. */
const choice = <const T extends readonly string[]>(options: T, def: T[number]) =>
  ({ kind: "enum", default: def, options }) as const;

/**
 * Single source of truth for every setting. Types, defaults, validation and the
 * JSON Schema are all derived from this table, so they cannot drift apart.
 */
export const SETTINGS_SPEC = {
  // Loader tab
  effect: choice(["shimmer", "wave", "pulse"], "shimmer"),
  lDur: num(1.2, 0.3, 4, 0.05),
  lGap: num(0.2, 0, 2, 0.05),
  lEase: choice(EASING_KEYS, "out"),
  lx1: num(0.22, 0, 1, 0.01),
  ly1: num(1, -0.6, 1.6, 0.01),
  lx2: num(0.36, 0, 1, 0.01),
  ly2: num(1, -0.6, 1.6, 0.01),
  repeat: choice(["loop", "once"], "loop"),
  stagger: num(0.12, 0, 0.4, 0.01),
  angle: num(100, 0, 180, 5),
  lWidth: num(30, 8, 70, 2),
  depth: num(0.5, 0.1, 0.9, 0.05),
  radius: num(6, 0, 24, 1),
  // Reveal tab: image
  imageFx: choice(["dots", "hex", "binary", "mosaic", "blur", "crossfade", "wipe", "zoom"], "dots"),
  origin: choice(["left", "right", "top", "bottom", "center", "diagonal", "random"], "left"),
  cols: num(64, 16, 110, 2),
  startScale: num(2.5, 1, 4, 0.1),
  spread: num(0.6, 0.1, 0.9, 0.05),
  // Reveal tab: text
  textFx: choice(["scramble", "typewriter", "rise", "fade"], "scramble"),
  charset: choice(["hex", "binary", "symbols", "dots"], "dots"),
  unit: choice(["char", "word"], "char"),
  // Reveal tab: timing
  rDur: num(1.04, 0.4, 5, 0.05),
  rEase: choice(EASING_KEYS, "outSoft"),
  rx1: num(0.33, 0, 1, 0.01),
  ry1: num(1, -0.6, 1.6, 0.01),
  rx2: num(0.68, 0, 1, 0.01),
  ry2: num(1, -0.6, 1.6, 0.01),
  hold: num(1.2, 0, 5, 0.1),
} as const satisfies Record<string, SettingEntry>;

/** Every key in the settings table, in table order. */
export const SETTING_KEYS = Object.keys(SETTINGS_SPEC) as (keyof typeof SETTINGS_SPEC)[];
