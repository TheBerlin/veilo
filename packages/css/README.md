# @veilo/css

CSS skeleton loaders from [Veilo](../../README.md): shimmer, wave and pulse, with no JavaScript needed at runtime.

> **Status:** in development, not published yet. The API can still change before 1.0.

## Generate the CSS

```ts
import { generateLoaderCss, parseSettings } from "@veilo/css";

const { settings } = parseSettings({ effect: "wave", lDur: 1.6 });
const css = generateLoaderCss(settings);
```

The generator is the one in `@veilo/core`, re-exported here, so the CSS always matches what the core engine draws. See the [core README](../core/README.md) for the settings and `LoaderCssOptions`.
