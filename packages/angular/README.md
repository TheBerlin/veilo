# @veilo/angular

Angular standalone components and directives for [Veilo](../../README.md): show a skeleton on your own component while its data loads, then reveal it with a dot, character or mosaic grid and scrambled or typed text.

> **Status:** in development, not published yet. The API can still change before 1.0.

Works with Angular 20, 21 and 22, with zone.js and zoneless, and reads the same `data-veilo-slot` markup as [`@veilo/react`](../react/README.md), [`@veilo/vue`](../vue/README.md) and [`@veilo/svelte`](../svelte/README.md). It is a thin layer over [`@veilo/core`](../core/README.md), which does all the drawing. The logic lives in two directives, `veiloReveal` and `veiloSkeleton`; the components `<veilo-reveal>` and `<veilo-skeleton>` apply them to their own element. Everything is standalone: no NgModule.

The package is built with Angular 20 in partial-compilation mode, so an app on Angular 20 or later links it with its own compiler.

## Install

```sh
npm install @veilo/angular
```

Hex and binary grids draw their characters in IBM Plex Mono, which the package does not bundle. Load it on your page, for example with `@fontsource/ibm-plex-mono`; without it a monospace fallback is used.

## Reveal a component when its data arrives

Mark the parts of your component with `data-veilo-slot`, wrap it in `<veilo-reveal>`, and say when the data is ready:

```ts
import { Component, computed, input } from "@angular/core";
import { VeiloReveal } from "@veilo/angular";

@Component({
  selector: "app-product-card",
  imports: [VeiloReveal],
  template: `
    <veilo-reveal class="card" [ready]="product() !== null" [preset]="'dot-upscale'">
      <img data-veilo-slot="photo" [src]="shown().image" [alt]="shown().name" />
      <h2 data-veilo-slot="title">{{ shown().name }}</h2>
      <p data-veilo-slot="price">{{ shown().price }}</p>
      <button data-veilo-slot="buy">
        <span data-veilo-slot="label">Add to cart</span>
      </button>
    </veilo-reveal>
  `,
})
export class ProductCard {
  readonly product = input<Product | null>(null); // null while loading
  protected readonly shown = computed(() => this.product() ?? PLACEHOLDER);
}
```

While `ready` is `false`, every slot shows the skeleton: text slots one bar per line, the image and button a solid block, and the container gets `aria-busy`. When `ready` turns `true`, the reveal plays once.

**Render placeholder data while loading.** Veilo never sizes anything: the skeleton takes the size of your real elements. Rendering the same markup with placeholder text of a typical length (and an image of the real size) keeps the layout from shifting when the data arrives. The image may change its `src` when the data arrives; the reveal samples the new picture before it plays.

Slots are `img` or `canvas` for the photo, `button` for the button, `video` for a still block, and anything else for text. To set roles or bar widths yourself, pass a `layout` (see [slots and the layout JSON](../core/README.md#slots-and-the-layout-json)).

## `<veilo-reveal>` and `veiloReveal`

| Input           | Default  | What it does                                                                                                                              |
| --------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `ready`         | required | `false` shows the skeleton; turning `true` plays the reveal; turning `false` again shows the skeleton again.                              |
| `preset`        | none     | A built-in preset, such as `'dot-upscale'` or `'hex-from-center'` (from `@veilo/presets`).                                                |
| `settings`      | none     | Settings to apply on top, such as `{ imageFx: 'mosaic', rDur: 1.6 }`. Validated and clamped by core.                                      |
| `layout`        | none     | Slot roles and bar hints, plus base settings (only the keys you change). A `preset` replaces its settings; `settings` still apply on top. |
| `revealOnMount` | `false`  | Play when `ready` is already `true` at the start. Off by default: content that was there from the start just shows.                       |
| `options`       | none     | Core options: `ink`, `fontFamily`, `reducedMotion` and others. Read when the reveal is created.                                           |

**Output:** `(complete)`, each time a reveal finishes. It is emitted inside the zone, so handlers update the view as usual.

The component is a block element: style it with a class or any attribute. Use the directive when you want your own element instead: `<article veiloReveal [ready]="loaded">…</article>` (import `VeiloRevealDirective`). With `exportAs`, `#r="veiloReveal"` gives you the directive, and `r.reveal()` is a signal with the live core reveal (`play()`, `pause()`, `seek(p)`, `playSequence()`, `showLoading()`, `on(...)`; see [its methods](../core/README.md#createrevealcontainer--targets-settings-options)), `null` before the first render and after destroy.

Effect inputs are compared by value, so passing a new but equal object does not rebuild anything.

## `<veilo-skeleton>` and `veiloSkeleton`

A loader without a reveal: shimmer, wave or pulse while `loading` is `true`.

```html
<veilo-skeleton [loading]="!user()" [effect]="'wave'">
  <h3 data-veilo-slot="name">{{ user()?.name ?? 'Placeholder name' }}</h3>
  <p data-veilo-slot="bio">{{ user()?.bio ?? 'A short bio of about one line.' }}</p>
</veilo-skeleton>

<!-- One part, with no extra element: the element itself becomes the placeholder. -->
<span
  class="avatar"
  aria-hidden="true"
  veiloSkeleton
  [loading]="!user()"
  [self]="true"
  [effect]="'pulse'"
></span>
```

| Input                          | What it does                                                                               |
| ------------------------------ | ------------------------------------------------------------------------------------------ |
| `loading`                      | Required. `true` shows the loader; `false` restores the elements exactly.                  |
| `effect`                       | `'shimmer'`, `'wave'` or `'pulse'`. A shortcut that wins over `preset` and `settings`.     |
| `preset`, `settings`, `layout` | As on `veiloReveal`.                                                                       |
| `self`                         | Make the element itself one solid placeholder, instead of the slots inside it.             |
| `options`                      | `busy`, `root`, `warnings`, and fallback `base` and `highlight` colors. Read when created. |

## Zones, zoneless and server rendering

The directives create core's reveal inside `NgZone.runOutsideAngular`, so the animation never triggers change detection, and they work the same with zone.js and zoneless. Nothing is created on the server: the effect starts after the first render in the browser (`afterNextRender`), so server-rendered HTML holds your plain markup and the skeleton appears when the page hydrates. (React's package can also render the skeleton in server HTML; the Angular package does not yet.)

## Accessibility

The container gets `aria-busy` while loading, placeholders are `aria-hidden`, and users who prefer reduced motion see the content at once. See [the core README](../core/README.md#accessibility).

## Example

[`examples/angular-demo`](../../examples/angular-demo) is a minimal Angular 22 app with a card that loads like a real fetch. CI installs the packed packages into it with npm, builds it with `ng build` (strict templates) and checks the reveal in a browser.
