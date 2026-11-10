// version.ts: the current version of the settings format.
// Layer 0 (pure). Must not import DOM code.

// Version history. Adding an optional key keeps the version, because older objects still parse
// unchanged (a missing key takes its default); a key that is renamed, removed or changes meaning
// bumps it and needs a migration.
// - 1: first format (0.1.0). `inkColor` was added in 0.3.0 as an optional key, still version 1.

/** Current version of the settings format, stored in the `version` field of every settings object. */
export const SETTINGS_VERSION = 1;
