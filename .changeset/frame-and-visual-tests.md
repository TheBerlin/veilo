---
"@veilo/core": patch
"@veilo/css": patch
"@veilo/presets": patch
"@veilo/ui": patch
---

Frame and visual tests. No API or behavior changes in this package; the version moves with the others (one shared version).

- Playwright screenshot tests of the playground lock every preset at progress 0, 0.25, 0.5, 0.75 and 1 and in its Loading view, in light and dark. Baselines are made in the official Playwright Docker image, CI compares them on every push and pull request, and a failure uploads the expected, actual and diff images.
- Reduced-motion checks in a real browser: `@veilo/css` loaders stop and rest on the base color, and `createReveal` reads the preference by itself and jumps straight to the end.
- The playground opens paused on a frame with `?preset=<id>&p=<0..1>` and loads its fonts (Geist, IBM Plex Mono) from its own files instead of Google Fonts.
