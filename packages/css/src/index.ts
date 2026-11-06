// index.ts: the public entry `@veilo/css`. Re-exports the loader CSS generator and the settings
// helpers it needs from `@veilo/core/loader`, so the formulas exist in one place only.
// No logic of its own; changing these exports is an API change.

export { defaultSettings, generateLoaderCss, parseSettings } from "@veilo/core/loader";
export type { LoaderCssOptions, Settings } from "@veilo/core/loader";
