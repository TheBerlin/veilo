// layout.ts: the layout JSON, which pairs effect settings with a map of slots in the markup.
// Layer 0 (pure). Must not import DOM code.

import type { Settings } from "./types.ts";
import { parseSettings } from "./validate.ts";

/** Current version of the layout format, stored in its `version` field. */
export const LAYOUT_VERSION = 1;

/** What a slot is: the photo, a line of text, the button, or a placeholder-only block. */
export const SLOT_ROLES = ["image", "text", "button", "block"] as const;

/** One of {@link SLOT_ROLES}. */
export type SlotRole = (typeof SLOT_ROLES)[number];

/**
 * Hints for one slot. Sizes and positions always come from the element and its CSS; hints only
 * shape the skeleton placeholder.
 */
export interface SlotHint {
  /** The slot's role. Guessed from the element when missing. */
  role?: SlotRole;
  /** Lines of text the placeholder shows while the element is empty, 1 to 20. */
  lines?: number;
  /** Width of the last placeholder line, in percent of the element, 1 to 100. */
  width?: number;
}

/** The layout JSON: version, effect settings and slots by name. */
export interface Layout {
  version: typeof LAYOUT_VERSION;
  settings: Settings;
  /** Slot hints by the slot name used in the `data-veilo-slot` attribute. */
  slots: Record<string, SlotHint>;
}

const MAX_LINES = 20;

/**
 * Reads one slot entry. Invalid fields are dropped; numbers are clamped.
 *
 * @param input - The raw entry.
 * @returns The hint, possibly empty.
 */
function readHint(input: unknown): SlotHint {
  if (typeof input !== "object" || input === null || Array.isArray(input)) return {};
  const source = input as Record<string, unknown>;
  const hint: SlotHint = {};
  if (typeof source.role === "string" && (SLOT_ROLES as readonly string[]).includes(source.role)) {
    hint.role = source.role as SlotRole;
  }
  if (typeof source.lines === "number" && Number.isFinite(source.lines)) {
    hint.lines = Math.min(MAX_LINES, Math.max(1, Math.round(source.lines)));
  }
  if (typeof source.width === "number" && Number.isFinite(source.width)) {
    hint.width = Math.min(100, Math.max(1, source.width));
  }
  return hint;
}

/**
 * Builds a layout from untrusted input, such as imported JSON.
 *
 * Accepts a layout (`{ settings, slots }`) or plain settings, which become a layout with no
 * slots. Settings go through `parseSettings`. Slot entries keep only valid fields, with numbers
 * clamped; entries that are not objects become empty hints. The input is not changed.
 *
 * @param input - Any value.
 * @returns A complete layout.
 */
export function parseLayout(input: unknown): Layout {
  const source =
    typeof input === "object" && input !== null && !Array.isArray(input)
      ? (input as Record<string, unknown>)
      : {};
  const isLayout = "settings" in source || "slots" in source;
  const settings = parseSettings(isLayout ? source.settings : source).settings;

  const rawSlots = isLayout ? source.slots : undefined;
  const slots =
    typeof rawSlots === "object" && rawSlots !== null && !Array.isArray(rawSlots)
      ? // fromEntries defines own properties, so a "__proto__" slot name cannot reach a prototype.
        Object.fromEntries(
          Object.entries(rawSlots)
            .filter(([name]) => name.trim() !== "")
            .map(([name, hint]) => [name.trim(), readHint(hint)]),
        )
      : {};

  return { version: LAYOUT_VERSION, settings, slots };
}
