// config.ts: turns the element attributes that choose an effect (a preset, settings overrides, a
// layout) into the one input core's createReveal and createSkeleton accept, and reads the JSON
// attributes. The same rules as @veilo/react's config.ts.

import { LAYOUT_VERSION, type Layout, type Settings } from "@veilo/core";
import { presetSettings, type PresetId } from "@veilo/presets";

/** What an element animates: a preset, settings, a layout, or a mix. */
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
 * A stable key for a config, so an element re-creates its effect only when the effect really
 * changed, not when a property is set to a new but equal object.
 *
 * @param config - The preset, settings and layout.
 * @returns A string that is equal for equal configs.
 */
export function configKey(config: RevealConfig): string {
  return JSON.stringify(resolveConfig(config));
}

/**
 * Parses a JSON attribute (`settings`, `layout`). Invalid JSON, or JSON that is not an object,
 * is ignored with a console warning, so one typo never breaks the page.
 *
 * Side effects: logs a warning for a value that is not a JSON object.
 *
 * @param value - The attribute value, or null when the attribute is absent.
 * @returns The parsed object, or undefined when absent or invalid.
 */
export function parseJsonAttribute(value: string | null): object | undefined {
  if (value === null || value.trim() === "") return undefined;
  try {
    const parsed: unknown = JSON.parse(value);
    if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
  } catch {
    // Reported below, like a value of the wrong shape.
  }
  console.warn(`[veilo] Ignored an attribute that is not a JSON object: ${value}`);
  return undefined;
}

/** Lit attribute converter for the JSON attributes; reading only, they are never reflected. */
export const jsonAttribute = { fromAttribute: parseJsonAttribute };
