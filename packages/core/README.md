# @veilo/core

The framework-agnostic engine behind [Veilo](../../README.md): skeleton loaders and reveal animations (dot, character and mosaic grids, blur, zoom, wipe, text scramble and typewriter) for real elements on a page.

> **Status:** in development, not published yet. The API can still change before 1.0.

Everything runs from one flat, versioned settings object (plain JSON). Every frame is a pure function of progress `p` from 0 to 1, so playback, scrubbing and screenshots are exact and repeatable.

## Quick start

Mark the parts of your component with `data-veilo-slot`, then pass the container:

```html
<article class="card">
  <div class="media"><img data-veilo-slot="photo" src="product.png" alt="MCHOSE L7 Pro" /></div>
  <h3 data-veilo-slot="title">MCHOSE L7 Pro</h3>
  <p data-veilo-slot="price">$59.99</p>
  <button data-veilo-slot="buy"><span data-veilo-slot="label">Buy now</span></button>
</article>
```

```ts
import { createReveal } from "@veilo/core";

const card = document.querySelector<HTMLElement>(".card")!;
const reveal = createReveal(card, { imageFx: "dots", origin: "left", textFx: "scramble" });

reveal.playSequence(); // skeleton for `hold` seconds, then the reveal
```

Roles are guessed from the elements: `<img>` and `<canvas>` are the image, `<button>` is the button, and the rest is text, revealed in page order. A [layout](#slots-and-the-layout-json) can name the roles instead.

## `createReveal(container | targets, settings, options?)`

Animates an image, text elements and a button. Nothing on the page changes until you call a method, and `destroy()` restores the page exactly as it was.

The first argument is a container with [slot markup](#slots-and-the-layout-json), which is also the default `busy` region, or the elements themselves:

```ts
const reveal = createReveal(
  { image: photo, text: [title, price, label], button },
  { imageFx: "dots" },
  { busy: card },
);
```

**Targets**

| Key      | Type                                    | What it does                                                                                      |
| -------- | --------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `image`  | `HTMLImageElement \| HTMLCanvasElement` | The photo. Grid effects draw on a canvas laid over it; the other image effects style it directly. |
| `text`   | `HTMLElement[]`                         | Text elements in reveal order. Each gets its own window on the text timeline.                     |
| `button` | `HTMLElement`                           | Its background fades in with its label (the text element that is the button or sits inside it).   |

**Options**

| Key             | Default                             | What it does                                                        |
| --------------- | ----------------------------------- | ------------------------------------------------------------------- |
| `busy`          | the container, if given             | Gets `aria-busy="true"` while the skeleton shows.                   |
| `warnings`      | on in development builds            | Prints slot mismatches to the console.                              |
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

## `createSkeleton(container | elements, settings, options?)`

Shows the loader (shimmer, wave or pulse) on real elements while their content loads.

```ts
import { createSkeleton } from "@veilo/core";

const skeleton = createSkeleton(card, { effect: "wave", stagger: 0.12 });
skeleton.start(); // also restarts the animation if it already shows
skeleton.stop(); // restores the elements exactly
```

Given a container, every slot in it is a placeholder, in page order; given a list, the elements are the placeholders in that order. Text turns transparent, images, canvases and videos hide their picture but keep their size, and each element gets `--i` (its index) for the wave delay. Options: `busy`, `root`, `warnings`, and fallback `base` and `highlight` colors.

## Slots and the layout JSON

Slots are the parts of your own markup marked with `data-veilo-slot="name"`. Sizes and positions always come from your elements and CSS. A layout pairs the effect settings with a map of slots, so one JSON file describes a whole component:

```json
{
  "version": 1,
  "settings": { "imageFx": "dots", "textFx": "scramble" },
  "slots": {
    "photo": { "role": "image" },
    "badge": { "role": "block" },
    "title": { "role": "text", "width": 58 },
    "description": { "role": "text", "lines": 2, "width": 70 },
    "buy": { "role": "button" }
  }
}
```

| Role     | What it does                                                                          |
| -------- | ------------------------------------------------------------------------------------- |
| `image`  | The photo (`<img>` or `<canvas>`). Only the first image slot is revealed.             |
| `text`   | A text element on the text timeline, in page order. Its skeleton is one bar per line. |
| `button` | Its background fades in with its label. Only the first button slot is used.           |
| `block`  | Shows the skeleton but has no reveal effect, for avatars, badges and other shapes.    |

`createReveal` and `createSkeleton` accept a layout or plain settings. Without a slots map, roles are guessed from the elements. A slot name may appear on several elements, such as repeated rows, and they all get its role.

Text slots show one skeleton bar per line, inset 0.18em from the top and bottom of each line. Two hints shape them; neither changes the element's size while it has content:

| Hint    | What it does                                                                                        |
| ------- | --------------------------------------------------------------------------------------------------- |
| `width` | Width of the last line's bar, in percent of the element (1 to 100). The other lines are full width. |
| `lines` | Lines of height an empty element gets while loading (1 to 20), so it does not collapse.             |

Mismatches never throw; in development builds they print a `Veilo:` warning. A layout slot missing from the markup is skipped, an element the layout does not name gets a guessed role, an `image` role on an element that is not an image becomes a `block`, and later images and buttons become blocks. Development means `process.env.NODE_ENV !== "production"`, which bundlers replace at build time; pass `warnings: false` to turn the warnings off.

`parseLayout(json)` validates a layout the same way `parseSettings` does: invalid fields are dropped and numbers are clamped.

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

Options: `selector` (default `.skeleton`), fallback `base` and `highlight` colors, `radius` (a CSS value for `border-radius`, such as `var(--veilo-radius, 6px)`; default the `radius` setting in px), and `keyframes` (the animation name; give each stylesheet on one page its own).

## Theming

| Custom property | Used for                                                                                       |
| --------------- | ---------------------------------------------------------------------------------------------- |
| `--veilo-base`  | Skeleton base color (default `#dcdcdc`; the Veilo dark theme uses `#171717`)                   |
| `--veilo-hi`    | Skeleton highlight color (default `#f7f7f7`; the Veilo dark theme uses `#262626`)              |
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

## Entry points and size

| Import                             | Contents                                                                                                       | Minified + gzip |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------- |
| `@veilo/core`                      | Everything above                                                                                               | 8.6 KB          |
| `@veilo/core/loader`               | `generateLoaderCss`, `parseSettings`, `defaultSettings`, `settingsJsonSchema`, `SETTINGS_VERSION`; no DOM code | 2.3 KB          |
| `@veilo/core/settings.schema.json` | The settings JSON Schema                                                                                       |                 |

The grid effects (`dots`, `hex`, `binary`, `mosaic`) are loaded on demand: `createReveal` imports them only when one is used, and bundlers put them in a separate file of about 1.8 KB. `reveal.ready` waits for it. The package has no side effects on import (`"sideEffects": false`), so unused code is dropped.

## Server rendering

Importing either entry touches no browser globals, so both are safe in server code; CI loads every built entry in plain Node to check this. `parseSettings`, `parseLayout`, `defaultSettings`, `settingsJsonSchema` and `generateLoaderCss` work anywhere; `createReveal` and `createSkeleton` need a browser.

## Known limits

- An inline `background` set on an element beats the skeleton's background (an inline text color does not; the skeleton hides text regardless).
- The photo is sampled as `object-fit: cover`, whatever the image's own `object-fit`.
- Rise and sharpen moves text with `transform`, which has no effect on `display: inline` elements.
- A strike-through is not shown on scrambled text until the reveal ends.
- Line bars use the CSS `lh` unit. Browsers without it show text slots as solid blocks instead.

## Differences from the specification's API sketch

The specification sketches `createReveal(container, { image: {}, text: {}, duration, easing })` and a `presets` export. The current API follows it with a container, and differs in these points:

- The container's parts are found from `data-veilo-slot` markup, and explicit targets are accepted too.
- Settings are the flat object that the playground exports. Grouped `image` and `text` options are an open decision.
- Presets will come in their own package.
- `createSkeleton` uses `start()` and `stop()` as sketched, and adds `destroy()`.

## License

[MIT](../../LICENSE)
