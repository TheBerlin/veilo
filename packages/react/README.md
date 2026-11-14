# @veilo/react

React components for [Veilo](../../README.md): show a skeleton on your own component while its data loads, then reveal it with a dot, character or mosaic grid and scrambled or typed text.

> **Status:** in development, not published yet. The API can still change before 1.0.

Works with React 18.3 and 19, with Strict Mode, and with server rendering. It is a thin layer over [`@veilo/core`](../core/README.md), which does all the drawing.

## Install

```sh
npm install @veilo/react
```

Hex and binary grids draw their characters in IBM Plex Mono, which the package does not bundle. Load it on your page, for example with `@fontsource/ibm-plex-mono`; without it a monospace fallback is used.

## Reveal a component when its data arrives

Mark the parts of your component with `data-veilo-slot`, wrap it in `Reveal`, and say when the data is ready:

```tsx
import { Reveal } from "@veilo/react";

function ProductCard({ product }: { product: Product }) {
  return (
    <>
      <img data-veilo-slot="photo" src={product.image} alt={product.name} />
      <h2 data-veilo-slot="title">{product.name}</h2>
      <p data-veilo-slot="price">{product.price}</p>
      <button data-veilo-slot="buy">
        <span data-veilo-slot="label">Add to cart</span>
      </button>
    </>
  );
}

function Product() {
  const product = useProduct(); // null while loading
  return (
    <Reveal as="article" className="card" ready={product !== null} preset="dot-upscale">
      <ProductCard product={product ?? PLACEHOLDER} />
    </Reveal>
  );
}
```

While `ready` is `false`, every slot shows the skeleton: text slots one bar per line, the image and button a solid block, and the container gets `aria-busy`. When `ready` turns `true`, the reveal plays once.

**Render placeholder data while loading.** Veilo never sizes anything: the skeleton takes the size of your real elements. Rendering the same markup with placeholder text of a typical length (and an image of the real size) keeps the layout from shifting when the data arrives. The image may change its `src` when the data arrives; the reveal samples the new picture before it plays.

Slots are `img` or `canvas` for the photo, `button` for the button, `video` for a still block, and anything else for text. To set roles or bar widths yourself, pass a `layout` (see [slots and the layout JSON](../core/README.md#slots-and-the-layout-json)).

## `Reveal`

| Prop            | Default  | What it does                                                                                                    |
| --------------- | -------- | --------------------------------------------------------------------------------------------------------------- |
| `ready`         | required | `false` shows the skeleton; turning `true` plays the reveal; turning `false` again shows the skeleton again.    |
| `preset`        | none     | A built-in preset, such as `"dot-upscale"` or `"hex-from-center"` (from `@veilo/presets`).                      |
| `settings`      | none     | Settings to apply on top, such as `{ imageFx: "mosaic", rDur: 1.6 }`. Validated and clamped by core.            |
| `layout`        | none     | Slot roles and bar hints, plus base settings. A `preset` replaces its settings; `settings` still apply on top.  |
| `revealOnMount` | `false`  | Play when `ready` is already `true` at mount. Off by default: content that was there from the start just shows. |
| `onComplete`    | none     | Called each time a reveal finishes.                                                                             |
| `as`            | `"div"`  | The container: `div`, `section`, `article`, `aside`, `figure`, `li` or `span`.                                  |
| `options`       | none     | Core options: `ink`, `fontFamily`, `reducedMotion` and others. Read when the reveal is created.                 |

Any other prop, such as `className`, `style`, `id` or `data-*`, goes to the container. Effect props are compared by value, so writing `settings={{ rDur: 2 }}` inline does not rebuild anything on each render.

## `Skeleton`

A loader without a reveal: shimmer, wave or pulse while `loading` is `true`.

```tsx
import { Skeleton } from "@veilo/react";

<Skeleton loading={!user} effect="wave">
  <h3 data-veilo-slot="name">{user?.name ?? "Placeholder name"}</h3>
  <p data-veilo-slot="bio">{user?.bio ?? "A short bio of about one line."}</p>
</Skeleton>;

// One part, with no extra element: the child itself becomes the placeholder.
<Skeleton loading={!user} asChild>
  <img className="avatar" src={user?.avatar} alt="" />
</Skeleton>;
```

| Prop                                            | What it does                                                                                                  |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `loading`                                       | `true` shows the loader; `false` restores the elements exactly.                                               |
| `effect`                                        | `"shimmer"`, `"wave"` or `"pulse"`. Wins over `preset` and `settings`.                                        |
| `asChild`                                       | Put the loader on the single child instead of on the slots inside a container. The child must accept a `ref`. |
| `preset`, `settings`, `layout`, `as`, `options` | As on `Reveal`. `options` takes `busy`, `root`, `warnings`, and fallback `base` and `highlight` colors.       |

## `useReveal`

For imperative control: play, seek, events.

```tsx
import { useReveal } from "@veilo/react";

function Card() {
  const { ref, reveal, state } = useReveal<HTMLDivElement>({ preset: "hex-from-center" });
  return (
    <div ref={ref}>
      <h2 data-veilo-slot="title">Title</h2>
      <button onClick={() => reveal?.playSequence()}>Replay ({state})</button>
    </div>
  );
}
```

It returns the `ref` for the container, the core `reveal` (`null` until mounted; see [its methods](../core/README.md#methods-and-properties)) and its `state` as React state. Progress is not React state, because it changes every frame; use `reveal.on("progress", ...)`. The hook starts nothing by itself.

## Server rendering

All exports are client components (the package starts with `"use client"`), and they render on the server. While loading, the server HTML already shows the skeleton: a small scoped `<style>` from core's `serverSkeletonCss` comes with the markup, so the skeleton shows before any script runs. After hydration the live skeleton takes over and the style is removed; the two look the same. Until then the wave runs in step, unnamed slots are guessed from their tag alone, and the placeholders are not yet `aria-hidden` or the container `aria-busy`.

## Accessibility and cleanup

- Users who prefer reduced motion see the content at once and a still placeholder.
- Placeholders are `aria-hidden` and the container is `aria-busy` while loading.
- Unmounting cancels every frame, timer and observer and restores your elements exactly. Strict Mode's double mount leaves nothing behind.

## Example

[`examples/react-demo`](../../examples/react-demo) is a minimal React 19 app with a card that loads like a real fetch. CI installs the packed packages into it, builds it and checks the reveal in a browser.
