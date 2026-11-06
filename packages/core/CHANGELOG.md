# @veilo/core

## 0.2.0

### Minor Changes

- 314dafe: CSS loaders package.

  - New package `@veilo/css`: a static `skeleton.css` with the classes `veilo` (still placeholder), `veilo-shimmer`, `veilo-wave` (set `--i` per element) and `veilo-pulse`, generated from the core generator with default settings. It also re-exports `generateLoaderCss`, `defaultSettings`, `parseSettings` and the types `LoaderCssOptions` and `Settings`.
  - `generateLoaderCss` output now stops the animation under `prefers-reduced-motion: reduce`, leaving a still base-color placeholder.
  - `generateLoaderCss` has a `radius` option (any CSS value, such as `var(--veilo-radius, 6px)`).
  - The fallback skeleton colors follow the Veilo design system: `#dcdcdc` and `#f7f7f7` (were `#dde5e6` and `#f6fafa`).
  - README sections on theming and accessibility (`aria-busy`, `aria-hidden`, measured contrast), and a plain HTML demo in `examples/css-demo`.

## 0.1.0

### Minor Changes

- b3e35ba: First usable core engine: skeleton loaders and reveal animations on real elements.

  - `createReveal(container | targets, settings, options)`: image, text and button reveal with `play`, `pause`, `resume`, `seek`, `showLoading`, `playSequence({ loop })`, `progress`, `state` and `complete` events, and `destroy()`, which restores the page exactly.
  - Image effects: dot, hex and binary character grids and mosaic (measured IBM Plex Mono glyph ramps), plus crossfade, blur-up, zoom in and wipe with seven origins.
  - Text effects: scramble by character or word, typewriter with caret, rise and sharpen, and fade, with the button background fading in with its label.
  - `createSkeleton(container | elements, settings, options)`: shimmer, wave and pulse placeholders, with one bar per line for text.
  - Slots: mark parts of a component with `data-veilo-slot`, and describe roles and placeholder hints in a layout JSON (`parseLayout`).
  - Settings as one flat, versioned JSON object, validated and clamped by `parseSettings`, with defaults and a JSON Schema.
  - `generateLoaderCss` turns loader settings into plain CSS.
  - Two entries: `@veilo/core` and the browser-free `@veilo/core/loader`. Grid effects load on demand.
  - Honors `prefers-reduced-motion`, keeps real text in the page for screen readers, and pauses off screen.
  - CSS custom properties are `--veilo-base`, `--veilo-hi`, `--veilo-ink` and `--veilo-bg-a`.

## 0.0.2

### Patch Changes

- 03807ea: Add the settings schema, easing, seeded random, cell ordering and timeline maths. These are internal for now, as `index.ts` exports nothing yet.
