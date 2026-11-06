# @veilo/css

CSS skeleton loaders from [Veilo](../../README.md): shimmer, wave and pulse, with no JavaScript needed at runtime.

> **Status:** in development, not published yet. The API can still change before 1.0.

## Use the stylesheet

Load `skeleton.css` and add the classes. `veilo` alone is a still placeholder; add one effect class to animate it.

```html
<link rel="stylesheet" href="node_modules/@veilo/css/skeleton.css" />
<div class="veilo veilo-shimmer" style="width: 200px; height: 20px"></div>
```

With a bundler, `import "@veilo/css/skeleton.css";` does the same.

| Class           | Effect                                                                             |
| --------------- | ---------------------------------------------------------------------------------- |
| `veilo-shimmer` | A highlight band sweeps across, then pauses                                        |
| `veilo-wave`    | The shimmer, started later per element: set `--i` to 0, 1, 2... (`style="--i: 1"`) |
| `veilo-pulse`   | The base color fades in and out                                                    |

The file is generated from the default settings, so it always matches the core engine. For other timing, generate your own CSS (below).

## Theming

| Custom property  | Default   | Veilo dark theme | Used for          |
| ---------------- | --------- | ---------------- | ----------------- |
| `--veilo-base`   | `#dcdcdc` | `#171717`        | Placeholder color |
| `--veilo-hi`     | `#f7f7f7` | `#262626`        | Highlight band    |
| `--veilo-radius` | `6px`     |                  | Corner radius     |

The stylesheet does not switch colors with the system theme, because a page's own theme may differ from it. Set the properties where your page sets its theme:

```css
[data-theme="dark"] {
  --veilo-base: #171717;
  --veilo-hi: #262626;
}
```

## Generate the CSS

```ts
import { generateLoaderCss, parseSettings } from "@veilo/css";

const { settings } = parseSettings({ effect: "wave", lDur: 1.6 });
const css = generateLoaderCss(settings);
```

The generator is the one in `@veilo/core`, re-exported here, so the CSS always matches what the core engine draws. See the [core README](../core/README.md) for the settings and `LoaderCssOptions`.
