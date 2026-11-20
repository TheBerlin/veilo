// gallery-filter.ts: the gallery page's search and filters, as pure functions: which effects it lists,
// which filter options exist, and which effects match a search and a set of chosen options. No DOM.

import { PRESETS, presetSettings, type PresetId } from "@veilo-ui/presets";
import { BADGE_NAMES, presetBadges, type BadgeKey } from "../home/gallery-tiles.ts";
import { optionsOf } from "../playground/panel/controls.ts";

/** The three settings the gallery filters by, in the order of their rows. */
export type GroupKey = BadgeKey;

/** One filter row: the setting it filters and the label on its row. */
export interface FilterGroup {
  /** The setting. */
  key: GroupKey;
  /** The row's label. */
  label: string;
}

/** The filter rows: how the effect loads, how the image is revealed, and how the text is. */
export const GROUPS: readonly FilterGroup[] = [
  { key: "effect", label: "Loader" },
  { key: "imageFx", label: "Image" },
  { key: "textFx", label: "Text" },
];

/** One effect of the gallery: a preset with what it can be searched and filtered by. */
export interface GalleryEntry {
  /** The preset's id. */
  id: PresetId;
  /** The preset's name. */
  name: string;
  /** The value of each filtered setting, such as `hex` for `imageFx`. */
  values: Readonly<Record<GroupKey, string>>;
  /** The short names shown as badges, in the rows' order. */
  badges: readonly string[];
}

/**
 * Every effect the gallery lists: all the presets, with the values of the settings it filters by
 * read from the preset itself, so a change to a preset changes how it is found.
 *
 * @returns The entries, in the presets' order.
 */
export function galleryEntries(): GalleryEntry[] {
  return PRESETS.map((preset) => {
    const settings = presetSettings(preset.id)!;
    return {
      id: preset.id,
      name: preset.name,
      values: { effect: settings.effect, imageFx: settings.imageFx, textFx: settings.textFx },
      badges: presetBadges(preset.id),
    };
  });
}

/** What the visitor has typed and chosen. */
export interface FilterState {
  /** The search text. */
  query: string;
  /** The chosen options of each row; none chosen means the row filters nothing. */
  chosen: Readonly<Record<GroupKey, readonly string[]>>;
}

/** No search and nothing chosen. */
export const NO_FILTERS: FilterState = {
  query: "",
  chosen: { effect: [], imageFx: [], textFx: [] },
};

/** One chip of a row. */
export interface FilterOption {
  /** The setting's value, such as `hex`. */
  value: string;
  /** The chip's text. */
  label: string;
  /** How many effects have it. */
  count: number;
}

/**
 * The chips of one row: the options of the setting that at least one effect uses, in the settings
 * schema's order. An option no effect has would be a chip that leads to nothing, so it is not
 * offered; it appears by itself when a preset starts using it.
 *
 * @param entries - The gallery's effects.
 * @param key - The row's setting.
 * @returns The options with their counts.
 */
export function optionsFor(entries: readonly GalleryEntry[], key: GroupKey): FilterOption[] {
  return optionsOf(key)
    .map((value) => ({
      value,
      label: BADGE_NAMES[key][value] ?? value,
      count: entries.filter((entry) => entry.values[key] === value).length,
    }))
    .filter((option) => option.count > 0);
}

/**
 * Whether an effect matches the search and the chosen options. Every word of the search must be in
 * the name or in a badge (case does not matter). Within a row, any chosen option matches; across
 * rows, every row that has a choice must match.
 *
 * @param entry - The effect.
 * @param state - The search and choices.
 * @returns True when the effect is listed.
 */
export function matches(entry: GalleryEntry, state: FilterState): boolean {
  const haystack = [entry.name, ...entry.badges].join(" ").toLowerCase();
  const words = state.query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.every((word) => haystack.includes(word))) return false;
  return GROUPS.every(({ key }) => {
    const chosen = state.chosen[key];
    return chosen.length === 0 || chosen.includes(entry.values[key]);
  });
}

/**
 * The effects that match.
 *
 * @param entries - The gallery's effects.
 * @param state - The search and choices.
 * @returns The matching effects, in their order.
 */
export function filterEntries(
  entries: readonly GalleryEntry[],
  state: FilterState,
): GalleryEntry[] {
  return entries.filter((entry) => matches(entry, state));
}

/**
 * Whether anything narrows the list: some text, or a chosen option.
 *
 * @param state - The search and choices.
 * @returns True when the list is filtered.
 */
export function isFiltered(state: FilterState): boolean {
  return state.query.trim() !== "" || GROUPS.some(({ key }) => state.chosen[key].length > 0);
}

/**
 * Chooses an option, or takes the choice back.
 *
 * @param state - The search and choices.
 * @param key - The row.
 * @param value - The option.
 * @returns The new state; the old one is not changed.
 */
export function toggleOption(state: FilterState, key: GroupKey, value: string): FilterState {
  const current = state.chosen[key];
  const next = current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value];
  return { ...state, chosen: { ...state.chosen, [key]: next } };
}

/**
 * The line that says how many effects are listed.
 *
 * @param shown - How many match.
 * @param total - How many there are.
 * @param filtered - Whether the list is narrowed.
 * @returns "7 effects", "1 effect" or "3 of 7 effects".
 */
export function countText(shown: number, total: number, filtered: boolean): string {
  const noun = (n: number) => (n === 1 ? "effect" : "effects");
  return filtered ? `${shown} of ${total} ${noun(total)}` : `${total} ${noun(total)}`;
}

/** The address parameter of each filter row. */
const PARAMS: Readonly<Record<GroupKey, string>> = {
  effect: "loader",
  imageFx: "image",
  textFx: "text",
};

/**
 * Reads the search and the chosen options from a query string, so a filtered view can be opened
 * from a link. An option the gallery does not offer is ignored, and so is a repeat of one, so a
 * broken or edited link opens the gallery with whatever in it is valid.
 *
 * @param search - The query string, with or without the leading `?`, such as `q=hex&loader=wave,pulse`.
 * @param entries - The gallery's effects, which decide which options exist.
 * @returns The state the query asks for.
 */
export function parseFilters(search: string, entries: readonly GalleryEntry[]): FilterState {
  const params = new URLSearchParams(search);
  const chosen = { ...NO_FILTERS.chosen };
  for (const { key } of GROUPS) {
    const offered = new Set(optionsFor(entries, key).map((option) => option.value));
    const wanted = (params.get(PARAMS[key]) ?? "").split(",").filter((value) => offered.has(value));
    // The row's order, not the link's, and each option once.
    chosen[key] = optionsFor(entries, key)
      .map((option) => option.value)
      .filter((value) => wanted.includes(value));
  }
  return { query: params.get("q") ?? "", chosen };
}

/**
 * The query string for a state: the inverse of {@link parseFilters}. Nothing chosen and no text
 * give an empty string, so an unfiltered gallery has a plain address.
 *
 * @param state - The search and choices.
 * @returns A query string with its leading `?`, or an empty string.
 */
export function filtersToSearch(state: FilterState): string {
  const params = new URLSearchParams();
  if (state.query.trim() !== "") params.set("q", state.query);
  for (const { key } of GROUPS) {
    if (state.chosen[key].length > 0) params.set(PARAMS[key], state.chosen[key].join(","));
  }
  const text = params.toString();
  return text === "" ? "" : `?${text}`;
}
