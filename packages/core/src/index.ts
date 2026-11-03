/**
 * index.ts: the public API. The only entry point; everything else is internal, so it can change
 * without breaking users. Adding or removing an export here is an API change: update the README
 * and test/index.test.ts with it.
 */

// Reveal: image, text and button reveal with loading, playback and cleanup.
export { createReveal } from "./controller/reveal.ts";
export type {
  Reveal,
  RevealEvents,
  RevealOptions,
  RevealState,
  RevealTargets,
} from "./controller/reveal.ts";

// The time source type for RevealOptions.scheduler, for tests that drive time by hand.
export type { Scheduler } from "./dom/env.ts";

// Skeleton: the loader on real elements.
export { createSkeleton } from "./loader/skeleton.ts";
export type { Skeleton, SkeletonOptions } from "./loader/skeleton.ts";

// Loader CSS: the shimmer, wave or pulse stylesheet for a set of settings.
export { generateLoaderCss } from "./loader/css-generator.ts";
export type { LoaderCssOptions } from "./loader/css-generator.ts";

// Settings: the one flat JSON object, its defaults, validation and JSON Schema.
export { defaultSettings } from "./schema/defaults.ts";
export { settingsJsonSchema } from "./schema/json-schema.ts";
export type { ColorKey, SettingKey, Settings } from "./schema/types.ts";
export { parseSettings } from "./schema/validate.ts";
export type { ParsedSettings } from "./schema/validate.ts";
export { SETTINGS_VERSION } from "./schema/version.ts";
