// reveal.ts: the `Reveal` component. Wraps a whole component, shows the skeleton on its
// `data-veilo-slot` parts while data loads, and plays the reveal when it arrives.

import type { RevealOptions, Settings } from "@veilo-ui/core";
import type { LayoutInput, PresetId } from "@veilo-ui/presets";
import { defineComponent, h, watch, type PropType } from "vue";
import { useReveal } from "./use-reveal.ts";

/** The elements `Reveal` and `Skeleton` can render as their container. */
export type RevealElement = "div" | "section" | "article" | "aside" | "figure" | "li" | "span";

/**
 * Wraps content in a container and runs a Veilo reveal on the `data-veilo-slot` elements inside.
 * While `ready` is `false` they show the skeleton (render placeholder data meanwhile, so the
 * parts have their real size); when it turns `true` the reveal plays once. The container gets
 * `aria-busy` while loading. Users who prefer reduced motion see the content at once.
 *
 * Props: `ready` (required), `preset`, `settings`, `layout`, `revealOnMount` (play when `ready`
 * is already true at mount; off by default), `as` (the container element, `div` by default) and
 * `options` (core reveal options, read when the reveal is created). Any other attribute goes to
 * the container. Emits `complete` each time a reveal finishes.
 *
 * Side effects: through core, adds canvases, overlays and a stylesheet while mounted and removes
 * them on unmount. Nothing runs on the server.
 */
export const Reveal = defineComponent({
  name: "VeiloReveal",
  props: {
    /** Whether the content is ready: `false` shows the skeleton, turning `true` plays it. */
    ready: { type: Boolean, required: true },
    /** A built-in preset. Replaces the layout's settings; `settings` still apply on top. */
    preset: { type: String as PropType<PresetId>, default: undefined },
    /** Settings to apply last, over the preset or the layout's settings. */
    settings: { type: Object as PropType<Partial<Settings>>, default: undefined },
    /** Slot roles and bar hints, plus base settings (only the keys you change). */
    layout: { type: Object as PropType<LayoutInput>, default: undefined },
    /** Play when `ready` is already `true` at mount. Off: content that was there just shows. */
    revealOnMount: { type: Boolean, default: false },
    /** The container element. */
    as: { type: String as PropType<RevealElement>, default: "div" },
    /** Core reveal options (`ink`, `fontFamily`, `reducedMotion`, ...). Read when created. */
    options: { type: Object as PropType<RevealOptions>, default: undefined },
  },
  emits: {
    /** A reveal finished. */
    complete: () => true,
  },
  setup(props, { emit, slots }) {
    const { el, reveal } = useReveal(
      () => ({ preset: props.preset, settings: props.settings, layout: props.layout }),
      () => props.options,
    );

    // The reveal the watcher last saw, and whether the content was ready then.
    let seen: { reveal: typeof reveal.value; ready: boolean } = {
      reveal: null,
      ready: props.ready,
    };
    watch(
      [reveal, () => props.ready],
      ([current, ready]) => {
        if (!current) return;
        const first = seen.reveal !== current;
        const wasReady = seen.ready;
        seen = { reveal: current, ready };
        if (!ready) current.showLoading();
        // Plays when the content has just become ready, even if that happened before the reveal
        // existed (the same tick as mount). A new reveal for content that was ready already
        // (mount, or an effect change) plays only when asked.
        else if (!wasReady || (first && props.revealOnMount)) void current.play();
      },
      { flush: "post", immediate: true },
    );

    // One subscription per reveal; a new reveal replaces it.
    watch(
      reveal,
      (current, _previous, onCleanup) => {
        if (current) onCleanup(current.on("complete", () => emit("complete")));
      },
      { flush: "post", immediate: true },
    );

    return () => h(props.as, { ref: el }, slots.default?.());
  },
});
