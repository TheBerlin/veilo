// controls.ts: the table behind the Loader and Reveal tabs (spec 1.3 and 1.4): labels, steps,
// units, option names and "shown when" rules. Ranges and option lists come from core's settings
// JSON Schema, so they are never copied here.

import { settingsJsonSchema, type SettingKey, type Settings } from "@veilo/core";

/** Keys whose value is a number. */
export type NumberKey = {
  [Key in SettingKey]: Settings[Key] extends number ? Key : never;
}[SettingKey];

/** Keys whose value is one of a list of names. */
export type ChoiceKey = {
  [Key in SettingKey]: Settings[Key] extends string ? Key : never;
}[SettingKey];

/** A slider for a number setting. */
export interface NumberControl {
  kind: "number";
  key: NumberKey;
  label: string;
  /** Slider step, from the spec's control tables. */
  step: number;
  /** How the value is shown, for example `1.20 s`. */
  format: (value: number) => string;
  /** Hides the control when this returns false. */
  shown?: (settings: Settings) => boolean;
}

/** A choice between named options: chips for up to four, a select for more. */
export interface ChoiceControl {
  kind: "choice";
  key: ChoiceKey;
  label: string;
  /** Visible name of each option, by value. */
  names: Readonly<Record<string, string>>;
  /** Hides the control when this returns false. */
  shown?: (settings: Settings) => boolean;
}

/** One control of a tab. */
export type Control = NumberControl | ChoiceControl;

/** A titled group of controls; hidden when none of its controls are shown. */
export interface ControlGroup {
  title: string;
  controls: readonly Control[];
}

/** The minimum and maximum of a number setting, from core's JSON Schema. */
export interface Bounds {
  min: number;
  max: number;
}

interface SchemaProperty {
  minimum?: number;
  maximum?: number;
  enum?: string[];
}

// Read once: the schema is a fixed table built from core's settings spec.
const PROPERTIES = settingsJsonSchema().properties as Record<string, SchemaProperty>;

/**
 * The range of a number setting.
 *
 * @param key - A number setting.
 * @returns Its minimum and maximum.
 */
export function boundsOf(key: NumberKey): Bounds {
  const property = PROPERTIES[key];
  return { min: property?.minimum ?? 0, max: property?.maximum ?? 1 };
}

/**
 * The allowed values of a choice setting, in the schema's order.
 *
 * @param key - A choice setting.
 * @returns Its option values.
 */
export function optionsOf(key: ChoiceKey): readonly string[] {
  return PROPERTIES[key]?.enum ?? [];
}

const seconds = (value: number) => `${value.toFixed(2)} s`;
const plain = (value: number) => value.toFixed(2);
const degrees = (value: number) => `${Math.round(value)}°`;
const percent = (value: number) => `${Math.round(value)}%`;
const pixels = (value: number) => `${Math.round(value)} px`;
const times = (value: number) => `${value.toFixed(1)}×`;
const whole = (value: number) => `${Math.round(value)}`;

/** Easing names, shared by loader and reveal (spec "Easing presets"). */
const EASING_NAMES = {
  out: "Ease out",
  outSoft: "Ease out, soft",
  inOut: "Ease in-out",
  in: "Ease in",
  linear: "Linear",
  back: "Overshoot",
  custom: "Custom curve",
};

const GRID_EFFECTS = new Set(["dots", "hex", "binary", "mosaic"]);
const notPulse = (s: Settings) => s.effect !== "pulse";
const isGrid = (s: Settings) => GRID_EFFECTS.has(s.imageFx);

/**
 * The four curve sliders of a custom easing.
 *
 * @param prefix - `l` for the loader, `r` for the reveal.
 * @returns The four controls, shown when that easing is `custom`.
 */
function curveControls(prefix: "l" | "r"): NumberControl[] {
  const shown = (s: Settings) => (prefix === "l" ? s.lEase : s.rEase) === "custom";
  return (["x1", "y1", "x2", "y2"] as const).map((point) => ({
    kind: "number",
    key: `${prefix}${point}` as NumberKey,
    label: `Curve ${point}`,
    step: 0.01,
    format: plain,
    shown,
  }));
}

