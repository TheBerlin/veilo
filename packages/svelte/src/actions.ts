// actions.ts: the Svelte actions `reveal` and `skeleton`, which run core's reveal or loader on
// the element they are put on. The components are thin wrappers over these.

import {
  createReveal,
  createSkeleton,
  type Reveal,
  type RevealOptions,
  type Settings,
  type Skeleton,
  type SkeletonOptions,
} from "@veilo/core";
import { configKey, resolveConfig, type RevealConfig } from "@veilo/presets";
import type { Action } from "svelte/action";

/** Parameters of the {@link reveal} action. */
export interface RevealParams extends RevealConfig {
  /**
   * Whether the content is ready. `false` shows the skeleton; turning `true` plays the reveal;
   * turning `false` again shows the skeleton again.
   */
  ready: boolean;
  /**
   * Play the reveal when `ready` is already `true` when the action starts (or after the effect
   * changes). Off by default: content that was there from the start just shows.
   */
  revealOnMount?: boolean;
  /** Core reveal options (`ink`, `fontFamily`, `reducedMotion`, ...). Read when it is created. */
  options?: RevealOptions;
  /** Called each time a reveal finishes. */
  oncomplete?: () => void;
}

/** Parameters of the {@link skeleton} action. */
export interface SkeletonParams extends RevealConfig {
  /** Whether the content is loading. `true` shows the loader; `false` restores the elements. */
  loading: boolean;
  /** Shortcut for the loader effect; wins over `preset` and `settings`. */
  effect?: Settings["effect"];
  /**
   * Put the loader on the element itself, as one solid placeholder, instead of on the
   * `data-veilo-slot` elements inside it. The escape hatch for wrapping one part.
   */
  self?: boolean;
  /** Core skeleton options (`busy`, `root`, `warnings`, fallback colors). Read when created. */
  options?: SkeletonOptions;
}

/**
 * Runs a Veilo reveal on an element that holds `data-veilo-slot` parts. While `ready` is `false`
 * the parts show the skeleton (render placeholder data meanwhile, so they have their real
 * size) and the element gets `aria-busy`; when it turns `true` the reveal plays once. Users who
 * prefer reduced motion see the content at once. The reveal is rebuilt when the effect changes
 * (compared by value) and destroyed with the element, which restores it exactly.
 *
 * Side effects: through core, adds canvases, overlays and a stylesheet while the element is on
 * the page and removes them when it goes. Actions do not run on the server.
 *
 * @param node - The element the action is put on.
 * @param params - The effect (`preset`, `settings`, `layout`), `ready`, `revealOnMount`,
 *   `options` and `oncomplete`.
 * @returns The action's `update` and `destroy` callbacks.
 */
export const reveal: Action<HTMLElement, RevealParams> = (node, params) => {
  let current = params;
  let instance: Reveal | null = null;
  let unsubscribe: (() => void) | null = null;
  let key = "";
  // The reveal `sync` last saw, and whether the content was ready then.
  let seen: { instance: Reveal | null; ready: boolean } = { instance: null, ready: params.ready };

  const stop = () => {
    unsubscribe?.();
    instance?.destroy();
    instance = null;
    unsubscribe = null;
  };

  const sync = () => {
    if (!instance) return;
    const first = seen.instance !== instance;
    const wasReady = seen.ready;
    seen = { instance, ready: current.ready };
    if (!current.ready) instance.showLoading();
    // Plays when the content has just become ready; a new reveal for content that was ready
    // already (the first one, or after an effect change) plays only when asked.
    else if (!wasReady || (first && current.revealOnMount)) void instance.play();
  };

  const start = () => {
    stop();
    key = configKey(current);
    instance = createReveal(node, resolveConfig(current), current.options);
    // The latest callback, so a new function on every update does not resubscribe.
    unsubscribe = instance.on("complete", () => current.oncomplete?.());
    sync();
  };

  start();
  return {
    update(next) {
      current = next;
      if (configKey(next) !== key) start();
      else sync();
    },
    destroy: stop,
  };
};

/**
 * Runs a Veilo loader (shimmer, wave or pulse) on an element while `loading` is `true`. By
 * default every `data-veilo-slot` element inside becomes a placeholder, text slots show one bar
 * per line, and the element gets `aria-busy`. With `self` the element itself becomes one solid
 * placeholder. Users who prefer reduced motion see a still placeholder. When loading ends, or
 * the element goes, the elements are restored exactly.
 *
 * Side effects: through core, adds inline styles and a stylesheet while loading. Actions do not
 * run on the server.
 *
 * @param node - The element the action is put on.
 * @param params - `loading`, the loader (`effect`, `preset`, `settings`, `layout`), `self` and
 *   `options`.
 * @returns The action's `update` and `destroy` callbacks.
 */
export const skeleton: Action<HTMLElement, SkeletonParams> = (node, params) => {
  let current = params;
  let instance: Skeleton | null = null;
  let key = "";

  /** The effect config: the `effect` shortcut wins over `settings`. */
  const config = (): RevealConfig => ({
    preset: current.preset,
    layout: current.layout,
    settings: { ...current.settings, ...(current.effect && { effect: current.effect }) },
  });
  const identity = () => `${current.self ? "self" : "slots"}|${configKey(config())}`;

  const sync = () => {
    if (current.loading) instance?.start();
    else instance?.stop();
  };

  const start = () => {
    instance?.destroy();
    key = identity();
    // A list keeps the element a solid placeholder; an element alone looks for slots inside.
    instance = createSkeleton(
      current.self ? [node] : node,
      resolveConfig(config()),
      current.options,
    );
    sync();
  };

  start();
  return {
    update(next) {
      current = next;
      if (identity() !== key) start();
      else sync();
    },
    destroy() {
      instance?.destroy();
      instance = null;
    },
  };
};
