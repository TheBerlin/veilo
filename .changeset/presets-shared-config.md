---
"@veilo/presets": minor
---

Adds `resolveConfig` and `configKey`, and the `RevealConfig` and `LayoutInput` types: the rules that combine a preset, settings and a layout into core's input, which every wrapper (React, Vue, Svelte, Angular and the web components) now shares instead of keeping its own copy. They apply in one fixed order, lowest first: the layout's settings, the preset, then `settings`. `LayoutInput` is core's `Layout` with `settings` optional and partial.
