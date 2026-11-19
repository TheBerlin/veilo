# @veilo-ui/svelte

Svelte 5 components and actions for [Veilo](../../README.md): show a skeleton on your own component while its data loads, then reveal it with a dot, character or mosaic grid and scrambled or typed text.

> **Status:** in development, not published yet. The API can still change before 1.0.

Works with Svelte 5 (runes), in plain Vite apps and in SvelteKit, and reads the same `data-veilo-slot` markup as [`@veilo-ui/react`](../react/README.md) and [`@veilo-ui/vue`](../vue/README.md). It is a thin layer over [`@veilo-ui/core`](../core/README.md), which does all the drawing. The logic lives in two Svelte actions, `reveal` and `skeleton`; the components `Reveal` and `Skeleton` are small wrappers over them.

## Install

```sh
npm install @veilo-ui/svelte
```

Hex and binary grids draw their characters in IBM Plex Mono, which the package does not bundle. Load it on your page, for example with `@fontsource/ibm-plex-mono`; without it a monospace fallback is used.

## Reveal a component when its data arrives

Mark the parts of your component with `data-veilo-slot`, wrap it in `Reveal`, and say when the data is ready:

```svelte
<script lang="ts">
  import { Reveal } from "@veilo-ui/svelte";

  let { product }: { product: Product | null } = $props(); // null while loading
  const shown = $derived(product ?? PLACEHOLDER);
</script>

<Reveal as="article" class="card" ready={product !== null} preset="dot-upscale">
  <img data-veilo-slot="photo" src={shown.image} alt={shown.name} />
  <h2 data-veilo-slot="title">{shown.name}</h2>
  <p data-veilo-slot="price">{shown.price}</p>
  <button data-veilo-slot="buy">
    <span data-veilo-slot="label">Add to cart</span>
  </button>
</Reveal>
```

While `ready` is `false`, every slot shows the skeleton: text slots one bar per line, the image and button a solid block, and the container gets `aria-busy`. When `ready` turns `true`, the reveal plays once.

**Render placeholder data while loading.** Veilo never sizes anything: the skeleton takes the size of your real elements. Rendering the same markup with placeholder text of a typical length (and an image of the real size) keeps the layout from shifting when the data arrives. The image may change its `src` when the data arrives; the reveal samples the new picture before it plays.

Slots are `img` or `canvas` for the photo, `button` for the button, `video` for a still block, and anything else for text. To set roles or bar widths yourself, pass a `layout` (see [slots and the layout JSON](../core/README.md#slots-and-the-layout-json)).

## `Reveal`

| Prop            | Default  | What it does                                                                                                                              |
| --------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `ready`         | required | `false` shows the skeleton; turning `true` plays the reveal; turning `false` again shows the skeleton again.                              |
| `preset`        | none     | A built-in preset, such as `"dot-upscale"` or `"hex-from-center"` (from `@veilo-ui/presets`).                                             |
| `settings`      | none     | Settings to apply on top, such as `{ imageFx: "mosaic", rDur: 1.6 }`. Validated and clamped by core.                                      |
| `layout`        | none     | Slot roles and bar hints, plus base settings (only the keys you change). A `preset` replaces its settings; `settings` still apply on top. |
| `revealOnMount` | `false`  | Play when `ready` is already `true` at mount. Off by default: content that was there from the start just shows.                           |
| `as`            | `"div"`  | The container: `div`, `section`, `article`, `aside`, `figure`, `li` or `span`.                                                            |
| `options`       | none     | Core options: `ink`, `fontFamily`, `reducedMotion` and others. Read when the reveal is created.                                           |
| `oncomplete`    | none     | Called each time a reveal finishes.                                                                                                       |

Any other attribute, such as `class`, `style`, `id` or `data-*`, goes to the container. Effect props are compared by value, so writing `settings={{ rDur: 2 }}` inline does not rebuild anything on each update.

## `Skeleton`

A loader without a reveal: shimmer, wave or pulse while `loading` is `true`.

```svelte
<Skeleton loading={!user} effect="wave">
  <h3 data-veilo-slot="name">{user?.name ?? "Placeholder name"}</h3>
  <p data-veilo-slot="bio">{user?.bio ?? "A short bio of about one line."}</p>
</Skeleton>
```

| Prop                                            | What it does                                                                                            |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `loading`                                       | Required. `true` shows the loader; `false` restores the elements exactly.                               |
| `effect`                                        | `"shimmer"`, `"wave"` or `"pulse"`. A shortcut that wins over `preset` and `settings`.                  |
| `preset`, `settings`, `layout`, `as`, `options` | As on `Reveal`. `options` takes `busy`, `root`, `warnings`, and fallback `base` and `highlight` colors. |
| `self`                                          | Make the element itself one solid placeholder, instead of the slots inside it.                          |

## The actions

Put an action on any element when you do not want a wrapper element, or to wrap one part:

```svelte
<script lang="ts">
  import { reveal, skeleton } from "@veilo-ui/svelte";
</script>

<!-- The element is the container. -->
<article use:reveal={{ ready: product !== null, preset: "matrix-columns" }}>…</article>

<!-- One part, with no extra element: the element itself becomes the placeholder. -->
<span class="avatar" aria-hidden="true" use:skeleton={{ loading: !user, self: true, effect: "pulse" }}></span>
```

`reveal` takes the same options as the `Reveal` component (`ready`, `preset`, `settings`, `layout`, `revealOnMount`, `options`, `oncomplete`). `skeleton` takes `loading`, `effect`, `preset`, `settings`, `layout`, `self` and `options`. When the parameters change, the effect is rebuilt only if it really changed. When the element goes away, both restore it exactly.

## Server rendering and SvelteKit

Actions do not run on the server, so nothing is created there: the server renders your plain markup, and the effect starts in the browser after mount. There is no layout shift from Veilo, but the skeleton appears when the page hydrates. (React's package can also render the skeleton in server HTML; the Svelte package does not yet.)

## Accessibility

The container gets `aria-busy` while loading, placeholders are `aria-hidden`, and users who prefer reduced motion see the content at once. See [the core README](../core/README.md#accessibility).

## Example

[`examples/svelte-demo`](../../examples/svelte-demo) is a minimal Svelte 5 app with a card that loads like a real fetch. CI installs the packed packages into it, checks it with `svelte-check`, builds it and checks the reveal in a browser.