/** The Loader tab (spec 1.3). Colors have their own fields below these groups. */
export const LOADER_GROUPS: readonly ControlGroup[] = [
  {
    title: "Effect",
    controls: [
      {
        kind: "choice",
        key: "effect",
        label: "Effect",
        names: { shimmer: "Shimmer sweep", wave: "Wave, staggered", pulse: "Pulse" },
      },
    ],
  },
  {
    title: "Timing",
    controls: [
      { kind: "number", key: "lDur", label: "Duration", step: 0.05, format: seconds },
      {
        kind: "number",
        key: "lGap",
        label: "Pause between passes",
        step: 0.05,
        format: seconds,
        shown: notPulse,
      },
      { kind: "choice", key: "lEase", label: "Easing", names: EASING_NAMES },
      ...curveControls("l"),
      { kind: "choice", key: "repeat", label: "Repeat", names: { loop: "Loop", once: "Once" } },
      {
        kind: "number",
        key: "stagger",
        label: "Delay per element",
        step: 0.01,
        format: seconds,
        shown: (s) => s.effect === "wave",
      },
    ],
  },
  {
    title: "Shape",
    controls: [
      {
        kind: "number",
        key: "angle",
        label: "Sweep angle",
        step: 5,
        format: degrees,
        shown: notPulse,
      },
      {
        kind: "number",
        key: "lWidth",
        label: "Highlight width",
        step: 2,
        format: percent,
        shown: notPulse,
      },
      {
        kind: "number",
        key: "depth",
        label: "Pulse depth",
        step: 0.05,
        format: plain,
        shown: (s) => s.effect === "pulse",
      },
      { kind: "number", key: "radius", label: "Bar corner radius", step: 1, format: pixels },
    ],
  },
];

/** The Reveal tab (spec 1.4). */
export const REVEAL_GROUPS: readonly ControlGroup[] = [
  {
    title: "Image",
    controls: [
      {
        kind: "choice",
        key: "imageFx",
        label: "Image reveal",
        names: {
          dots: "Variable-size dots",
          hex: "Hex characters",
          binary: "Binary characters",
          mosaic: "Mosaic squares",
          blur: "Blur-up",
          crossfade: "Crossfade",
          wipe: "Wipe",
          zoom: "Zoom in",
        },
      },
      {
        kind: "choice",
        key: "origin",
        label: "Origin",
        names: {
          left: "Left",
          right: "Right",
          top: "Top",
          bottom: "Bottom",
          center: "Center",
          diagonal: "Diagonal",
          random: "Random",
        },
        shown: (s) => isGrid(s) || s.imageFx === "wipe",
      },
      { kind: "number", key: "cols", label: "Grid columns", step: 2, format: whole, shown: isGrid },
      {
        kind: "number",
        key: "startScale",
        label: "Start scale",
        step: 0.1,
        format: times,
        shown: isGrid,
      },
      {
        kind: "number",
        key: "spread",
        label: "Cell stagger spread",
        step: 0.05,
        format: plain,
        shown: isGrid,
      },
    ],
  },
  {
    title: "Text",
    controls: [
      {
        kind: "choice",
        key: "textFx",
        label: "Text reveal",
        names: {
          scramble: "Scramble",
          typewriter: "Typewriter",
          rise: "Rise and sharpen",
          fade: "Fade",
        },
      },
      {
        kind: "choice",
        key: "charset",
        label: "Scramble characters",
        names: { hex: "Hex", binary: "Binary", symbols: "Symbols", dots: "Dots" },
        shown: (s) => s.textFx === "scramble",
      },
      {
        kind: "choice",
        key: "unit",
        label: "Resolve by",
        names: { char: "Character", word: "Word" },
        shown: (s) => s.textFx === "scramble",
      },
    ],
  },
  {
    title: "Timing",
    controls: [
      { kind: "number", key: "rDur", label: "Reveal duration", step: 0.05, format: seconds },
      { kind: "choice", key: "rEase", label: "Easing", names: EASING_NAMES },
      ...curveControls("r"),
      {
        kind: "number",
        key: "hold",
        label: "Loading time before reveal",
        step: 0.1,
        format: seconds,
      },
    ],
  },
];

/** Every Loader-tab key, including the colors: changing one shows the Loading view again. */
export const LOADER_KEYS: ReadonlySet<string> = new Set([
  ...LOADER_GROUPS.flatMap((group) => group.controls.map((control) => control.key)),
  "baseColor",
  "highlightColor",
]);
