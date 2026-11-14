# @veilo/css

## 0.3.1

### Patch Changes

- 69e8ba5: Frame and visual tests. No API or behavior changes in this package; the version moves with the others (one shared version).

  - Playwright screenshot tests of the playground lock every preset at progress 0, 0.25, 0.5, 0.75 and 1 and in its Loading view, in light and dark. Baselines are made in the official Playwright Docker image, CI compares them on every push and pull request, and a failure uploads the expected, actual and diff images.
  - Reduced-motion checks in a real browser: `@veilo/css` loaders stop and rest on the base color, and `createReveal` reads the preference by itself and jumps straight to the end.
  - The playground opens paused on a frame with `?preset=<id>&p=<0..1>` and loads its fonts (Geist, IBM Plex Mono) from its own files instead of Google Fonts.

- Updated dependencies [69e8ba5]
  - @veilo/core@0.3.1

## 0.3.0

### Patch Changes

- Updated dependencies [38a00df]
  - @veilo/core@0.3.0

## 0.2.0

### Minor Changes

- 314dafe: CSS loaders package.

  - New package `@veilo/css`: a static `skeleton.css` with the classes `veilo` (still placeholder), `veilo-shimmer`, `veilo-wave` (set `--i` per element) and `veilo-pulse`, generated from the core generator with default settings. It also re-exports `generateLoaderCss`, `defaultSettings`, `parseSettings` and the types `LoaderCssOptions` and `Settings`.
  - `generateLoaderCss` output now stops the animation under `prefers-reduced-motion: reduce`, leaving a still base-color placeholder.
  - `generateLoaderCss` has a `radius` option (any CSS value, such as `var(--veilo-radius, 6px)`).
  - The fallback skeleton colors follow the Veilo design system: `#dcdcdc` and `#f7f7f7` (were `#dde5e6` and `#f6fafa`).
  - README sections on theming and accessibility (`aria-busy`, `aria-hidden`, measured contrast), and a plain HTML demo in `examples/css-demo`.

### Patch Changes

- Updated dependencies [314dafe]
  - @veilo/core@0.2.0
