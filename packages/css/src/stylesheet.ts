// stylesheet.ts: builds the static skeleton.css from the core generator with default settings.
// Internal, not exported from index.ts. The generate script writes its output to skeleton.css,
// and a test fails when the committed file differs, so the file never drifts from the generator.

import { defaultSettings, generateLoaderCss } from "@veilo/core/loader";

/** The class every skeleton element carries, and the prefix of the effect classes. */
export const STYLESHEET_CLASS = "veilo";

/** The effects the stylesheet ships, each as the class `veilo-<effect>`. */
export const STYLESHEET_EFFECTS = ["shimmer", "wave", "pulse"] as const;

// The Veilo design system's light skeleton colors, the same fallbacks createSkeleton uses.
const BASE = "var(--veilo-base, #dcdcdc)";
const HIGHLIGHT = "var(--veilo-hi, #f7f7f7)";

/**
 * Builds the text of skeleton.css. Pure: the same output on every call.
 *
 * @returns The stylesheet: a static rule for `.veilo`, then one rule and its keyframes per effect.
 */
export function buildStylesheet(): string {
  const defaults = defaultSettings();
  const radius = `var(--veilo-radius, ${defaults.radius}px)`;
  // Without an effect class the element is a still placeholder.
  const base = [
    `.${STYLESHEET_CLASS} {`,
    "  color: transparent;",
    `  border-radius: ${radius};`,
    `  background: ${BASE};`,
    "}",
    "",
  ].join("\n");
  const effects = STYLESHEET_EFFECTS.map((effect) =>
    generateLoaderCss(
      { ...defaults, effect },
      {
        selector: `.${STYLESHEET_CLASS}.${STYLESHEET_CLASS}-${effect}`,
        base: BASE,
        highlight: HIGHLIGHT,
        radius,
        // One keyframes name per effect, so all three can be used on one page.
        keyframes: `${STYLESHEET_CLASS}-${effect}`,
      },
    ),
  );
  const header = [
    "/* @veilo/css skeleton.css. Generated from the core loader generator with default settings;",
    "   do not edit. Restyle with --veilo-base, --veilo-hi and --veilo-radius. */",
    "",
  ].join("\n");
  return [header, base, ...effects].join("\n");
}
