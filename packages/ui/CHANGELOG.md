# @veilo/ui

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
