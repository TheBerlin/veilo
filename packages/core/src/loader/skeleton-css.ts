// skeleton-css.ts: the skeleton stylesheet as a pure string, for the live skeleton on real
// elements and for servers that render the skeleton before any script runs.
// Layer 2. Pure: no DOM access, so it is part of the browser-free `@veilo-ui/core/loader` entry.

import { cssNumber } from "../math/number.ts";
import { GUESSED_ROLE_TAGS, parseLayout } from "../schema/layout.ts";
import type { Settings } from "../schema/types.ts";
import { generateLoaderCss } from "./css-generator.ts";

// The Veilo design system's light skeleton colors, used when the page defines no --veilo-base or --veilo-hi.
const DEFAULT_BASE = "var(--veilo-base, #d4d4d4)";
const DEFAULT_HIGHLIGHT = "var(--veilo-hi, #f8f8f8)";

/** Where a bar's mask layers sit: their vertical position and repeat. */
interface BarPlacement {
  /** Vertical position, such as `0` or `100%`. */
  y: string;
  /** `repeat-y` for every line, `no-repeat` for one. */
  repeat: string;
}

/**
 * One rounded bar per line of text, as mask layers: four corner circles and two bands (one
 * between the top and bottom corners at full width, one between the left and right corners at
 * full bar height). Each layer is `width` wide and one line tall.
 *
 * @param width - The bar width, such as `100%` or `var(--veilo-last, 100%)`.
 * @param place - Position and repeat: every line from the top, or only the bottom line.
 * @returns Six mask layers.
 */
function roundedBarLayers(width: string, place: BarPlacement): string[] {
  const r = "var(--veilo-bar-r)";
  const top = "var(--veilo-bar-top)";
  const bottom = "var(--veilo-bar-bottom)";
  const tile = (x: string, w: string) => `${x} ${place.y} / ${w} 1lh ${place.repeat}`;
  // The circle edge fades over half a pixel, so the corners are smooth.
  const corner = (x: string, y: string) =>
    `radial-gradient(circle ${r} at ${x} ${y}, #000 calc(100% - 0.5px), transparent 100%) ${tile("0", width)}`;
  return [
    corner(r, top),
    corner(`calc(100% - ${r})`, top),
    corner(r, bottom),
    corner(`calc(100% - ${r})`, bottom),
    // Full width, between the top and bottom corners.
    `linear-gradient(transparent 0 ${top}, #000 0 ${bottom}, transparent 0) ${tile("0", width)}`,
    // Full bar height (inset 0.18em), between the left and right corners.
    `linear-gradient(transparent 0 0.18em, #000 0 calc(1lh - 0.18em), transparent 0) ${tile(r, `calc(${width} - 2 * ${r})`)}`,
  ];
}

/**
 * Shapes text placeholders into one rounded bar per line.
 *
 * Every line is a bar inset by 0.18em top and bottom, as in the spec's card, with its corners
 * rounded by `radius` (at most half the bar height). All lines are full width except the last,
 * which is `--veilo-last` wide and rounded at its own end. The mask sits in the content box, so
 * padding stays empty. An empty element is given `--veilo-lines` lines of height, so it does not
 * collapse while its text is missing. Browsers without the `lh` unit drop the mask and show a
 * solid block instead.
 *
 * @param bars - The selector of the text placeholders; wrapped in `:is()`, so it may be a list.
 * @param radius - The corner radius, a CSS length.
 * @returns The CSS rules.
 */
function barsCss(bars: string, radius: string): string {
  const last = roundedBarLayers("var(--veilo-last, 100%)", { y: "100%", repeat: "no-repeat" });
  const lines = roundedBarLayers("100%", { y: "0", repeat: "repeat-y" });
  // Layers are listed top first, and each is composited with everything below it: the line bars
  // are joined, cut to all lines but the last, and then the last line's bar is added.
  const layers = [
    ...last,
    // All lines but the last. Full size and transparent at the bottom, because a layer of zero
    // height (a one-line element) is skipped instead of hiding everything below it.
    "linear-gradient(#000 calc(100% - 1lh), transparent 0)",
    ...lines,
  ];
  const composite = [...last.map(() => "add"), "intersect", ...lines.map(() => "add")];
  return [
    `:is(${bars}) {`,
    `  --veilo-bar-r: min(${radius}, calc((1lh - 0.36em) / 2));`,
    "  --veilo-bar-top: calc(0.18em + var(--veilo-bar-r));",
    "  --veilo-bar-bottom: calc(1lh - 0.18em - var(--veilo-bar-r));",
    `  mask: ${layers.join(", ")};`,
    `  mask-composite: ${composite.join(", ")};`,
    "  mask-origin: content-box;",
    "}",
    `:is(${bars}):empty { min-height: calc(var(--veilo-lines, 1) * 1lh); }`,
  ].join("\n");
}

/** Where {@link skeletonCss} applies, and how it is named and colored. */
export interface SkeletonCssOptions {
  /** The placeholders. */
  selector: string;
  /** The placeholders that show one bar per line (text). Omit for solid placeholders only. */
  bars?: string;
  /** The keyframes name; unique per stylesheet, so animations restart independently. */
  keyframes: string;
  /** Base color when the settings have no override. */
  base?: string;
  /** Highlight color when the settings have no override. */
  highlight?: string;
  /** Overrides `prefers-reduced-motion`, as in `generateLoaderCss`. Defaults to following it. */
  reducedMotion?: boolean;
}

