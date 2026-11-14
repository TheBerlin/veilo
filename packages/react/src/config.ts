// config.ts: turns the React props that choose an effect (a preset, settings overrides, a layout)
// into the one input core's createReveal and createSkeleton accept.

import { LAYOUT_VERSION, type Layout, type Settings } from "@veilo/core";
import { presetSettings, type PresetId } from "@veilo/presets";

/** What a component or hook animates: a preset, settings, a layout, or a mix. */
export interface RevealConfig {
  /** A built-in preset. Replaces the layout's settings; `settings` still apply on top. */
  preset?: PresetId;
  /** Settings to apply last, over the preset or the layout's settings. */
  settings?: Partial<Settings>;
  /** A layout: base settings plus slot hints for the `data-veilo-slot` elements. */
  layout?: Layout;
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
 * A stable key for a config, so a hook re-creates its reveal only when the effect really
 * changed, not when a parent re-renders with a new but equal object.
 *
 * @param config - The preset, settings and layout.
 * @returns A string that is equal for equal configs.
 */
export function configKey(config: RevealConfig): string {
  return JSON.stringify(resolveConfig(config));
}
