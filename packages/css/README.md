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

## Accessibility

The stylesheet only paints. What a screen reader hears comes from your markup, so add these yourself (`createSkeleton` in `@veilo/core` sets them for you).

**Mark the loading region busy.** Put `aria-busy="true"` on the element that holds the content being loaded, and remove it (or set `"false"`) when the real content is in. Screen readers then wait instead of reading a half-loaded region.

**Hide the placeholders.** Skeleton bars carry no information, so give each one `aria-hidden="true"`. Without it, a screen reader may announce empty groups or stray text.

```html
<section aria-busy="true" aria-label="Product">
  <div class="veilo veilo-wave" aria-hidden="true" style="--i: 0; height: 160px"></div>
  <div class="veilo veilo-wave" aria-hidden="true" style="--i: 1; height: 20px"></div>
  <div class="veilo veilo-wave" aria-hidden="true" style="--i: 2; height: 20px; width: 60%"></div>
</section>
```

When the content arrives, replace the placeholders and drop `aria-busy` in the same update. If loading can take long, add a short visible or visually hidden status text such as "Loading product" in a `role="status"` element, as the bars themselves say nothing.

**Reduced motion is built in.** Under `prefers-reduced-motion: reduce` every effect class stops and shows a still base-color placeholder. Nothing to add.

**Contrast.** Placeholders are meant to be quiet. The default colors are low contrast against the Veilo backgrounds (WCAG contrast ratios):

| Pair                        | Light (`#dcdcdc`, `#f7f7f7`) | Dark (`#171717`, `#262626`) |
| --------------------------- | ---------------------------- | --------------------------- |
| Base on page (`bg`)         | 1.21 on `#f1f1f1`            | 1.15 on `#030303`           |
| Base on card                | 1.11 on `#e7e7e7`            | 1.08 on `#0d0d0d`           |
| Base on white               | 1.37                         |                             |
| Highlight band against base | 1.28                         | 1.18                        |

WCAG's 3:1 for non-text contrast covers graphics needed to understand the content. Hidden placeholders are not such graphics, so these values are allowed, but they can look faint, most of all on a card in dark mode. If the bars are hard to see on your background, darken `--veilo-base` in light themes or lighten it in dark themes, and keep `--veilo-hi` a step beyond it so the sweep stays visible.

## Generate the CSS

```ts
import { generateLoaderCss, parseSettings } from "@veilo/css";

const { settings } = parseSettings({ effect: "wave", lDur: 1.6 });
const css = generateLoaderCss(settings);
```

The generator is the one in `@veilo/core`, re-exported here, so the CSS always matches what the core engine draws. See the [core README](../core/README.md) for the settings and `LoaderCssOptions`.
