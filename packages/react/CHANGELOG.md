# @veilo-ui/react

## 0.9.0

### Patch Changes

- Updated dependencies [8198678]
- Updated dependencies [2d81c67]
- Updated dependencies [8888181]
  - @veilo-ui/core@0.9.0
  - @veilo-ui/presets@0.9.0

## 0.7.1

### Patch Changes

- fc06d4e: The packages are now named `@veilo-ui/*` (for example `@veilo-ui/core`), because the `@veilo` scope is taken on npm. Only the package names change: no API, behavior, CSS name or setting changes, and nothing was published under the old names.
- Updated dependencies [fc06d4e]
  - @veilo-ui/core@0.7.1
  - @veilo-ui/presets@0.7.1

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

- 8832ebb: The `layout` prop of `Reveal`, `Skeleton` and `useReveal` now accepts a layout whose `settings` hold only the keys you change (the new `LayoutInput` type). Core already filled in the rest at run time; the type did not allow it, so the layout JSON the playground exports could not be pasted as it was.

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

## 0.4.1

### Patch Changes

- 75749f3: Calm surfaces for the design system. No API or behavior changes in the published packages; their versions move with the others (one shared version). The default skeleton colors of `@veilo/core` and `@veilo/css` stay neutral gray.

  - `@veilo/ui` tokens: calm near-black and near-white surfaces on one faint cool hue (dark `bg` `#16161a`, light `#f1f1f3`) instead of `#030303` / `#f1f1f1`, with softened text (about 14:1) and a monochrome accent equal to the text color. Both text tones reach WCAG AAA on the page and card surfaces, and the skeleton tokens follow the surfaces.
  - Light `warning` is now `#805300`, readable (4.9:1) on secondary fills; the token test checks every status color.
  - The animated dot-grid background is removed: `createDotGrid`, `DOT_GRID_DEFAULTS` and `DotGridBackground` are gone from `@veilo/ui` (internal, used only by the playground), and the playground's page and stage sit on plain surfaces.

- Updated dependencies [75749f3]
  - @veilo/core@0.4.1
  - @veilo/presets@0.4.1

## 0.4.0

### Minor Changes

- 4fc2d5b: React package.

  - New package `@veilo/react`: `Reveal` (show the skeleton on a component's `data-veilo-slot` parts while `ready` is `false`, play the reveal when it turns `true`; `preset`, `settings`, `layout`, `revealOnMount`, `onComplete`, `as`), `Skeleton` (a loader while `loading` is `true`; `asChild` puts it on the single child with no extra element) and the `useReveal` hook for imperative control. Works with React 18.3 and 19 and with Strict Mode, cleans up every frame, timer and change on unmount, and renders the skeleton in server HTML before hydration.
  - `@veilo/core`: new `serverSkeletonCss(settings | layout, scope, options)`, from both entries: the skeleton stylesheet for server-rendered markup, the same CSS the live skeleton uses.
  - `@veilo/core`: fix: a reveal samples its image again when the picture changes (a `src` set after `createReveal`, as when data arrives later, or a late load). Before, the grid kept the first picture, such as an empty placeholder. A `play()` started meanwhile keeps the skeleton until the new picture is sampled, and `reveal.ready` resolves again.
  - `@veilo/css`, `@veilo/presets`, `@veilo/ui`: no changes; the version moves with the others (one shared version).

### Patch Changes

- Updated dependencies [4fc2d5b]
  - @veilo/core@0.4.0
  - @veilo/presets@0.4.0
