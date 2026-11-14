// skeleton.ts: shows the loader on real elements while their content loads.
// Layer 2. Adds one stylesheet and a few attributes, all undone by stop().

import { createCleanup } from "../dom/cleanup.ts";
import { addStyle } from "../dom/style.ts";
import type { SlotHint } from "../schema/layout.ts";
import { parseSettings } from "../schema/validate.ts";
import { skeletonCss } from "./skeleton-css.ts";

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
      const css = skeletonCss(parsed, {
        selector,
        bars: `${selector}[data-veilo-bars]`,
        keyframes: `veilo-skeleton-${id}`,
        base: options.base,
        highlight: options.highlight,
      });

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
