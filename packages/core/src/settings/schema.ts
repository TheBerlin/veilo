import { COLOR_KEYS, COLOR_PATTERN, SETTINGS_SPEC, SETTINGS_VERSION } from "./spec.ts";

/**
 * Builds the JSON Schema for a settings file from the settings table.
 *
 * Nothing is required, because a settings file may set only some keys. The schema is
 * stricter than `parseSettings`: it flags unknown keys and out-of-range numbers, which
 * the parser would ignore or clamp. It leaves out `multipleOf`, since decimal steps such
 * as 0.05 cannot be checked reliably, and the spec's 1.04 default is off the step grid.
 *
 * @returns A JSON Schema (draft 2020-12) as a plain object.
 */
export function settingsJsonSchema(): Record<string, unknown> {
  const settings = Object.entries(SETTINGS_SPEC).map(([key, entry]) => {
    const shape =
      entry.kind === "number"
        ? { type: "number", minimum: entry.min, maximum: entry.max }
        : { type: "string", enum: entry.options };
    return [key, { ...shape, default: entry.default }];
  });
  const colors = COLOR_KEYS.map((key) => [key, { type: "string", pattern: COLOR_PATTERN.source }]);

  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    title: "Veilo settings",
    type: "object",
    additionalProperties: false,
    properties: {
      version: { const: SETTINGS_VERSION },
      ...Object.fromEntries(settings),
      ...Object.fromEntries(colors),
    },
  };
}
