<!--
  Skeleton.svelte: shows the loader (shimmer, wave or pulse) on real elements while their content
  loads, with no reveal afterwards. A thin wrapper over the `skeleton` action.
-->
<script lang="ts" module>
  import type { Settings, SkeletonOptions } from "@veilo-ui/core";
  import type { LayoutInput, PresetId } from "@veilo-ui/presets";
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import type { RevealElement } from "./Reveal.svelte";

  /** Props of the `Skeleton` component: the loader, the `loading` flag, container attributes. */
  export interface SkeletonProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
    /** Whether the content is loading. `true` shows the loader; `false` restores the elements. */
    loading: boolean;
    /** Shortcut for the loader effect; wins over `preset` and `settings`. */
    effect?: Settings["effect"];
    /** A built-in preset. Replaces the layout's settings; `settings` still apply on top. */
    preset?: PresetId;
    /** Settings to apply last, over the preset or the layout's settings. */
    settings?: Partial<Settings>;
    /** Slot roles and bar hints, plus base settings (only the keys you change). */
    layout?: LayoutInput;
    /**
     * Make the element itself one solid placeholder, instead of the `data-veilo-slot` elements
     * inside it. For wrapping one part, such as an avatar.
     */
    self?: boolean;
    /** The element to render. Defaults to `div`. */
    as?: RevealElement;
    /** Core skeleton options (`busy`, `root`, `warnings`, fallback colors). Read when created. */
    options?: SkeletonOptions;
    /** The content: elements with `data-veilo-slot`. */
    children?: Snippet;
  }
</script>

<script lang="ts">
  import { skeleton } from "./actions.js";

  let {
    loading,
    effect,
    preset,
    settings,
    layout,
    self = false,
    as = "div",
    options,
    children,
    ...rest
  }: SkeletonProps = $props();
</script>

<svelte:element
  this={as}
  {...rest}
  use:skeleton={{ loading, effect, preset, settings, layout, self, options }}
>
  {@render children?.()}
</svelte:element>
