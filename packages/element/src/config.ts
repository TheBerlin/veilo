// config.ts: reads the JSON attributes (`settings`, `layout`) of the elements. The rules that
// combine a preset, settings and a layout are shared with the other wrappers, in @veilo-ui/presets.

/**
 * Parses a JSON attribute (`settings`, `layout`). Invalid JSON, or JSON that is not an object,
 * is ignored with a console warning, so one typo never breaks the page.
 *
 * Side effects: logs a warning for a value that is not a JSON object.
 *
 * @param value - The attribute value, or null when the attribute is absent.
 * @returns The parsed object, or undefined when absent or invalid.
 */
export function parseJsonAttribute(value: string | null): object | undefined {
  if (value === null || value.trim() === "") return undefined;
  try {
    const parsed: unknown = JSON.parse(value);
    if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
  } catch {
    // Reported below, like a value of the wrong shape.
  }
  console.warn(`[veilo] Ignored an attribute that is not a JSON object: ${value}`);
  return undefined;
}

/** Lit attribute converter for the JSON attributes; reading only, they are never reflected. */
export const jsonAttribute = { fromAttribute: parseJsonAttribute };
