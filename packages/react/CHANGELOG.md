# @veilo/react

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
