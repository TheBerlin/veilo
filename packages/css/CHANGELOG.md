# @veilo/css

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
