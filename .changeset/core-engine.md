---
"@veilo/core": minor
---

First usable core engine: skeleton loaders and reveal animations on real elements.

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
