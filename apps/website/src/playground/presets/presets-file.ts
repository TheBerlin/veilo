// presets-file.ts: the presets file the Presets tab exports and imports, for moving presets to
// another browser or sharing a set. JSON: `{ format: "veilo-presets", version: 1, presets:
// [{ name, settings }] }`. Ids stay local to each browser, so they are not written.

import { newPresetId, readPresetEntry, uniqueName, type UserPreset } from "./user-presets.ts";

/** The file name offered on export when it holds several presets (or a name cannot be used). */
export const PRESETS_FILE_NAME = "veilo-presets.json";

/** The marker that tells a presets file from other JSON. */
export const PRESETS_FILE_FORMAT = "veilo-presets";

/** Format number of the file. A later format gets a new number. */
export const PRESETS_FILE_VERSION = 1;

/** The most a file may hold, so a huge file cannot freeze the page. */
export const PRESETS_FILE_LIMITS = { bytes: 1_000_000, presets: 500 } as const;

/** Why a file could not be imported. */
export type PresetsFileError = "large" | "json" | "format" | "newer" | "empty";

/** Messages for each {@link PresetsFileError}. */
export const PRESETS_FILE_ERRORS: Record<PresetsFileError, string> = {
  large: "That file is too large to be a presets file.",
  json: "That file is not valid JSON.",
  format: "That file is not a Veilo presets file.",
  newer: "That file was made by a newer version of Veilo.",
  empty: "That file has no presets that can be used.",
};

/** The result of {@link readPresetsFile}. */
export type PresetsFileResult =
  | { ok: true; entries: Omit<UserPreset, "id">[]; skipped: number }
  | { ok: false; error: PresetsFileError };

/**
 * Writes presets as the file's text, two-space indented so it reads well in an editor.
 *
 * @param presets - The presets to write.
 * @returns The JSON text.
 */
export function presetsFileText(presets: readonly UserPreset[]): string {
  const file = {
    format: PRESETS_FILE_FORMAT,
    version: PRESETS_FILE_VERSION,
    presets: presets.map(({ name, settings }) => ({ name, settings })),
  };
  return `${JSON.stringify(file, null, 2)}\n`;
}

/**
 * Reads a presets file. Each entry is checked like a saved preset (name cut to 40 characters,
 * settings clamped); entries that cannot be used are counted as skipped, as are entries past
 * {@link PRESETS_FILE_LIMITS}.presets.
 *
 * @param text - The file's text.
 * @returns The usable entries and how many were skipped, or why the file cannot be used.
 */
export function readPresetsFile(text: string): PresetsFileResult {
  // Characters, not bytes, but close enough for a limit that only stops absurd files.
  if (text.length > PRESETS_FILE_LIMITS.bytes) return { ok: false, error: "large" };
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return { ok: false, error: "json" };
  }
  const file = value as { format?: unknown; version?: unknown; presets?: unknown } | null;
  if (file?.format !== PRESETS_FILE_FORMAT || !Array.isArray(file.presets)) {
    return { ok: false, error: "format" };
  }
  if (file.version !== PRESETS_FILE_VERSION) {
    const newer = typeof file.version === "number" && file.version > PRESETS_FILE_VERSION;
    return { ok: false, error: newer ? "newer" : "format" };
  }
  const entries: Omit<UserPreset, "id">[] = [];
  for (const raw of file.presets.slice(0, PRESETS_FILE_LIMITS.presets)) {
    const entry = readPresetEntry(raw);
    if (entry) entries.push(entry);
  }
  if (entries.length === 0) return { ok: false, error: "empty" };
  return { ok: true, entries, skipped: file.presets.length - entries.length };
}

/**
 * Adds imported entries after the current list, each with a new id and a name that does not
 * clash (`Name (2)` and so on).
 *
 * @param presets - The current list.
 * @param entries - Entries from {@link readPresetsFile}.
 * @returns The new list.
 */
export function mergePresets(
  presets: readonly UserPreset[],
  entries: readonly Omit<UserPreset, "id">[],
): UserPreset[] {
  const merged = [...presets];
  for (const entry of entries) {
    merged.push({
      id: newPresetId(),
      name: uniqueName(entry.name, merged),
      settings: entry.settings,
    });
  }
  return merged;
}

/**
 * The message after an import.
 *
 * @param added - How many presets were added.
 * @param skipped - How many entries could not be used.
 * @returns For example "Added 3 presets. 1 entry could not be used."
 */
export function importMessage(added: number, skipped: number): string {
  const main = `Added ${added} ${added === 1 ? "preset" : "presets"}.`;
  if (skipped === 0) return main;
  return `${main} ${skipped} ${skipped === 1 ? "entry" : "entries"} could not be used.`;
}

/**
 * The file name to offer on export. A file with one preset is named after it ("Soft pulse.json"),
 * with the characters that file systems reject (backslash, slash, colon, asterisk, question mark,
 * quote, angle brackets, bar and control characters)
 * replaced by a hyphen and the name cut to 60 characters. A file with several presets, or a name
 * with nothing usable in it, gets {@link PRESETS_FILE_NAME}.
 *
 * @param presets - The presets being exported.
 * @returns The suggested file name, ending in `.json`.
 */
export function presetsFileName(presets: readonly { name: string }[]): string {
  if (presets.length !== 1) return PRESETS_FILE_NAME;
  const base = presets[0]!.name
    // eslint-disable-next-line no-control-regex -- control characters are exactly what is removed
    .replace(/[\\/:*?"<>|\u0000-\u001f]+/g, "-")
    .trim()
    .replace(/^[.\- ]+|[. ]+$/g, "")
    .slice(0, 60)
    .trim();
  return base ? `${base}.json` : PRESETS_FILE_NAME;
}

/**
 * Offers text as a file download. Side effects: creates an object URL and a temporary link,
 * clicks it, and removes both.
 *
 * @param text - The file's content.
 * @param fileName - The suggested file name.
 */
export function downloadText(text: string, fileName: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  // Revoked on the next task: some browsers start the download only after the click returns.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
