/**
 * css-generator.ts: turns the Loader settings into plain CSS.
 * Layer 2 (pure). Touches no DOM or canvas, so it also runs on a server and at build time.
 */

import { resolveCurve } from "../math/easing.ts";
import { cssNumber } from "../math/number.ts";
import type { Settings } from "../schema/types.ts";

/** Options for {@link generateLoaderCss}. */
export interface LoaderCssOptions {
  /** The CSS selector to style. Written to the output as is, so it must be trusted. */
  selector?: string;
  /** Base color when the settings have no override. Defaults to `var(--sk-base)`. */
  base?: string;
  /** Highlight color when the settings have no override. Defaults to `var(--sk-hi)`. */
  highlight?: string;
  /**
   * The `@keyframes` name. Defaults to `sk-sweep` or `sk-pulse`. Give each stylesheet on one
   * page its own name, or the last one's keyframes apply to all. Written as is, so it must be
   * trusted.
   */
  keyframes?: string;
}

const WAVE_NOTE = "/* Set --i on each element: 0, 1, 2... Each one starts later than the last. */";

/**
 * Builds the sweep rule and keyframes, used by shimmer and wave.
 *
 * @param settings - The settings.
 * @param base - The base color.
 * @param highlight - The highlight color.
 * @param easing - The CSS timing function.
 * @param iterations - The CSS iteration count.
 * @param name - The keyframes name.
 * @returns The declarations and the keyframes.
 */
function sweepCss(
  settings: Settings,
  base: string,
  highlight: string,
  easing: string,
  iterations: string,
  name: string,
) {
  const { angle, lDur, lGap, lWidth, stagger, effect } = settings;
  const total = lDur + lGap;
  // The sweep takes lDur of each pass. The rest of the pass holds still, which is the pause.
  const sweepEnd = (lDur / total) * 100;
  const bandStart = cssNumber(50 - lWidth / 2);
  const bandEnd = cssNumber(50 + lWidth / 2);
  const delay = effect === "wave" ? `calc(var(--i, 0) * ${cssNumber(stagger)}s)` : "0s";

  const declarations = [
    `background: linear-gradient(${cssNumber(angle)}deg, ${base} 0%, ${base} ${bandStart}%, ${highlight} 50%, ${base} ${bandEnd}%, ${base} 100%);`,
    // Three times wider, so the band enters and leaves fully. Both ends are the base color,
    // which hides the restart.
    "background-size: 300% 100%;",
    "background-position: 100% 0;",
    `animation: ${name} ${cssNumber(total)}s ${easing} ${delay} ${iterations} both;`,
  ];
  const keyframes = [
    `@keyframes ${name} {`,
    "  0% { background-position: 100% 0; }",
    `  ${cssNumber(sweepEnd)}% { background-position: 0% 0; }`,
    "  100% { background-position: 0% 0; }",
    "}",
  ];
  return { declarations, keyframes };
}

/**
 * Builds the pulse rule and keyframes.
 *
 * @param settings - The settings.
 * @param base - The base color.
 * @param easing - The CSS timing function.
 * @param iterations - The CSS iteration count.
 * @param name - The keyframes name.
 * @returns The declarations and the keyframes.
 */
function pulseCss(
  settings: Settings,
  base: string,
  easing: string,
  iterations: string,
  name: string,
) {
  const { lDur, depth } = settings;
  const declarations = [
    `background: ${base};`,
    `animation: ${name} ${cssNumber(lDur)}s ${easing} ${iterations} both;`,
  ];
  const keyframes = [
    `@keyframes ${name} {`,
    "  0%, 100% { opacity: 1; }",
    `  50% { opacity: ${cssNumber(depth)}; }`,
    "}",
  ];
  return { declarations, keyframes };
}

/**
 * Generates the CSS for the loader described by the settings.
 *
 * Color overrides are written to the output as is, so the settings must come from
 * `parseSettings`, which checks their format, when they arrive from outside.
 *
 * @param settings - The settings. Only the Loader keys are read.
 * @param options - The selector and fallback colors. For the Export panel, pass the theme's
 * hex values to resolve the colors. Without them the CSS follows `--sk-base` and `--sk-hi`.
 * @returns A stylesheet with one rule and its keyframes.
 */
export function generateLoaderCss(settings: Settings, options: LoaderCssOptions = {}): string {
  const { selector = ".skeleton", base, highlight, keyframes: name } = options;
  const baseColor = settings.baseColor ?? base ?? "var(--sk-base)";
  const highlightColor = settings.highlightColor ?? highlight ?? "var(--sk-hi)";
  const easing = `cubic-bezier(${resolveCurve(settings, "l").map(cssNumber).join(", ")})`;
  const iterations = settings.repeat === "loop" ? "infinite" : "1";

  const { declarations, keyframes } =
    settings.effect === "pulse"
      ? pulseCss(settings, baseColor, easing, iterations, name ?? "sk-pulse")
      : sweepCss(settings, baseColor, highlightColor, easing, iterations, name ?? "sk-sweep");

  const rule = [
    `${selector} {`,
    "  color: transparent;",
    `  border-radius: ${cssNumber(settings.radius)}px;`,
    ...declarations.map((line) => `  ${line}`),
    "}",
  ];
  const note = settings.effect === "wave" ? [WAVE_NOTE] : [];
  return [...note, ...rule, "", ...keyframes, ""].join("\n");
}
