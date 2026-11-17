<!--
  Reveal.svelte: wraps a whole component, shows the skeleton on its `data-veilo-slot` parts while
  data loads, and plays the reveal when it arrives. A thin wrapper over the `reveal` action.
-->
<script lang="ts" module>
  import type { RevealOptions, Settings } from "@veilo/core";
  import type { LayoutInput, PresetId } from "@veilo/presets";
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";

  /** The elements `Reveal` and `Skeleton` can render as their container. */
  export type RevealElement = "div" | "section" | "article" | "aside" | "figure" | "li" | "span";

  /** Props of the `Reveal` component: the effect, the `ready` flag, and container attributes. */
  export interface RevealProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
    /**
     * Whether the content is ready. `false` shows the skeleton; turning `true` plays the reveal;
     * turning `false` again shows the skeleton again.
     */
    ready: boolean;
    /** A built-in preset. Replaces the layout's settings; `settings` still apply on top. */
    preset?: PresetId;
    /** Settings to apply last, over the preset or the layout's settings. */
    settings?: Partial<Settings>;
    /** Slot roles and bar hints, plus base settings (only the keys you change). */
    layout?: LayoutInput;
    /** Play when `ready` is already `true` at mount. Off: content that was there just shows. */
    revealOnMount?: boolean;
    /** The container element. Defaults to `div`. */
    as?: RevealElement;
    /** Core reveal options (`ink`, `fontFamily`, `reducedMotion`, ...). Read when created. */
    options?: RevealOptions;
    /** Called each time a reveal finishes. */
    oncomplete?: () => void;
    /** The component to reveal, with `data-veilo-slot` on its parts. */
    children?: Snippet;
  }
</script>

<script lang="ts">
  import { reveal } from "./actions.js";

  let {
    ready,
    preset,
    settings,
    layout,
    revealOnMount = false,
    as = "div",
    options,
    oncomplete,
    children,
    ...rest
  }: RevealProps = $props();
</script>

<svelte:element
  this={as}
  {...rest}
  use:reveal={{ ready, preset, settings, layout, revealOnMount, options, oncomplete }}
>
  {@render children?.()}
</svelte:element>
