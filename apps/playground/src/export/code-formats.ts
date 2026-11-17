// code-formats.ts: the formats of the Export tab's Code section and the text each one shows for
// the current settings and card. Pure: the theme colors the CSS needs come in as an argument.

import { defaultSettings, generateLoaderCss, type Settings } from "@veilo/core";
import { CARD_LAYOUTS } from "../stage/card-layouts.ts";
import type { Content } from "../state/content-store.ts";
import {
  cdnSnippet,
  changedSettings,
  elementSnippet,
  layoutJson,
  reactSnippet,
  svelteSnippet,
  vueSnippet,
  vanillaSnippet,
  type SnippetInput,
} from "./snippets.ts";

/** The id of a code format. */
export type CodeFormatId =
  "settings" | "css" | "layout" | "vanilla" | "react" | "vue" | "svelte" | "element" | "cdn";

/** One format the Code section can show. */
export interface CodeFormat {
  /** The format's id. */
  id: CodeFormatId;
  /** The name in the select and the code block's accessible name. */
  label: string;
  /** Whether the code imports a package, which is not on npm yet. */
  usesPackage: boolean;
}

/** The formats in the order the select lists them. */
export const CODE_FORMATS: readonly CodeFormat[] = [
  { id: "settings", label: "Settings JSON", usesPackage: false },
  { id: "css", label: "Loader CSS", usesPackage: false },
  { id: "layout", label: "Layout JSON", usesPackage: false },
  { id: "vanilla", label: "Vanilla JS", usesPackage: true },
  { id: "react", label: "React", usesPackage: true },
  { id: "vue", label: "Vue", usesPackage: true },
  { id: "svelte", label: "Svelte", usesPackage: true },
  { id: "element", label: "Web component", usesPackage: true },
  { id: "cdn", label: "CDN", usesPackage: true },
];

/** The format shown first. */
export const DEFAULT_CODE_FORMAT: CodeFormatId = "settings";

/**
 * The settings as the Export tab shows them: every key, two-space indented.
 *
 * @param settings - The current settings.
 * @returns The JSON text.
 */
export function settingsJson(settings: Settings): string {
  return JSON.stringify(settings, null, 2);
}

/**
 * The loader as plain CSS for the default `.skeleton` class, with the theme's colors resolved to
 * hex values where nothing is picked (spec 1.6).
 *
 * @param settings - The current settings.
 * @param base - The theme's base color.
 * @param highlight - The theme's highlight color.
 * @returns The CSS text.
 */
export function loaderCss(settings: Settings, base: string, highlight: string): string {
  return generateLoaderCss(settings, { selector: ".skeleton", base, highlight });
}

/** What {@link codeFor} reads: the current settings and card, and the theme's loader colors. */
export interface CodeContext {
  /** The current settings. */
  settings: Settings;
  /** The current preview content: layout, text and width. */
  content: Content;
  /** The theme's skeleton base color, as hex. */
  base: string;
  /** The theme's skeleton highlight color, as hex. */
  highlight: string;
}

/**
 * Builds the text of one format. The snippets and the layout JSON carry only the settings that
 * differ from the defaults, which core fills in again.
 *
 * @param format - The format.
 * @param context - The settings, content and theme colors.
 * @returns The code to show.
 */
export function codeFor(format: CodeFormatId, context: CodeContext): string {
  const { settings, content } = context;
  if (format === "settings") return settingsJson(settings);
  if (format === "css") return loaderCss(settings, context.base, context.highlight);
  const input: SnippetInput = {
    layoutId: content.layout,
    texts: content.texts[content.layout],
    width: content.widths[content.layout] ?? CARD_LAYOUTS[content.layout].width,
    settings: changedSettings(settings, defaultSettings()),
  };
  switch (format) {
    case "layout":
      return layoutJson(input);
    case "vanilla":
      return vanillaSnippet(input);
    case "react":
      return reactSnippet(input);
    case "vue":
      return vueSnippet(input);
    case "svelte":
      return svelteSnippet(input);
    case "element":
      return elementSnippet(input);
    case "cdn":
      return cdnSnippet(input);
  }
}
