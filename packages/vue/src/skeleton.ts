// skeleton.ts: the `Skeleton` component. Shows the loader (shimmer, wave or pulse) on real
// elements while their content loads, with no reveal afterwards.

import {
  createSkeleton,
  type Settings,
  type Skeleton as CoreSkeleton,
  type SkeletonOptions,
} from "@veilo/core";
import { configKey, resolveConfig, type LayoutInput, type PresetId } from "@veilo/presets";
import {
  cloneVNode,
  computed,
  defineComponent,
  h,
  ref,
  shallowRef,
  watch,
  type PropType,
  type VNode,
} from "vue";
import type { RevealElement } from "./reveal.ts";

/**
 * Shows a Veilo loader while `loading` is `true`. By default it renders a container (`as`, a
 * `div` unless set) and every `data-veilo-slot` element inside becomes a placeholder; text slots
 * show one bar per line, and the container gets `aria-busy`. With `asChild` the single child
 * itself becomes one solid placeholder and no element is added, the escape hatch for wrapping
 * one part. Users who prefer reduced motion see a still placeholder.
 *
 * Props: `loading` (required), `effect` (shortcut for the loader effect; wins over `preset` and
 * `settings`), `preset`, `settings`, `layout`, `asChild`, `as` and `options` (core skeleton
 * options, read when created). Any other attribute goes to the container, or to the child with
 * `asChild`.
 *
 * Side effects: through core, adds inline styles and a stylesheet while loading and restores the
 * elements exactly when loading ends or on unmount. Nothing runs on the server.
 */
export const Skeleton = defineComponent({
  name: "VeiloSkeleton",
  props: {
    /** Whether the content is loading: `true` shows the loader, `false` restores the elements. */
    loading: { type: Boolean, required: true },
    /** Shortcut for the loader effect; wins over `preset` and `settings`. */
    effect: { type: String as PropType<Settings["effect"]>, default: undefined },
    /** A built-in preset. Replaces the layout's settings; `settings` still apply on top. */
    preset: { type: String as PropType<PresetId>, default: undefined },
    /** Settings to apply last, over the preset or the layout's settings. */
    settings: { type: Object as PropType<Partial<Settings>>, default: undefined },
    /** Slot roles and bar hints, plus base settings (only the keys you change). */
    layout: { type: Object as PropType<LayoutInput>, default: undefined },
    /** Put the loader on the single child itself instead of on the slots inside a container. */
    asChild: { type: Boolean, default: false },
    /** The container element when not `asChild`. */
    as: { type: String as PropType<RevealElement>, default: "div" },
    /** Core skeleton options (`busy`, `root`, `warnings`, fallback colors). Read when created. */
    options: { type: Object as PropType<SkeletonOptions>, default: undefined },
  },
  setup(props, { slots }) {
    const el = ref<HTMLElement | null>(null);
    const skeleton = shallowRef<CoreSkeleton | null>(null);
    const config = () => ({
      preset: props.preset,
      layout: props.layout,
      settings: { ...props.settings, ...(props.effect && { effect: props.effect }) },
    });
    const key = computed(() => configKey(config()));

    // One skeleton per element and effect; a new one replaces the old after it restored the page.
    watch(
      [el, key, () => props.asChild],
      (_next, _previous, onCleanup) => {
        const element = el.value;
        if (!element) return;
        // A list keeps the child a solid placeholder; a container looks for slots inside.
        const target = props.asChild ? [element] : element;
        const instance = createSkeleton(target, resolveConfig(config()), props.options);
        skeleton.value = instance;
        onCleanup(() => {
          instance.destroy();
          if (skeleton.value === instance) skeleton.value = null;
        });
      },
      { flush: "post", immediate: true },
    );

    watch(
      [skeleton, () => props.loading],
      ([current, loading]) => {
        if (!current) return;
        if (loading) current.start();
        else current.stop();
      },
      { flush: "post", immediate: true },
    );

    return () => {
      const children = slots.default?.() ?? [];
      if (props.asChild) {
        // The first element child, with the ref added next to any it already has.
        const child = children.find((node): node is VNode => typeof node.type !== "symbol");
        return child ? cloneVNode(child, { ref: el }, true) : null;
      }
      return h(props.as, { ref: el }, children);
    };
  },
});
