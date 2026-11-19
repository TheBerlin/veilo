# @veilo-ui/element

## 0.7.0

### Minor Changes

- 56996f6: Use the shared `resolveConfig` and `configKey` from `@veilo/presets` instead of their own copies. No behavior change. `RevealConfig` and `LayoutInput` are now re-exported from `@veilo/presets`.

### Patch Changes

- Updated dependencies [56996f6]
- Updated dependencies [56996f6]
  - @veilo/presets@0.7.0
  - @veilo/core@0.7.0

## 0.6.0

### Minor Changes

- 8832ebb: No changes in these packages. The version moves with the others, which share one number.

### Patch Changes

- Updated dependencies [8832ebb]
- Updated dependencies [8832ebb]
  - @veilo/core@0.6.0
  - @veilo/presets@0.6.0

## 0.5.0

### Minor Changes

- 867e667: Web components and a CDN bundle in the new `@veilo/element` package. No API or behavior changes in the other packages; their versions move with it (one shared version).

  - `<veilo-reveal>` shows the skeleton on the `data-veilo-slot` elements inside it while the `loading` attribute is present and plays the reveal when it is removed. Attributes `preset`, `settings` and `layout` (JSON), `reveal-on-connect`; the `reveal` property gives the core reveal; a bubbling `veilo-complete` event fires each time a reveal finishes.
  - `<veilo-skeleton>` shows shimmer, wave or pulse while `loading` is present, with an `effect` shortcut, and restores the elements exactly when it ends.
  - No shadow DOM: the elements work on your own markup, and your CSS keeps applying to it. Removing an element from the page cancels every frame, timer and observer and restores the markup.
  - Entries: `@veilo/element` (the classes and `defineVeiloElements()`, registers nothing), `@veilo/element/define` (registers both tags), and `cdn.js`, one ES module with core, presets and Lit inside (about 14 KB gzipped) that registers itself. jsDelivr and unpkg serve it as the package's default file once it is on npm.
  - `examples/element-demo` is a plain HTML page with no build step; CI installs the packed packages into it and checks it in a browser.

### Patch Changes

- Updated dependencies [867e667]
  - @veilo/core@0.5.0
  - @veilo/presets@0.5.0
