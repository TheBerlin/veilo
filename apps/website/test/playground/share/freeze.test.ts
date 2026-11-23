// Tests for the compatibility of the formats users keep outside the app, in Node: share links and
// presets files. The files in golden/ are copies of what version 1 wrote when the formats were
// reviewed for the 1.0 freeze. They are not generated and must not be regenerated to make a test
// pass: a change that breaks one breaks links people already shared or files they saved. Not a
// mirror of one source file, by design.

import { defaultSettings, parseSettings } from "@veilo-ui/core";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { readPresetsFile } from "../../../src/playground/presets/presets-file.ts";
import { decodeShareLink } from "../../../src/playground/share/share-link.ts";

/**
 * Reads a golden file.
 *
 * @param name - The file name in golden/.
 * @returns The parsed JSON.
 */
function golden<T>(name: string): T {
  return JSON.parse(readFileSync(new URL(`golden/${name}`, import.meta.url), "utf8")) as T;
}

describe("share links, frozen at v1", () => {
  const links = golden<{
    full: { fragment: string; settings: Record<string, unknown> };
    partial: { fragment: string; payload: unknown };
  }>("share-links-v1.json");

  it("still decodes a link with every setting, and the settings read back unchanged", async () => {
    const result = await decodeShareLink(links.full.fragment);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.payload.settings).toEqual(links.full.settings);
    expect(parseSettings(result.payload.settings).settings).toEqual(links.full.settings);
  });

  it("still decodes a link with a few settings and some content, and fills in the rest", async () => {
    const result = await decodeShareLink(links.partial.fragment);
    expect(result).toEqual({ ok: true, payload: links.partial.payload });
    const settings = parseSettings((result as { payload: { settings: unknown } }).payload.settings);
    expect(settings.settings).toEqual({ ...defaultSettings(), imageFx: "hex", rDur: 1.6 });
  });
});

describe("presets files, frozen at v1", () => {
  it("still reads a file: checks every entry, cuts long names and counts the unusable", () => {
    const { file, expected } = golden<{
      file: unknown;
      expected: { names: string[]; firstChanges: Record<string, unknown>; skipped: number };
    }>("presets-file-v1.json");
    const result = readPresetsFile(JSON.stringify(file));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.entries.map((entry) => entry.name)).toEqual(expected.names);
    expect(result.entries[0]!.settings).toEqual({
      ...defaultSettings(),
      ...expected.firstChanges,
    });
    expect(result.skipped).toBe(expected.skipped);
  });
});
