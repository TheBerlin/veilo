// Tests for src/schema/version.ts: one version, used everywhere a settings object is made.

import { describe, expect, it } from "vitest";
import { defaultSettings } from "../../src/schema/defaults.ts";
import { settingsJsonSchema } from "../../src/schema/json-schema.ts";
import { parseSettings } from "../../src/schema/validate.ts";
import { SETTINGS_VERSION } from "../../src/schema/version.ts";

describe("SETTINGS_VERSION", () => {
  it("is 1 until the schema changes", () => {
    expect(SETTINGS_VERSION).toBe(1);
  });

  it("is the version of the defaults, of parsed settings and of the JSON Schema", () => {
    expect(defaultSettings().version).toBe(SETTINGS_VERSION);
    expect(parseSettings({ version: 99 }).settings.version).toBe(SETTINGS_VERSION);
    const properties = settingsJsonSchema().properties as Record<string, { const?: unknown }>;
    expect(properties.version?.const).toBe(SETTINGS_VERSION);
  });
});
