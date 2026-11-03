// types.ts: TypeScript types derived from the settings table.
// Layer 0 (pure). Must not import DOM code.

import type { COLOR_KEYS, SETTINGS_SPEC } from "./ranges.ts";
import type { SETTINGS_VERSION } from "./version.ts";

/** Name of a setting in the table. */
export type SettingKey = keyof typeof SETTINGS_SPEC;

/** Name of an optional color override. */
export type ColorKey = (typeof COLOR_KEYS)[number];

/** The value type of a table row: `number`, or the union of its options. */
type SettingValue<Entry> = Entry extends { readonly kind: "number" }
  ? number
  : Entry extends { readonly options: readonly (infer Option)[] }
    ? Option
    : never;

/** The flat settings object shared by the playground, the exports and the packages. */
export type Settings = { version: typeof SETTINGS_VERSION } & {
  [Key in SettingKey]: SettingValue<(typeof SETTINGS_SPEC)[Key]>;
} & { [Key in ColorKey]?: string };
