# @veilo/core

The framework-agnostic engine behind [Veilo](../../README.md): skeleton loaders and reveal animations (dot, character and mosaic grids, blur, zoom, wipe, text scramble and typewriter) for real elements on a page.

> **Status:** in development, not published yet. The API can still change before 1.0.

Everything runs from one flat, versioned settings object (plain JSON). Every frame is a pure function of progress `p` from 0 to 1, so playback, scrubbing and screenshots are exact and repeatable.

## Quick start

```html
<article class="card">
  <div class="media"><img class="photo" src="product.png" alt="MCHOSE L7 Pro" /></div>
  <h3 class="title">MCHOSE L7 Pro</h3>
  <p class="price">$59.99</p>
  <button class="buy"><span class="label">Buy now</span></button>
</article>
```

```ts
import { createReveal } from "@veilo/core";

const card = document.querySelector<HTMLElement>(".card")!;
const find = (selector: string) => card.querySelector<HTMLElement>(selector)!;

const reveal = createReveal(
  {
    image: card.querySelector<HTMLImageElement>(".photo")!,
    text: [find(".title"), find(".price"), find(".label")],
    button: find(".buy"),
  },
  { imageFx: "dots", origin: "left", textFx: "scramble", rDur: 1.04 },
  { busy: card },
);

reveal.playSequence(); // skeleton for `hold` seconds, then the reveal
```

## `createReveal(targets, settings, options?)`

Animates an image, text elements and a button. Nothing on the page changes until you call a method, and `destroy()` restores the page exactly as it was.

**Targets**

| Key      | Type                                    | What it does                                                                                      |
| -------- | --------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `image`  | `HTMLImageElement \| HTMLCanvasElement` | The photo. Grid effects draw on a canvas laid over it; the other image effects style it directly. |
| `text`   | `HTMLElement[]`                         | Text elements in reveal order. Each gets its own window on the text timeline.                     |
| `button` | `HTMLElement`                           | Its background fades in with its label (the text element that is the button or sits inside it).   |

**Options**

| Key             | Default                             | What it does                                                        |
| --------------- | ----------------------------------- | ------------------------------------------------------------------- |
| `busy`          | none                                | Gets `aria-busy="true"` while the skeleton shows.                   |
| `ink`           | `--veilo-ink`, then text color      | Color of dots and characters.                                       |
| `fontFamily`    | `"IBM Plex Mono", monospace`        | Font for hex and binary characters.                                 |
| `reducedMotion` | the user's `prefers-reduced-motion` | Set `false` to preview effects regardless (as the playground does). |
| `root`          | the document head                   | The shadow root to put the skeleton stylesheet in.                  |
| `scheduler`     | the browser's clock and frames      | A custom time source, for tests that drive time by hand.            |

**Methods and properties**

| Member                   | What it does                                                                                                     |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `play()`                 | Plays the reveal from `p = 0`. Resolves `true` at the end, `false` if another call or `destroy()` interrupts it. |
| `pause()`, `resume()`    | Pause and continue. A paused reveal stays paused when it scrolls back into view.                                 |
| `seek(p)`                | Stops playback and shows the exact frame at `p`. At `p = 1` the real content shows.                              |
| `showLoading()`          | Stops everything and shows the skeleton.                                                                         |
| `playSequence({ loop })` | Loading for `hold` seconds, then the reveal. With `loop`, it starts again 900 ms after the end.                  |
| `on(event, listener)`    | Events: `progress` (with `p`), `state` (with the new state) and `complete`. Returns an unsubscribe function.     |
| `destroy()`              | Cancels frames, timers and observers, removes canvases, overlays and styles, and restores the page.              |
| `state`                  | `"idle"`, `"loading"`, `"revealing"` or `"revealed"`.                                                            |
| `progress`               | The current progress, from 0 to 1.                                                                               |
| `ready`                  | Resolves once the image is sampled. Never rejects; a broken image is shown as it is.                             |

The image is sampled once and cached; frames only draw. It is sampled again when it resizes by 2 px or more, or when the glyph font finishes loading. Playback pauses while the elements are off screen or the tab is hidden.

## `createSkeleton(elements, settings, options?)`

Shows the loader (shimmer, wave or pulse) on real elements while their content loads.

