# @veilo-ui/core

## 0.9.0

### Minor Changes

- 2d81c67: Changes from the review of the settings format before its freeze at 1.0.

  - **The loader's default easing is now `inOut`** (it was `out`), and the skeleton's fallback colors are `#d4d4d4` and `#f8f8f8` (they were `#dcdcdc` and `#f7f7f7`). With `out`, the highlight crossed each bar in a quick flash and then left a long still; the new defaults give a steadier glide and raise the band's contrast against the base from 1.28 to 1.40. Anything that leaves `lEase` unset, `skeleton.css` and every preset that does not set its own easing look different. Settings that name `lEase` are unchanged.
  - **`cols` is a whole number.** A fraction such as `64.5` is rounded when it is read, and the JSON Schema says `integer`.
  - **`parseSettings` and `parseLayout` report a newer version.** When the input's `version` is newer than the package reads, the result has `newerVersion`. The input is still read leniently, as before.
  - Golden tests now pin the settings table, layouts, share links and presets files.

### Patch Changes

- 8198678: Hold a seeked frame: after `seek(p)` the reveal no longer starts running again when its element scrolls into view. Before, a card seeked while off screen played on from that frame as soon as it became visible. `resume()` still continues from the held frame.
- 8888181: Keep the scramble and typewriter overlay of a one-line text on one line. The scrambled characters are wider or narrower than the real ones, so the overlay of a title could wrap onto a second line and jump over the next element. It now stays on one line and is clipped at the element's edge. Multi-line text still wraps like the real text.

## 0.7.1

### Patch Changes

- fc06d4e: The packages are now named `@veilo-ui/*` (for example `@veilo-ui/core`), because the `@veilo` scope is taken on npm. Only the package names change: no API, behavior, CSS name or setting changes, and nothing was published under the old names.

## 0.7.0

### Minor Changes

- 56996f6: No changes in these packages. The version moves with the others, which share one number.

## 0.6.0

### Minor Changes

- 8832ebb: `reducedMotion` now controls the skeleton as well as the reveal. `generateLoaderCss`, `createSkeleton` and `createReveal` accept it: `true` writes the rule that stops the animation, `false` leaves the media rule out so the animation always runs (the playground's reduced-motion preview uses this), and leaving it out keeps the old output byte for byte. `serverSkeletonCss` still follows the visitor's setting.

## 0.5.0

### Minor Changes

- 867e667: Web components and a CDN bundle in the new `@veilo/element` package. No API or behavior changes in the other packages; their versions move with it (one shared version).

  - `<veilo-reveal>` shows the skeleton on the `data-veilo-slot` elements inside it while the `loading` attribute is present and plays the reveal when it is removed. Attributes `preset`, `settings` and `layout` (JSON), `reveal-on-connect`; the `reveal` property gives the core reveal; a bubbling `veilo-complete` event fires each time a reveal finishes.
  - `<veilo-skeleton>` shows shimmer, wave or pulse while `loading` is present, with an `effect` shortcut, and restores the elements exactly when it ends.
  - No shadow DOM: the elements work on your own markup, and your CSS keeps applying to it. Removing an element from the page cancels every frame, timer and observer and restores the markup.
  - Entries: `@veilo/element` (the classes and `defineVeiloElements()`, registers nothing), `@veilo/element/define` (registers both tags), and `cdn.js`, one ES module with core, presets and Lit inside (about 14 KB gzipped) that registers itself. jsDelivr and unpkg serve it as the package's default file once it is on npm.
  - `examples/element-demo` is a plain HTML page with no build step; CI installs the packed packages into it and checks it in a browser.

## 0.4.1

### Patch Changes

- 75749f3: Calm surfaces for the design system. No API or behavior changes in the published packages; their versions move with the others (one shared version). The default skeleton colors of `@veilo/core` and `@veilo/css` stay neutral gray.

  - `@veilo/ui` tokens: calm near-black and near-white surfaces on one faint cool hue (dark `bg` `#16161a`, light `#f1f1f3`) instead of `#030303` / `#f1f1f1`, with softened text (about 14:1) and a monochrome accent equal to the text color. Both text tones reach WCAG AAA on the page and card surfaces, and the skeleton tokens follow the surfaces.
  - Light `warning` is now `#805300`, readable (4.9:1) on secondary fills; the token test checks every status color.
  - The animated dot-grid background is removed: `createDotGrid`, `DOT_GRID_DEFAULTS` and `DotGridBackground` are gone from `@veilo/ui` (internal, used only by the playground), and the playground's page and stage sit on plain surfaces.

## 0.4.0

### Minor Changes

- 4fc2d5b: React package.

  - New package `@veilo/react`: `Reveal` (show the skeleton on a component's `data-veilo-slot` parts while `ready` is `false`, play the reveal when it turns `true`; `preset`, `settings`, `layout`, `revealOnMount`, `onComplete`, `as`), `Skeleton` (a loader while `loading` is `true`; `asChild` puts it on the single child with no extra element) and the `useReveal` hook for imperative control. Works with React 18.3 and 19 and with Strict Mode, cleans up every frame, timer and change on unmount, and renders the skeleton in server HTML before hydration.
  - `@veilo/core`: new `serverSkeletonCss(settings | layout, scope, options)`, from both entries: the skeleton stylesheet for server-rendered markup, the same CSS the live skeleton uses.
  - `@veilo/core`: fix: a reveal samples its image again when the picture changes (a `src` set after `createReveal`, as when data arrives later, or a late load). Before, the grid kept the first picture, such as an empty placeholder. A `play()` started meanwhile keeps the skeleton until the new picture is sampled, and `reveal.ready` resolves again.
  - `@veilo/css`, `@veilo/presets`, `@veilo/ui`: no changes; the version moves with the others (one shared version).

## 0.3.1

### Patch Changes

- 69e8ba5: Frame and visual tests. No API or behavior changes in this package; the version moves with the others (one shared version).

  - Playwright screenshot tests of the playground lock every preset at progress 0, 0.25, 0.5, 0.75 and 1 and in its Loading view, in light and dark. Baselines are made in the official Playwright Docker image, CI compares them on every push and pull request, and a failure uploads the expected, actual and diff images.
  - Reduced-motion checks in a real browser: `@veilo/css` loaders stop and rest on the base color, and `createReveal` reads the preference by itself and jumps straight to the end.
  - The playground opens paused on a frame with `?preset=<id>&p=<0..1>` and loads its fonts (Geist, IBM Plex Mono) from its own files instead of Google Fonts.

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
