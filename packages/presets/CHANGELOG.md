# @veilo-ui/presets

## 0.7.0

### Minor Changes

- 56996f6: Adds `resolveConfig` and `configKey`, and the `RevealConfig` and `LayoutInput` types: the rules that combine a preset, settings and a layout into core's input, which every wrapper (React, Vue, Svelte, Angular and the web components) now shares instead of keeping its own copy. They apply in one fixed order, lowest first: the layout's settings, the preset, then `settings`. `LayoutInput` is core's `Layout` with `settings` optional and partial.

### Patch Changes

- Updated dependencies [56996f6]
  - @veilo/core@0.7.0

## 0.6.0

### Minor Changes

- 8832ebb: No changes in these packages. The version moves with the others, which share one number.

### Patch Changes

- Updated dependencies [8832ebb]
  - @veilo/core@0.6.0

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

## 0.4.1

### Patch Changes

- 75749f3: Calm surfaces for the design system. No API or behavior changes in the published packages; their versions move with the others (one shared version). The default skeleton colors of `@veilo/core` and `@veilo/css` stay neutral gray.

  - `@veilo/ui` tokens: calm near-black and near-white surfaces on one faint cool hue (dark `bg` `#16161a`, light `#f1f1f3`) instead of `#030303` / `#f1f1f1`, with softened text (about 14:1) and a monochrome accent equal to the text color. Both text tones reach WCAG AAA on the page and card surfaces, and the skeleton tokens follow the surfaces.
  - Light `warning` is now `#805300`, readable (4.9:1) on secondary fills; the token test checks every status color.
  - The animated dot-grid background is removed: `createDotGrid`, `DOT_GRID_DEFAULTS` and `DotGridBackground` are gone from `@veilo/ui` (internal, used only by the playground), and the playground's page and stage sit on plain surfaces.

- Updated dependencies [75749f3]
  - @veilo/core@0.4.1

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

## 0.3.1

### Patch Changes

- 69e8ba5: Frame and visual tests. No API or behavior changes in this package; the version moves with the others (one shared version).

  - Playwright screenshot tests of the playground lock every preset at progress 0, 0.25, 0.5, 0.75 and 1 and in its Loading view, in light and dark. Baselines are made in the official Playwright Docker image, CI compares them on every push and pull request, and a failure uploads the expected, actual and diff images.
  - Reduced-motion checks in a real browser: `@veilo/css` loaders stop and rest on the base color, and `createReveal` reads the preference by itself and jumps straight to the end.
  - The playground opens paused on a frame with `?preset=<id>&p=<0..1>` and loads its fonts (Geist, IBM Plex Mono) from its own files instead of Google Fonts.

- Updated dependencies [69e8ba5]
  - @veilo/core@0.3.1

## 0.3.0

### Minor Changes

- 38a00df: Design system and playground.

  - `@veilo/core`: new optional setting `inkColor` (`#rrggbb`) colors the dots and the hex and binary characters of grid reveals. It wins over the `ink` option and `--veilo-ink`. The settings version stays 1: settings saved without it read back unchanged.
  - `@veilo/core`: `reveal.redraw()` re-reads the ink color and redraws the current grid frame without changing playback, for theme changes.
  - `@veilo/core`: `EASING_CURVES` and the types `BezierCurve` and `EasingKey` are exported from `@veilo/core` and `@veilo/core/loader`.
  - `@veilo/core`: each line of a text placeholder is now its own rounded bar (the `radius` setting, capped at half the bar height); before, only the outer corners of the whole element were rounded.
  - New package `@veilo/presets`: the seven named presets as typed data, with `PRESETS`, `findPreset`, `presetSettings` and `matchingPreset`.
  - `@veilo/ui` (internal): design tokens, React components on Radix UI (Button, Chip, Toggle, Tabs, Tooltip, Slider, Scrubber, Select, ColorField, TextArea, CodeBlock, CurveEditor, Grid), and the animated dot-grid background.
  - The playground runs on Vercel with the test card, image source, transport bar, Loader, Reveal and Export tabs, presets, curve editor and light and dark themes.

### Patch Changes

- Updated dependencies [38a00df]
  - @veilo/core@0.3.0
