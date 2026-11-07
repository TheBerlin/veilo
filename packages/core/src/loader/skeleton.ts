// skeleton.ts: shows the loader on real elements while their content loads.
// Layer 2. Adds one stylesheet and a few attributes, all undone by stop().

import { createCleanup } from "../dom/cleanup.ts";
import { addStyle } from "../dom/style.ts";
import type { SlotHint } from "../schema/layout.ts";
import { cssNumber } from "../math/number.ts";
import { parseSettings } from "../schema/validate.ts";
import { generateLoaderCss } from "./css-generator.ts";

/** Options for {@link createElementSkeleton}. */
export interface ElementSkeletonOptions {
  /** The region that is loading. It gets `aria-busy="true"` while the skeleton shows. */
  busy?: Element;
  /** Where to add the stylesheet when the elements live in a shadow root. */
  root?: ShadowRoot;
  /** Base color when the settings have no override. Defaults to `--veilo-base`, then light theme. */
  base?: string;
  /** Highlight color when the settings have no override. Defaults to `--veilo-hi`, then light theme. */
  highlight?: string;
  /**
   * Text elements that show one bar per line instead of a solid block, with their slot hints:
   * `width` is the last line's width in percent, `lines` the lines shown while it is empty.
   */
  bars?: ReadonlyMap<HTMLElement, Pick<SlotHint, "lines" | "width">>;
}

/** A skeleton loader on a set of elements. */
export interface Skeleton {
  /** Whether the skeleton is showing. */
  readonly active: boolean;
  /** Shows the skeleton. When it already shows, its animation restarts from the first frame. */
  start(): void;
  /** Hides the skeleton and restores the elements exactly. */
  stop(): void;
  /** Stops the skeleton for good; later calls to start() do nothing. */
  destroy(): void;
}

// The Veilo design system's light skeleton colors, used when the page defines no --veilo-base or --veilo-hi.
const DEFAULT_BASE = "var(--veilo-base, #dcdcdc)";
const DEFAULT_HIGHLIGHT = "var(--veilo-hi, #f7f7f7)";

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
 * @param selector - The skeleton's selector.
 * @param radius - The corner radius, a CSS length.
 * @returns The CSS rules.
 */
function barsCss(selector: string, radius: string): string {
  const bars = `${selector}[data-veilo-bars]`;
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
    `${bars} {`,
    `  --veilo-bar-r: min(${radius}, calc((1lh - 0.36em) / 2));`,
    "  --veilo-bar-top: calc(0.18em + var(--veilo-bar-r));",
    "  --veilo-bar-bottom: calc(1lh - 0.18em - var(--veilo-bar-r));",
    `  mask: ${layers.join(", ")};`,
    `  mask-composite: ${composite.join(", ")};`,
    "  mask-origin: content-box;",
    "}",
    `${bars}:empty { min-height: calc(var(--veilo-lines, 1) * 1lh); }`,
  ].join("\n");
}

/**
 * Creates a skeleton loader for elements.
 *
 * Each element becomes a placeholder: its text turns transparent and the generated shimmer,
 * wave or pulse runs on its background. Images, canvases and videos hide their picture but keep
 * their size. Elements get `aria-hidden` and `--i` (their index, for the wave delay). With
 * reduced motion the placeholder stays still.
 *
 * @example
 * ```ts
 * const skeleton = createElementSkeleton([photo, title, price], { effect: "wave" }, { busy: card });
 * skeleton.start(); // while loading
 * skeleton.stop();  // when the content is ready
 * ```
 *
 * @param elements - The placeholders, in wave order.
 * @param settings - Settings as plain JSON. Validated and clamped; only Loader keys are used.
 * @param options - Busy region, shadow root and fallback colors.
 * @returns The skeleton, not yet showing.
 */
export function createElementSkeleton(
  elements: readonly HTMLElement[],
  settings: unknown,
  options: ElementSkeletonOptions = {},
): Skeleton {
  const parsed = parseSettings(settings).settings;
  const cleanup = createCleanup();
  let active = false;
  let destroyed = false;

  const stop = () => {
    cleanup.run();
    active = false;
  };

  return {
    get active() {
      return active;
    },

    start() {
      if (destroyed) return;
      stop();
      // A new id on every start gives new keyframes, which makes the animation restart.
      const id = Math.random().toString(36).slice(2, 10);
      const selector = `[data-veilo-skeleton="${id}"]`;
      const css = [
        generateLoaderCss(parsed, {
          selector,
          keyframes: `veilo-skeleton-${id}`,
          base: options.base ?? DEFAULT_BASE,
          highlight: options.highlight ?? DEFAULT_HIGHLIGHT,
        }),
        // Hides the real text even when the element sets its color inline, which would beat
        // the generated rule's `color: transparent`.
        `${selector} { color: transparent !important; }`,
        // Moves the picture out of the box, so the placeholder background shows instead.
        `${selector}:is(img, canvas, video) { object-position: -99999px 0; }`,
        barsCss(selector, `${cssNumber(parsed.radius)}px`),
        "",
      ].join("\n");

      elements.forEach((element, index) => {
        cleanup.attribute(element, "data-veilo-skeleton", id);
        cleanup.attribute(element, "aria-hidden", "true");
        cleanup.style(element, "--i", String(index));
      });
      for (const [element, hint] of options.bars ?? []) {
        cleanup.attribute(element, "data-veilo-bars", "");
        if (hint.width !== undefined) cleanup.style(element, "--veilo-last", `${hint.width}%`);
        if (hint.lines !== undefined) cleanup.style(element, "--veilo-lines", String(hint.lines));
      }
      if (options.busy) cleanup.attribute(options.busy, "aria-busy", "true");
      cleanup.add(addStyle(css, options.root));
      active = true;
    },

    stop,

    destroy() {
      stop();
      destroyed = true;
    },
  };
}
