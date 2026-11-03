/**
 * skeleton.ts: shows the loader on real elements while their content loads.
 * Layer 2. Adds one stylesheet and a few attributes, all undone by stop().
 */

import { createCleanup } from "../dom/cleanup.ts";
import { addStyle } from "../dom/style.ts";
import { parseSettings } from "../schema/validate.ts";
import { generateLoaderCss } from "./css-generator.ts";

/** Options for {@link createSkeleton}. */
export interface SkeletonOptions {
  /** The region that is loading. It gets `aria-busy="true"` while the skeleton shows. */
  busy?: Element;
  /** Where to add the stylesheet when the elements live in a shadow root. */
  root?: ShadowRoot;
  /** Base color when the settings have no override. Defaults to `--veilo-base`, then light theme. */
  base?: string;
  /** Highlight color when the settings have no override. Defaults to `--veilo-hi`, then light theme. */
  highlight?: string;
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

// The spec's light theme colors, used when the page defines no --veilo-base or --veilo-hi.
const DEFAULT_BASE = "var(--veilo-base, #dde5e6)";
const DEFAULT_HIGHLIGHT = "var(--veilo-hi, #f6fafa)";

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
 * const skeleton = createSkeleton([photo, title, price], { effect: "wave" }, { busy: card });
 * skeleton.start(); // while loading
 * skeleton.stop();  // when the content is ready
 * ```
 *
 * @param elements - The placeholders, in wave order.
 * @param settings - Settings as plain JSON. Validated and clamped; only Loader keys are used.
 * @param options - Busy region, shadow root and fallback colors.
 * @returns The skeleton, not yet showing.
 */
export function createSkeleton(
  elements: readonly HTMLElement[],
  settings: unknown,
  options: SkeletonOptions = {},
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
        `@media (prefers-reduced-motion: reduce) {\n  ${selector} { animation: none; }\n}`,
        "",
      ].join("\n");

      elements.forEach((element, index) => {
        cleanup.attribute(element, "data-veilo-skeleton", id);
        cleanup.attribute(element, "aria-hidden", "true");
        cleanup.style(element, "--i", String(index));
      });
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
