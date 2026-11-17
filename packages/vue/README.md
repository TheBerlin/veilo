# @veilo/vue

Vue 3 components and a composable for [Veilo](../../README.md): show a skeleton on your own component while its data loads, then reveal it with a dot, character or mosaic grid and scrambled or typed text.

> **Status:** in development, not published yet. The API can still change before 1.0.

Works with Vue 3.4 and later, in the Options API, `<script setup>` and render functions, and with server rendering. It is a thin layer over [`@veilo/core`](../core/README.md), which does all the drawing, and it reads the same `data-veilo-slot` markup as [`@veilo/react`](../react/README.md).

## Install

```sh
npm install @veilo/vue
```

Hex and binary grids draw their characters in IBM Plex Mono, which the package does not bundle. Load it on your page, for example with `@fontsource/ibm-plex-mono`; without it a monospace fallback is used.

## Reveal a component when its data arrives

Mark the parts of your component with `data-veilo-slot`, wrap it in `Reveal`, and say when the data is ready:

```vue
<script setup lang="ts">
import { Reveal } from "@veilo/vue";
import { computed } from "vue";

const props = defineProps<{ product: Product | null }>(); // null while loading
const shown = computed(() => props.product ?? PLACEHOLDER);
</script>

<template>
  <Reveal as="article" class="card" :ready="product !== null" preset="dot-upscale">
    <img data-veilo-slot="photo" :src="shown.image" :alt="shown.name" />
    <h2 data-veilo-slot="title">{{ shown.name }}</h2>
    <p data-veilo-slot="price">{{ shown.price }}</p>
    <button data-veilo-slot="buy">
      <span data-veilo-slot="label">Add to cart</span>
    </button>
  </Reveal>
</template>
```

While `ready` is `false`, every slot shows the skeleton: text slots one bar per line, the image and button a solid block, and the container gets `aria-busy`. When `ready` turns `true`, the reveal plays once.

**Render placeholder data while loading.** Veilo never sizes anything: the skeleton takes the size of your real elements. Rendering the same markup with placeholder text of a typical length (and an image of the real size) keeps the layout from shifting when the data arrives. The image may change its `src` when the data arrives; the reveal samples the new picture before it plays.

Slots are `img` or `canvas` for the photo, `button` for the button, `video` for a still block, and anything else for text. To set roles or bar widths yourself, pass a `layout` (see [slots and the layout JSON](../core/README.md#slots-and-the-layout-json)).

## `Reveal`

| Prop            | Default  | What it does                                                                                                                              |
| --------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `ready`         | required | `false` shows the skeleton; turning `true` plays the reveal; turning `false` again shows the skeleton again.                              |
| `preset`        | none     | A built-in preset, such as `"dot-upscale"` or `"hex-from-center"` (from `@veilo/presets`).                                                |
| `settings`      | none     | Settings to apply on top, such as `{ imageFx: "mosaic", rDur: 1.6 }`. Validated and clamped by core.                                      |
| `layout`        | none     | Slot roles and bar hints, plus base settings (only the keys you change). A `preset` replaces its settings; `settings` still apply on top. |
| `revealOnMount` | `false`  | Play when `ready` is already `true` at mount. Off by default: content that was there from the start just shows.                           |
| `as`            | `"div"`  | The container: `div`, `section`, `article`, `aside`, `figure`, `li` or `span`.                                                            |
| `options`       | none     | Core options: `ink`, `fontFamily`, `reducedMotion` and others. Read when the reveal is created.                                           |

**Event:** `complete`, each time a reveal finishes (`@complete="..."`).

Any other attribute, such as `class`, `style`, `id` or `data-*`, goes to the container. Effect props are compared by value, so writing `:settings="{ rDur: 2 }"` inline does not rebuild anything on each render.

## `Skeleton`

A loader without a reveal: shimmer, wave or pulse while `loading` is `true`.

```vue
<Skeleton :loading="!user" effect="wave">
  <h3 data-veilo-slot="name">{{ user?.name ?? "Placeholder name" }}</h3>
  <p data-veilo-slot="bio">{{ user?.bio ?? "A short bio of about one line." }}</p>
</Skeleton>

<!-- One part, with no extra element: the child itself becomes the placeholder. -->
<Skeleton :loading="!user" as-child effect="pulse">
  <span class="avatar" aria-hidden="true" />
</Skeleton>
```

| Prop                                            | What it does                                                                                            |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `loading`                                       | Required. `true` shows the loader; `false` restores the elements exactly.                               |
| `effect`                                        | `"shimmer"`, `"wave"` or `"pulse"`. A shortcut that wins over `preset` and `settings`.                  |
| `preset`, `settings`, `layout`, `as`, `options` | As on `Reveal`. `options` takes `busy`, `root`, `warnings`, and fallback `base` and `highlight` colors. |
| `asChild`                                       | Put the loader on the single child instead of on the slots inside a container. No element is added.     |

## `useReveal`

For imperative control. Bind the returned `el` to the container, then call methods on `reveal`:

```vue
<script setup lang="ts">
import { useReveal } from "@veilo/vue";

const { el, reveal, state } = useReveal({ preset: "matrix-columns" });
</script>

<template>
  <div ref="el">
    <img data-veilo-slot="photo" src="/photo.jpg" alt="" />
    <button type="button" @click="reveal?.playSequence()">Replay ({{ state }})</button>
  </div>
</template>
```

`useReveal(config, options)` takes a config (a value, a ref or a getter) and returns `{ el, reveal, state }`. `reveal` is a `shallowRef` to the live core reveal (`play()`, `pause()`, `seek(p)`, `playSequence()`, `showLoading()`, `on(...)`; see [its methods](../core/README.md#createrevealcontainer--targets-settings-options)), `null` before mount and after unmount. `state` is a ref of the reveal's state. The composable starts nothing by itself.

## Server rendering

Nothing runs on the server: the effect is created after mount, in the browser. The server renders your plain markup, so there is no layout shift from Veilo, but the skeleton appears when the page hydrates. (React's package can also render the skeleton in server HTML; the Vue package does not yet.)

## Accessibility

The container gets `aria-busy` while loading, placeholders are `aria-hidden`, and users who prefer reduced motion see the content at once. See [the core README](../core/README.md#accessibility).

## Example

[`examples/vue-demo`](../../examples/vue-demo) is a minimal Vue 3 app with a card that loads like a real fetch. CI installs the packed packages into it, type-checks it with `vue-tsc`, builds it and checks the reveal in a browser.
