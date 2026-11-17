// use-reveal.ts: the composable every component builds on. Runs core's reveal on one element
// for as long as it is mounted, and rebuilds it when the effect config changes.

import { createReveal, type Reveal, type RevealOptions, type RevealState } from "@veilo/core";
import { configKey, resolveConfig, type RevealConfig } from "@veilo/presets";
import {
  computed,
  ref,
  shallowRef,
  toValue,
  watch,
  type MaybeRefOrGetter,
  type Ref,
  type ShallowRef,
} from "vue";

/** What {@link useReveal} returns. */
export interface UseRevealResult<T extends HTMLElement> {
  /** Bind to the container that holds the `data-veilo-slot` elements: `<div ref="el">`. */
  el: Ref<T | null>;
  /** The live reveal for imperative control, or `null` before mount and after unmount. */
  reveal: ShallowRef<Reveal | null>;
  /** The reveal's state (progress is not a ref, as it changes every frame). */
  state: Ref<RevealState>;
}

/**
 * Runs a Veilo reveal on a container. The reveal is created when the element is mounted, rebuilt
 * when the effect config changes (compared by value), and destroyed when the scope stops or the
 * element goes away, which restores the element exactly. The composable starts nothing: call
 * `reveal.value.showLoading()`, `play()` or `playSequence()`, or use the `Reveal` component,
 * which does it from a `ready` flag.
 *
 * Side effects: creates canvases, overlays and a stylesheet through core while mounted. On the
 * server nothing is created, because there is no element.
 *
 * @param config - The preset, settings and layout to animate, as a value, a ref or a getter.
 * @param options - Core reveal options, as a value, a ref or a getter. Read when the reveal is
 *   created, so a change applies at the next rebuild, not at once.
 * @returns A ref for the container, the reveal and its state.
 */
export function useReveal<T extends HTMLElement = HTMLElement>(
  config: MaybeRefOrGetter<RevealConfig> = {},
  options?: MaybeRefOrGetter<RevealOptions | undefined>,
): UseRevealResult<T> {
  const el = ref<T | null>(null) as Ref<T | null>;
  // Shallow, so Vue does not wrap core's reveal object in a deep reactive proxy.
  const reveal = shallowRef<Reveal | null>(null);
  const state = ref<RevealState>("idle");
  const key = computed(() => configKey(toValue(config)));

  // Runs again when the element or the effect changes; the cleanup restores the page first.
  watch(
    [el, key],
    (_next, _previous, onCleanup) => {
      const element = el.value;
      if (!element) return;
      const instance = createReveal(element, resolveConfig(toValue(config)), toValue(options));
      const unsubscribe = instance.on("state", (next) => {
        state.value = next;
      });
      reveal.value = instance;
      state.value = instance.state;
      onCleanup(() => {
        unsubscribe();
        instance.destroy();
        if (reveal.value === instance) reveal.value = null;
        state.value = "idle";
      });
    },
    // After the DOM is patched, so the element exists and its content is in place.
    { flush: "post", immediate: true },
  );

  return { el, reveal, state };
}
