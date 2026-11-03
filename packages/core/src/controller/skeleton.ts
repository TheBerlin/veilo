/**
 * skeleton.ts: createSkeleton, the public loader for a list of elements or a container with
 * slot markup.
 * Layer 3. Finds the slots, then hands the elements to the loader in loader/skeleton.ts.
 */

import {
  createElementSkeleton,
  type ElementSkeletonOptions,
  type Skeleton,
} from "../loader/skeleton.ts";
import { parseLayout } from "../schema/layout.ts";
import { isDevBuild } from "../slots/dev-warnings.ts";
import { resolveTargets } from "./targets.ts";

export type { Skeleton } from "../loader/skeleton.ts";

/** Options for {@link createSkeleton}. */
export interface SkeletonOptions extends ElementSkeletonOptions {
  /** Print slot mismatches to the console. Defaults to on in development builds only. */
  warnings?: boolean;
}

/**
 * Creates a skeleton loader for elements, or for the slots in a container.
 *
 * Each element becomes a placeholder: its text turns transparent and the generated shimmer,
 * wave or pulse runs on its background. Images, canvases and videos hide their picture but keep
 * their size. Elements get `aria-hidden` and `--i` (their index, for the wave delay). With
 * reduced motion the placeholder stays still. Given a container, every `data-veilo-slot` element
 * in it is a placeholder, in page order, and the container is the default busy region; its text
 * slots show one bar per line, shaped by their `lines` and `width` hints.
 *
 * @example
 * ```ts
 * const skeleton = createSkeleton(card, { effect: "wave" });
 * skeleton.start(); // while loading
 * skeleton.stop();  // when the content is ready
 * ```
 *
 * @param target - The placeholders in wave order, or a container with slot markup.
 * @param settings - A layout or plain settings, as JSON. Validated and clamped; only Loader keys
 *   are used.
 * @param options - Busy region, shadow root, fallback colors and warnings.
 * @returns The skeleton, not yet showing.
 */
export function createSkeleton(
  target: readonly HTMLElement[] | Element,
  settings: unknown,
  options: SkeletonOptions = {},
): Skeleton {
  // A plain list does not say which elements are text, so they stay solid placeholders.
  if (Array.isArray(target)) {
    return createElementSkeleton(target, parseLayout(settings).settings, options);
  }
  const resolved = resolveTargets(target as Element, settings, options.warnings ?? isDevBuild());
  return createElementSkeleton(resolved.placeholders, resolved.settings, {
    ...options,
    busy: options.busy ?? resolved.container,
    bars: resolved.bars,
  });
}
