# @veilo-ui/seasonal

Seasonal loading animations for [Veilo](../../README.md), drawn with text characters. The first set is for Christmas and New Year: snowflakes that grow, frost and aurora colors, snow that settles on skeleton bars, a blizzard that dissolves into your content, and flakes that assemble from scrambled characters into cells and dots. More seasons can be added as more effects.

> **Status:** in development, not published yet. The API can still change before 1.0.

Each effect draws on its own `<canvas>`. Use it where a spinner would go. It does not animate your own elements: for that, use [`@veilo-ui/core`](../core/README.md) and its skeleton and reveal effects.

## The effects

| Id           | Name              | What it does                                                  |
| ------------ | ----------------- | ------------------------------------------------------------- |
| `bars`       | Snow on the bars  | Snow falls and settles on skeleton bars, then melts away.     |
| `frost`      | Frost grow        | A snowflake grows arm by arm in one ink, then fades.          |
| `ice`        | Ice cells         | The same flake, with an ice-blue cell behind every character. |
| `aurora`     | Aurora flake      | Characters shift from green to violet as the flake grows.     |
| `curtains`   | Aurora curtains   | Bands of color flow across the flake like northern lights.    |
| `glow`       | Aurora glow       | A soft colored glow shows through white characters.           |
| `blizzard`   | Blizzard dissolve | A whiteout of characters thins out until the content shows.   |
| `cell-dots`  | Dot matrix        | Scrambled characters lock into dots, then erode away.         |
| `cell-cells` | Cell grid         | Scrambled characters lock into shaded cells on a grid.        |
| `cell-frost` | Frost cells       | Frost-tinted cells with a few blinking sparkles.              |

The flake effects (all but `bars` and `blizzard`) can draw one of four flake forms: `dendrite` (the default), `fern`, `fir` and `sector`. See them live in the Veilo gallery.

## JavaScript

```js
import { mountEffect } from "@veilo-ui/seasonal";

// A container with a size: the effect fills it.
const container = document.querySelector("#loading");
const effect = mountEffect(container, "frost", { shape: "fern" });

// When your content has arrived:
effect.destroy();
```

`mountEffect(target, id, options?)` takes a container element (it creates a canvas that fills it) or a `<canvas>` that already has a CSS width and height. It returns a handle.

| Option          | Meaning                                                                                                                                                                                                                                |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mode`          | `loop` (default): runs until destroyed, paused while off screen or the tab is hidden. `hover`: rests on a still frame; hover, press or Enter plays one full run, then ignores triggers for 3 seconds. `still`: the resting frame only. |
| `shape`         | The flake form. Defaults to `dendrite`.                                                                                                                                                                                                |
| `host`          | `hover` mode: the element that takes hover and press. Defaults to the canvas.                                                                                                                                                          |
| `reducedMotion` | Stay on the resting frame. Defaults to the visitor's `prefers-reduced-motion` setting.                                                                                                                                                 |
| `label`         | The canvas's accessible name. Defaults to the id plus "animation".                                                                                                                                                                     |

| Handle            | Meaning                                                                                              |
| ----------------- | ---------------------------------------------------------------------------------------------------- |
| `canvas`          | The canvas it draws on.                                                                              |
| `play()`          | `hover` mode: plays one full run.                                                                    |
| `setShape(shape)` | Changes the flake form.                                                                              |
| `refresh()`       | Re-reads the page's colors. It also happens by itself when `data-theme` or the color scheme changes. |
| `destroy()`       | Stops everything and removes the canvas if it created it.                                            |

The package also exports `EFFECT_IDS`, `FLAKE_SHAPES`, `usesFlakeShape(id)`, `REPLAY_PAUSE_MS` and `loadEffectFonts()`.

## React

```jsx
import { SeasonalEffect } from "@veilo-ui/seasonal/react";

export function Loading() {
  // The effect fills its canvas, so give it a size.
  return <SeasonalEffect name="frost" shape="fern" style={{ width: 240, height: 240 }} />;
}
```

Props: `name`, `shape`, `mode`, `label`, `className`, `style`. React 18 and 19 are supported; it is a client component.

## Web component

```html
<script type="module">
  import { defineSeasonalEffect } from "@veilo-ui/seasonal/element";
  defineSeasonalEffect();
</script>

<veilo-seasonal-effect
  name="frost"
  shape="fern"
  style="width: 240px; height: 240px"
></veilo-seasonal-effect>
```

Attributes: `name`, `shape`, `mode`, `label`. The element is `display: block` and has no size of its own.

## Fonts and colors

The effects draw characters in **IBM Plex Mono** and, for the Blizzard dissolve's text, **Geist**. The package does not ship them: load them on your page, for example with [Fontsource](https://fontsource.org). Without them the effects use your system's monospace and sans-serif fonts. The effects redraw once the fonts have loaded.

Colors come from your page's custom properties, each with a fallback: `--veilo-bg`, `--veilo-text`, `--veilo-text-muted`, `--veilo-card`, `--veilo-base`, `--veilo-accent`, `--veilo-on-accent`, `--veilo-border` and `--veilo-border-strong`. They are the same properties the Veilo design tokens define, so on a Veilo page the effects match it. Without them, the effects follow the browser's light or dark color scheme.

## Accessibility

The canvas has `role="img"` and an accessible name. With `prefers-reduced-motion`, an effect stays on one resting frame. In `hover` mode the canvas can be focused and played with Enter or Space.

## Server rendering

Importing any entry is safe on a server: nothing touches `window` or `document` until an effect is mounted. The React component and the web component draw after mount, so a server renders an empty canvas or element.
