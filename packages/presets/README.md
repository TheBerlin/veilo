# @veilo/presets

The named presets of [Veilo](../../README.md), as typed data.

> **Status:** in development, not published yet. The API can still change before 1.0.

## Use

```ts
import { createReveal } from "@veilo/core";
import { PRESETS, presetSettings } from "@veilo/presets";

const reveal = createReveal(card, presetSettings("hex-from-center"));
```

| Export                     | Purpose                                                                           |
| -------------------------- | --------------------------------------------------------------------------------- |
| `PRESETS`                  | Every preset: `{ id, name, settings }`, where `settings` holds only overrides     |
| `findPreset(id)`           | The preset with that id, or `undefined`                                           |
| `presetSettings(preset)`   | Complete settings (overrides over the defaults), or `undefined` for an unknown id |
| `matchingPreset(settings)` | The preset whose complete settings equal these exactly, or `undefined`            |

Types: `Preset`, `PresetId`.

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
