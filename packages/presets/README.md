# @veilo-ui/presets

The named presets of [Veilo](../../README.md), as typed data.

> **Status:** in development, not published yet. The API can still change before 1.0.

## Use

```ts
import { createReveal } from "@veilo-ui/core";
import { PRESETS, presetSettings } from "@veilo-ui/presets";

const reveal = createReveal(card, presetSettings("hex-from-center"));
```

| Export                     | Purpose                                                                             |
| -------------------------- | ----------------------------------------------------------------------------------- |
| `PRESETS`                  | Every preset: `{ id, name, settings }`, where `settings` holds only overrides       |
| `findPreset(id)`           | The preset with that id, or `undefined`                                             |
| `presetSettings(preset)`   | Complete settings (overrides over the defaults), or `undefined` for an unknown id   |
| `matchingPreset(settings)` | The preset whose complete settings equal these exactly, or `undefined`              |
| `resolveConfig(config)`    | Combines a preset, settings and a layout into core's input (see below)              |
| `configKey(config)`        | A string that is equal for equal configs, so a wrapper rebuilds only on real change |

Types: `Preset`, `PresetId`, `RevealConfig`, `LayoutInput`.

## For wrapper authors

Every Veilo wrapper (React, Vue, Svelte, Angular and the web components) takes the same `RevealConfig`: `preset`, `settings` and `layout`. `resolveConfig` applies them in one fixed order, lowest first: the layout's settings, the preset (which replaces them), then `settings`. It returns a layout when slot hints were given, otherwise plain settings. Core validates and clamps the result. `LayoutInput` is core's `Layout` with `settings` optional and partial, so the layout JSON of the playground can be pasted as it is.

## Presets

| id                 | Name                       |
| ------------------ | -------------------------- |
| `dot-upscale`      | Dot upscale (the defaults) |
| `hex-from-center`  | Hex from center            |
| `matrix-columns`   | Matrix columns             |
| `cascade-wave`     | Cascade wave               |
| `soft-pulse`       | Soft pulse                 |
| `compact-shimmer`  | Compact shimmer            |
| `mosaic-from-edge` | Mosaic from edge           |

Presets never set colors: a preset applies over the default settings and clears custom colors.