```ts
import { createSkeleton } from "@veilo/core";

const skeleton = createSkeleton(
  [photo, title, price],
  { effect: "wave", stagger: 0.12 },
  { busy: card },
);
skeleton.start(); // also restarts the animation if it already shows
skeleton.stop(); // restores the elements exactly
```

Text turns transparent, images, canvases and videos hide their picture but keep their size, and each element gets `--i` (its index) for the wave delay. Options: `busy`, `root`, and fallback `base` and `highlight` colors.

## Settings

One flat object with a `version` field. Unknown keys are ignored, values of the wrong type fall back to the default, and numbers are clamped to their range, so imported or shared settings are always safe to use.

```ts
import { defaultSettings, parseSettings, settingsJsonSchema } from "@veilo/core";

const { settings, applied } = parseSettings(JSON.parse(text)); // applied: the keys that were used
```

| Group  | Keys                                                                                                         |
| ------ | ------------------------------------------------------------------------------------------------------------ |
| Loader | `effect`, `lDur`, `lGap`, `lEase` (+ `lx1`…`ly2`), `repeat`, `stagger`, `angle`, `lWidth`, `depth`, `radius` |
| Image  | `imageFx`, `origin`, `cols`, `startScale`, `spread`                                                          |
| Text   | `textFx`, `charset`, `unit`                                                                                  |
| Timing | `rDur`, `rEase` (+ `rx1`…`ry2`), `hold`                                                                      |
| Colors | `baseColor`, `highlightColor` (optional `#rrggbb` overrides)                                                 |

Ranges and defaults are in the JSON Schema, also published as a file: `@veilo/core/settings.schema.json`.

## `generateLoaderCss(settings, options?)`

Returns the loader as plain CSS (one rule and its `@keyframes`), for use without JavaScript at runtime.

```ts
import { generateLoaderCss } from "@veilo/core";

const css = generateLoaderCss(settings, { selector: ".skeleton" });
```

Options: `selector` (default `.skeleton`), fallback `base` and `highlight` colors, and `keyframes` (the animation name; give each stylesheet on one page its own).

## Theming

| Custom property | Used for                                                                                       |
| --------------- | ---------------------------------------------------------------------------------------------- |
| `--veilo-base`  | Skeleton base color (default `#dde5e6`)                                                        |
| `--veilo-hi`    | Skeleton highlight color (default `#f6fafa`)                                                   |
| `--veilo-ink`   | Dots and characters of the grid effects                                                        |
| `--veilo-bg-a`  | Set on the button during a reveal; use it in the button's background to fade it with its label |

```css
.buy {
  background: rgb(3 3 3 / var(--veilo-bg-a, 1));
}
```

## Fonts

Hex and binary grids measure and draw their characters in IBM Plex Mono. The package does not bundle the font: load it on your page (for example from Google Fonts or `@fontsource/ibm-plex-mono`). Without it, a monospace fallback is used, and the reveal measures again when a font finishes loading.

## Accessibility

- Honors `prefers-reduced-motion`: the skeleton stays still and a reveal jumps straight to its end.
- The real text always stays in the page, so screen readers read the final content. Scramble and typewriter draw on an `aria-hidden` overlay, written with `textContent`.
- Skeleton elements get `aria-hidden` while loading, and the `busy` region gets `aria-busy`.
- Overlays and canvases are absolutely positioned and never change the size of an element.

## Server rendering

Importing the package touches no browser globals, so it is safe in server code. `parseSettings`, `defaultSettings`, `settingsJsonSchema` and `generateLoaderCss` work anywhere; `createReveal` and `createSkeleton` need a browser.

## Known limits

- An inline `background` set on an element beats the skeleton's background (an inline text color does not; the skeleton hides text regardless).
- The photo is sampled as `object-fit: cover`, whatever the image's own `object-fit`.
- Rise and sharpen moves text with `transform`, which has no effect on `display: inline` elements.
- A strike-through is not shown on scrambled text until the reveal ends.

## Differences from the specification's API sketch

The specification sketches `createReveal(container, { image: {}, text: {}, duration, easing })` and a `presets` export. The current API differs while these are being built:

- Targets are passed explicitly. Finding them inside a container from `data-veilo-slot` markup is planned.
- Settings are the flat object that the playground exports. Grouped `image` and `text` options are an open decision.
- Presets will come in their own package.
- `createSkeleton` uses `start()` and `stop()` as sketched, and adds `destroy()`.

## License

[MIT](../../LICENSE)
