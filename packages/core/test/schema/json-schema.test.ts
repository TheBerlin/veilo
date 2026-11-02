// Tests for src/schema/json-schema.ts: the schema matches the table and the committed file.

import { describe, expect, it } from "vitest";
import committedSchema from "../../settings.schema.json";
import { settingsJsonSchema } from "../../src/schema/json-schema.ts";
import { COLOR_KEYS, COLOR_PATTERN, SETTINGS_SPEC } from "../../src/schema/ranges.ts";
import { SETTINGS_VERSION } from "../../src/schema/version.ts";

const schema = settingsJsonSchema();
const properties = schema.properties as Record<string, Record<string, unknown>>;

describe("settingsJsonSchema", () => {
  it("lists exactly the table keys, the colors and the version", () => {
    expect(Object.keys(properties).sort()).toEqual(
      [...Object.keys(SETTINGS_SPEC), ...COLOR_KEYS, "version"].sort(),
    );
    expect(schema.additionalProperties).toBe(false);
  });

  it("matches the table row for every setting", () => {
    for (const [key, entry] of Object.entries(SETTINGS_SPEC)) {
      expect(properties[key]).toEqual(
        entry.kind === "number"
          ? { type: "number", minimum: entry.min, maximum: entry.max, default: entry.default }
          : { type: "string", enum: entry.options, default: entry.default },
      );
    }
  });

  it("describes the colors and the version", () => {
    expect(properties.baseColor?.pattern).toBe(COLOR_PATTERN.source);
    expect(properties.version).toEqual({ const: SETTINGS_VERSION });
  });

  it("matches the committed file (run pnpm generate:schema after changing the table)", () => {
    expect(committedSchema).toEqual(schema);
  });
});
