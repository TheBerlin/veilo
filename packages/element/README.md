# @veilo/element

Web components for [Veilo](../../README.md): `<veilo-reveal>` and `<veilo-skeleton>` show a skeleton on your own markup while its content loads, then reveal it with a dot, character or mosaic grid and scrambled or typed text. They work in plain HTML with one script tag, and in any framework that renders HTML.

> **Status:** in development, not published yet. The API can still change before 1.0.

Built with [Lit](https://lit.dev) on [`@veilo/core`](../core/README.md), which does all the drawing. The elements add no shadow DOM: your elements stay in the page and your CSS keeps applying to them.

## Use it from a CDN

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@veilo/element"></script>

<veilo-reveal preset="dot-upscale" loading>
  <img data-veilo-slot="photo" src="placeholder.png" alt="" />
  <h2 data-veilo-slot="title">Product name here</h2>
  <p data-veilo-slot="price">$00.00</p>
</veilo-reveal>

<script type="module">
  const card = document.querySelector("veilo-reveal");
  const product = await fetchProduct();
  // Fill in the real content, then end loading: the reveal plays.
  card.querySelector("img").src = product.image;
  card.querySelector("h2").textContent = product.name;
  card.querySelector("[data-veilo-slot=price]").textContent = product.price;
  card.loading = false;
</script>
```

The script is `cdn.js`: one ES module of about 35 KB (14 KB gzipped) with core, the presets and Lit inside. It registers both elements when it loads. unpkg works the same (`https://unpkg.com/@veilo/element`). The CDN links work once the package is on npm.

Hex and binary grids draw their characters in IBM Plex Mono, which the package does not bundle. Load it on your page, for example from Google Fonts or `@fontsource/ibm-plex-mono`; without it a monospace fallback is used.

## Install from npm

```sh
npm install @veilo/element
```

```ts
// Registers <veilo-reveal> and <veilo-skeleton>.
import "@veilo/element/define";
```

Or register them yourself, for example in your own registry:

```ts
import { defineVeiloElements } from "@veilo/element";

defineVeiloElements(); // safe to call twice; a tag already taken is left alone
```

Importing `@veilo/element` registers nothing, and both entries import on a server without errors (`/define` registers nothing there). In TypeScript, `document.querySelector("veilo-reveal")` is typed as `VeiloRevealElement`.

## Mark your markup

Put `data-veilo-slot` with a name on every part that should animate. Only marked elements take part. Slots are `img` or `canvas` for the photo, `button` for the button, `video` for a still block, and anything else for text. To set roles or bar widths yourself, pass a `layout` (see [slots and the layout JSON](../core/README.md#slots-and-the-layout-json)).

**Keep placeholder content in the slots while loading.** Veilo never sizes anything: the skeleton takes the size of your real elements. Text of a typical length (and an image of the real size) keeps the layout from shifting when the content arrives. The image may change its `src` when the data arrives; the reveal samples the new picture before it plays.

## `<veilo-reveal>`

While `loading` is present, every slot shows the skeleton: text slots one bar per line, the image and button a solid block, and the element gets `aria-busy`. Removing `loading` plays the reveal once.

| Attribute           | Property          | What it does                                                                                                                                                                                                                                         |
| ------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `loading`           | `loading`         | Present: the skeleton shows. Removed (or `false`): the reveal plays. Absent from the start: the content simply shows.                                                                                                                                |
| `reveal-on-connect` | `revealOnConnect` | Play the reveal when the element enters the page, without a loading phase.                                                                                                                                                                           |
| `preset`            | `preset`          | A built-in preset, such as `dot-upscale` or `hex-from-center` (from `@veilo/presets`).                                                                                                                                                               |
| `settings`          | `settings`        | Settings to apply on top, as JSON: `settings='{"imageFx":"mosaic","rDur":1.6}'`. The property takes an object.                                                                                                                                       |
| `layout`            | `layout`          | Slot roles and bar hints, plus base settings, as JSON. A `preset` replaces its settings; `settings` still apply on top.                                                                                                                              |
| none                | `options`         | Core options: `ink`, `fontFamily`, `reducedMotion` and others. Set it before the element enters the page.                                                                                                                                            |
| none                | `reveal`          | The live core reveal (read only), for full control: `play()`, `seek(p)`, `playSequence()`, `on("progress", ...)`. See [its methods](../core/README.md#createrevealcontainer--targets-settings-options). `null` while the element is not in the page. |

Settings are validated and clamped by core. An attribute that is not valid JSON is ignored with a console warning. A new reveal is made only when the effect really changes, so setting an equal object does nothing.

**Event:** `veilo-complete` (bubbles) each time a reveal finishes. The name is exported as `COMPLETE_EVENT`.

```js
card.addEventListener("veilo-complete", () => console.log("revealed"));
```

## `<veilo-skeleton>`

A loader without a reveal: shimmer, wave or pulse while `loading` is present; removing it restores the elements exactly.

```html
<veilo-skeleton effect="wave" loading>
  <h3 data-veilo-slot="name">Placeholder name</h3>
  <p data-veilo-slot="bio">A short bio of about one line.</p>
</veilo-skeleton>
```

| Attribute                      | What it does                                                                                                                 |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `loading`                      | Present: the loader shows. Removed: the elements are restored.                                                               |
| `effect`                       | `shimmer`, `wave` or `pulse`. Wins over `preset` and `settings`.                                                             |
| `preset`, `settings`, `layout` | As on `<veilo-reveal>`. The `options` property takes `busy`, `root`, `warnings`, and fallback `base` and `highlight` colors. |

For a single element with no wrapper, such as an avatar, use the CSS classes of [`@veilo/css`](../css/README.md) instead.

## Accessibility and cleanup

- Users who prefer reduced motion see the content at once and a still placeholder.
- Placeholders are `aria-hidden` and the element is `aria-busy` while loading.
- Removing an element from the page cancels every frame, timer and observer and restores your markup exactly. Moving it creates a new reveal; a move in the middle of a reveal ends it and shows the content.
- The CDN bundle is a production build: slot mismatch warnings are off unless `options.warnings` is `true`.

## Example

[`examples/element-demo`](../../examples/element-demo) is a plain HTML page with no build step: a product card, a reviews list and an avatar that load like a real fetch. CI installs the packed packages into it and checks the page in a browser.
