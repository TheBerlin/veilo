// index.ts: the public entry `@veilo-ui/presets`. The named presets of spec section 1.5 as data,
// plus helpers that turn a preset into complete settings and find the preset that matches some.
// Settings are checked by core's parseSettings, so a preset can never hold a value core rejects.

import { LAYOUT_VERSION, type Layout } from "@veilo-ui/core";
import { parseSettings, type Settings } from "@veilo-ui/core/loader";

/** The id of a built-in preset, in kebab case (used in URLs and the `preset` attribute later). */
export type PresetId =
  | "dot-upscale"
  | "hex-from-center"
  | "matrix-columns"
  | "cascade-wave"
  | "soft-pulse"
  | "compact-shimmer"
  | "mosaic-from-edge";

/** A named set of settings: the values that differ from the defaults. */
export interface Preset {
  /** Stable id. */
  readonly id: PresetId;
  /** Display name, as on the playground's chips. */
  readonly name: string;
  /** Overrides applied over the default settings. Never holds colors. */
  readonly settings: Readonly<Partial<Settings>>;
}

/**
 * The built-in presets, in the spec's order. The first one is the defaults.
 * Some values equal the defaults (for example `stagger: 0.12`); they are kept so each row reads
 * like the spec's table.
 */
export const PRESETS: readonly Preset[] = [
  { id: "dot-upscale", name: "Dot upscale", settings: {} },
  {
    id: "hex-from-center",
    name: "Hex from center",
    settings: {
      imageFx: "hex",
      origin: "center",
      cols: 70,
      charset: "hex",
      unit: "word",
      rDur: 1.6,
    },
  },
  {
    id: "matrix-columns",
    name: "Matrix columns",
    settings: {
      imageFx: "binary",
      origin: "left",
      cols: 84,
      charset: "binary",
      unit: "char",
      rDur: 1.4,
    },
  },
  {
    id: "cascade-wave",
    name: "Cascade wave",
    settings: {
      effect: "wave",
      lDur: 1,
      lGap: 0.4,
      stagger: 0.12,
      imageFx: "wipe",
      origin: "left",
      textFx: "rise",
      rDur: 1,
      rEase: "out",
    },
  },
  {
    id: "soft-pulse",
    name: "Soft pulse",
    settings: {
      effect: "pulse",
      lDur: 1.4,
      depth: 0.45,
      lEase: "inOut",
      imageFx: "blur",
      textFx: "fade",
      rDur: 0.9,
      rEase: "out",
    },
  },
  {
    id: "compact-shimmer",
    name: "Compact shimmer",
    settings: {
      effect: "shimmer",
      lDur: 1.2,
      lGap: 0,
      repeat: "once",
      imageFx: "crossfade",
      textFx: "fade",
      rDur: 0.6,
      rEase: "out",
    },
  },
  {
    id: "mosaic-from-edge",
    name: "Mosaic from edge",
    settings: {
      imageFx: "mosaic",
      origin: "diagonal",
      cols: 36,
      startScale: 1.6,
      spread: 0.5,
      textFx: "typewriter",
      rDur: 1.5,
    },
  },
];

/**
 * Finds a built-in preset by id.
 *
 * @param id - A preset id; any string is accepted, for ids read from URLs or attributes.
 * @returns The preset, or `undefined` for an unknown id.
 */
export function findPreset(id: string): Preset | undefined {
  return PRESETS.find((preset) => preset.id === id);
}

/**
 * The complete settings of a preset: its overrides over the defaults, with no colors.
 *
 * @param preset - A preset, or the id of a built-in one.
 * @returns New settings (a fresh object each call), or `undefined` for an unknown id.
 */
export function presetSettings(preset: Preset | string): Settings | undefined {
  const found = typeof preset === "string" ? findPreset(preset) : preset;
  return found && parseSettings(found.settings).settings;
}

/**
 * Finds the built-in preset whose complete settings equal the given ones exactly.
 * Any custom color means no match, because presets clear colors.
 *
 * @param settings - Complete settings, for example the playground's current ones.
 * @returns The matching preset, or `undefined` when none matches.
 */
export function matchingPreset(settings: Settings): Preset | undefined {
  const keys = Object.keys(settings) as (keyof Settings)[];
  return PRESETS.find((preset) => {
    const full = presetSettings(preset) as Settings;
    // Same key count catches colors, which only appear when set.
    return (
      Object.keys(full).length === keys.length && keys.every((key) => full[key] === settings[key])
    );
  });
}

/**
 * A layout as you write it: like core's `Layout`, but `settings` may hold only the keys you
 * change. Core fills in the rest, so the layout JSON of the playground can be pasted as it is.
 */
export type LayoutInput = Omit<Layout, "settings"> & { settings?: Partial<Settings> };

/**
 * What a component, directive or element animates: a preset, settings, a layout, or a mix. Every
 * Veilo wrapper (React, Vue, Svelte, Angular, the web components) takes this same shape.
 */
export interface RevealConfig {
  /** A built-in preset. Replaces the layout's settings; `settings` still apply on top. */
  preset?: PresetId;
  /** Settings to apply last, over the preset or the layout's settings. */
  settings?: Partial<Settings>;
  /** A layout: base settings plus slot hints for the `data-veilo-slot` elements. */
  layout?: LayoutInput;
}

/**
 * Combines a config into core's input. Order, lowest first: the layout's settings, the preset
 * (which replaces them), then `settings`. Core validates and clamps the result, so unknown or
 * out-of-range values are safe.
 *
 * @param config - The preset, settings and layout.
 * @returns A layout when slot hints were given, otherwise plain settings, so core guesses roles
 *   from the elements as it does for plain settings.
 */
export function resolveConfig(config: RevealConfig): Layout | Partial<Settings> {
  const base = config.preset
    ? (presetSettings(config.preset) ?? {})
    : (config.layout?.settings ?? {});
  const settings = { ...base, ...config.settings };
  if (!config.layout) return settings;
  return { version: LAYOUT_VERSION, settings: settings as Settings, slots: config.layout.slots };
}

/**
 * A stable key for a config, so a wrapper re-creates its effect only when the effect really
 * changed, not when it receives a new but equal object.
 *
 * @param config - The preset, settings and layout.
 * @returns A string that is equal for equal configs.
 */
export function configKey(config: RevealConfig): string {
  return JSON.stringify(resolveConfig(config));
}