/**
 * The whole skeleton stylesheet: the loader animation, hidden text, hidden pictures and line
 * bars. The live skeleton (`createElementSkeleton`) and the server stylesheet both use it, so
 * the two always look the same.
 *
 * @param settings - Parsed settings; only the Loader keys and `radius` are used.
 * @param options - Selectors, keyframes name and fallback colors.
 * @returns The CSS, ending with a newline.
 */
export function skeletonCss(settings: Settings, options: SkeletonCssOptions): string {
  const { selector } = options;
  return [
    generateLoaderCss(settings, {
      selector,
      keyframes: options.keyframes,
      base: options.base ?? DEFAULT_BASE,
      highlight: options.highlight ?? DEFAULT_HIGHLIGHT,
      reducedMotion: options.reducedMotion,
    }),
    // Hides the real text even when the element sets its color inline, which would beat the
    // generated rule's `color: transparent`.
    `${selector} { color: transparent !important; }`,
    // Moves the picture out of the box, so the placeholder background shows instead.
    `${selector}:is(img, canvas, video) { object-position: -99999px 0; }`,
    options.bars ? barsCss(options.bars, `${cssNumber(settings.radius)}px`) : "",
    "",
  ].join("\n");
}

/** Options of {@link serverSkeletonCss}. */
export interface ServerSkeletonCssOptions {
  /**
   * `true` when the scope element is itself the one placeholder (a solid block), instead of a
   * container whose `data-veilo-slot` elements are the placeholders.
   */
  self?: boolean;
  /** Base color when the settings have no override. Defaults to `--veilo-base`, then light. */
  base?: string;
  /** Highlight color when the settings have no override. Defaults to `--veilo-hi`, then light. */
  highlight?: string;
}

/**
 * Quotes a string for a CSS attribute selector value.
 *
 * @param value - Any string, such as a slot name.
 * @returns The value in double quotes, with quotes, backslashes and line breaks escaped, and `<`
 *   as `\3c ` so the CSS can sit inside an HTML `<style>` without a name closing the tag.
 */
function cssString(value: string): string {
  const escaped = value.replace(/["\\]/g, "\\$&").replace(/\n/g, "\\a ").replace(/</g, "\\3c ");
  return `"${escaped}"`;
}

/**
 * A keyframes name that is a valid CSS identifier for any scope.
 *
 * @param scope - The scope selector.
 * @returns `veilo-ssr-` plus a short hash of the scope.
 */
function keyframesFor(scope: string): string {
  let hash = 0;
  for (const char of scope) hash = (Math.imul(hash, 31) + (char.codePointAt(0) ?? 0)) | 0;
  return `veilo-ssr-${(hash >>> 0).toString(36)}`;
}

/**
 * The skeleton stylesheet for server-rendered markup, before any script runs. Put it in a
 * `<style>` next to the markup; when the live skeleton (`createSkeleton` or `createReveal`)
 * takes over, remove the style and the scope. It looks the same, with three limits: the wave
 * runs in step (the `--i` index is set by script), roles of unnamed slots are guessed from the
 * tag alone, and placeholders are not `aria-hidden` yet.
 *
 * Inside the scope, every `data-veilo-slot` element is a placeholder. Text slots, named `text`
 * in the layout or unnamed and not an image, canvas, button or video, show one bar per line,
 * with the layout's `width` and `lines` hints.
 *
 * @example
 * ```ts
 * const css = serverSkeletonCss(layout, '[data-skeleton="card-1"]');
 * // <style>{css}</style><article data-skeleton="card-1">...</article>
 * ```
 *
 * @param input - Settings or a layout, as plain JSON. Validated and clamped like `parseLayout`.
 * @param scope - A selector for the container, or for the single placeholder with `self`.
 * @param options - Whether the scope is itself the placeholder, and fallback colors.
 * @returns The CSS.
 */
export function serverSkeletonCss(
  input: unknown,
  scope: string,
  options: ServerSkeletonCssOptions = {},
): string {
  const { settings, slots } = parseLayout(input);
  const shared = {
    keyframes: keyframesFor(scope),
    base: options.base,
    highlight: options.highlight,
  };
  if (options.self) return skeletonCss(settings, { ...shared, selector: scope });

  const slot = `${scope} [data-veilo-slot]`;
  const named = Object.entries(slots);
  const nameSelector = (name: string) => `${scope} [data-veilo-slot=${cssString(name)}]`;
  // Unnamed slots are text unless their tag says otherwise, as when guessing on real elements.
  const otherTags = Object.values(GUESSED_ROLE_TAGS).flat().join(", ");
  const exclusions = [otherTags, ...named.map(([name]) => `[data-veilo-slot=${cssString(name)}]`)];
  const guessedText = `${slot}:not(${exclusions.join(", ")})`;
  const namedText = named.filter(([, hint]) => hint.role === "text" || hint.role === undefined);
  // A named slot without a role is guessed too; its tag decides, so the tag exclusion applies.
  const textSelectors = [
    guessedText,
    ...namedText.map(([name, hint]) =>
      hint.role === "text" ? nameSelector(name) : `${nameSelector(name)}:not(${otherTags})`,
    ),
  ];
  // Per-slot hints, as the live skeleton sets them inline.
  const hints = namedText
    .filter(([, hint]) => hint.width !== undefined || hint.lines !== undefined)
    .map(([name, hint]) => {
      const rules = [
        hint.width !== undefined ? `--veilo-last: ${hint.width}%;` : "",
        hint.lines !== undefined ? `--veilo-lines: ${hint.lines};` : "",
      ].filter(Boolean);
      return `${nameSelector(name)} { ${rules.join(" ")} }`;
    });
  return (
    skeletonCss(settings, { ...shared, selector: slot, bars: textSelectors.join(", ") }) +
    (hints.length ? `${hints.join("\n")}\n` : "")
  );
}
