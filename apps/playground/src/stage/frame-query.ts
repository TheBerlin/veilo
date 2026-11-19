// frame-query.ts: reads a fixed-frame request (`?preset=<id>&p=<0..1>`) from the page URL, so
// visual tests can open the playground paused at an exact progress.

import { findPreset, type Preset } from "@veilo-ui/presets";

/** A request to open the playground on one preset, paused at one progress. */
export interface FrameRequest {
  /** The preset whose settings the card starts with. */
  preset: Preset;
  /** The reveal progress to hold, from 0 to 1. */
  p: number;
}

/**
 * Parses a fixed-frame request from a URL query string. Both `preset` (a preset id) and `p` (a
 * number) must be present; `p` is clamped to 0..1. Anything else means no request, and the
 * playground starts as usual.
 *
 * @param search - The query string, with or without the leading `?`.
 * @returns The request, or `null` when the query asks for no valid frame.
 */
export function parseFrameQuery(search: string): FrameRequest | null {
  const params = new URLSearchParams(search);
  const id = params.get("preset");
  const raw = params.get("p");
  if (id === null || raw === null || raw.trim() === "") return null;
  const preset = findPreset(id);
  // Number("") is 0 and Number("1e0") is 1; only finite numbers count.
  const value = Number(raw);
  if (!preset || !Number.isFinite(value)) return null;
  return { preset, p: Math.min(1, Math.max(0, value)) };
}
