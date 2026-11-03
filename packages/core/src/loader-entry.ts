// loader-entry.ts: the public entry `@veilo/core/loader`. The loader CSS generator and the
// settings helpers, with no DOM or canvas code, for build tools, servers and CSS-only use.
// Like index.ts, nothing inside src imports it; changing its exports is an API change.

export { generateLoaderCss } from "./loader/css-generator.ts";
export type { LoaderCssOptions } from "./loader/css-generator.ts";
export { defaultSettings } from "./schema/defaults.ts";
export { settingsJsonSchema } from "./schema/json-schema.ts";
export type { ColorKey, SettingKey, Settings } from "./schema/types.ts";
export { parseSettings } from "./schema/validate.ts";
export type { ParsedSettings } from "./schema/validate.ts";
export { SETTINGS_VERSION } from "./schema/version.ts";
