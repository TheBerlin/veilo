// Tests for src/gallery/gallery-filter.ts, in Node: the gallery's search and filters.

import { PRESETS } from "@veilo-ui/presets";
import { describe, expect, it } from "vitest";
import {
  countText,
  filtersToSearch,
  filterEntries,
  galleryEntries,
  GROUPS,
  isFiltered,
  matches,
  NO_FILTERS,
  optionsFor,
  parseFilters,
  toggleOption,
  type FilterState,
} from "../../src/gallery/gallery-filter.ts";

const entries = galleryEntries();

/**
 * A state with some options chosen and some text typed.
 *
 * @param query - The search text.
 * @param chosen - The chosen options by row.
 * @returns The state.
 */
function state(query = "", chosen: Partial<FilterState["chosen"]> = {}): FilterState {
  return { query, chosen: { ...NO_FILTERS.chosen, ...chosen } };
}

/**
 * The ids of the effects that match.
 *
 * @param filters - The state.
 * @returns The matching preset ids.
 */
const idsFor = (filters: FilterState) => filterEntries(entries, filters).map((entry) => entry.id);

describe("galleryEntries", () => {
  it("lists every preset, in the presets' order", () => {
    expect(entries.map((entry) => entry.id)).toEqual(PRESETS.map((preset) => preset.id));
  });

  it("reads each effect's values and badges from the preset itself", () => {
    const hex = entries.find((entry) => entry.id === "hex-from-center")!;
    expect(hex.values).toEqual({ effect: "shimmer", imageFx: "hex", textFx: "scramble" });
    expect(hex.badges).toEqual(["Shimmer", "Hex", "Scramble"]);
  });
});

describe("optionsFor", () => {
  it("offers only options some effect has, with how many, in the schema's order", () => {
    expect(optionsFor(entries, "effect").map((o) => [o.value, o.count])).toEqual([
      ["shimmer", 5],
      ["wave", 1],
      ["pulse", 1],
    ]);
    // Every chip leads somewhere: no option with a count of zero.
    for (const { key } of GROUPS) {
      for (const option of optionsFor(entries, key)) expect(option.count).toBeGreaterThan(0);
    }
  });

  it("names a chip as its badge, and the counts of a row add up to the effects", () => {
    expect(optionsFor(entries, "imageFx").map((o) => o.label)).toContain("Hex");
    for (const { key } of GROUPS) {
      const total = optionsFor(entries, key).reduce((sum, option) => sum + option.count, 0);
      expect(total).toBe(entries.length);
    }
  });
});

describe("matches and filterEntries", () => {
  it("lists everything when there is no search and nothing is chosen", () => {
    expect(idsFor(NO_FILTERS)).toHaveLength(7);
  });

  it("searches the name and the badges, whatever the case", () => {
    expect(idsFor(state("hex"))).toEqual(["hex-from-center"]);
    expect(idsFor(state("MOSAIC"))).toEqual(["mosaic-from-edge"]);
    // A word of the name.
    expect(idsFor(state("wave"))).toEqual(["cascade-wave"]);
    // A badge that is not in the name: Cascade wave's text effect.
    expect(idsFor(state("rise"))).toEqual(["cascade-wave"]);
  });

  it("needs every word of the search, in any order", () => {
    expect(idsFor(state("shimmer scramble")).sort()).toEqual(
      ["dot-upscale", "hex-from-center", "matrix-columns"].sort(),
    );
    expect(idsFor(state("scramble shimmer")).sort()).toEqual(
      idsFor(state("shimmer scramble")).sort(),
    );
    expect(idsFor(state("hex wave"))).toEqual([]);
  });

  it("ignores extra spaces around the words", () => {
    expect(idsFor(state("  hex   "))).toEqual(["hex-from-center"]);
  });

  it("within a row any chosen option matches", () => {
    expect(idsFor(state("", { effect: ["wave", "pulse"] })).sort()).toEqual(
      ["cascade-wave", "soft-pulse"].sort(),
    );
  });

  it("across rows every row with a choice must match", () => {
    expect(idsFor(state("", { effect: ["shimmer"], textFx: ["scramble"] }))).toHaveLength(3);
    expect(idsFor(state("", { effect: ["shimmer"], textFx: ["typewriter"] }))).toEqual([
      "mosaic-from-edge",
    ]);
    expect(idsFor(state("", { effect: ["wave"], textFx: ["scramble"] }))).toEqual([]);
  });

  it("combines the search with the chips", () => {
    expect(idsFor(state("hex", { effect: ["shimmer"] }))).toEqual(["hex-from-center"]);
    expect(idsFor(state("hex", { effect: ["wave"] }))).toEqual([]);
  });

  it("matches one entry the same as filterEntries does", () => {
    for (const entry of entries) {
      expect(matches(entry, state("", { imageFx: ["hex"] }))).toBe(entry.values.imageFx === "hex");
    }
  });
});

describe("isFiltered and toggleOption", () => {
  it("is filtered by text or by a chosen option, and not by blank text", () => {
    expect(isFiltered(NO_FILTERS)).toBe(false);
    expect(isFiltered(state("   "))).toBe(false);
    expect(isFiltered(state("hex"))).toBe(true);
    expect(isFiltered(state("", { textFx: ["fade"] }))).toBe(true);
  });

  it("chooses an option and takes it back, without changing the old state", () => {
    const one = toggleOption(NO_FILTERS, "imageFx", "hex");
    expect(one.chosen.imageFx).toEqual(["hex"]);
    expect(NO_FILTERS.chosen.imageFx).toEqual([]);
    const two = toggleOption(one, "imageFx", "dots");
    expect(two.chosen.imageFx).toEqual(["hex", "dots"]);
    expect(toggleOption(two, "imageFx", "hex").chosen.imageFx).toEqual(["dots"]);
    // The other rows are untouched.
    expect(two.chosen.effect).toEqual([]);
  });
});

describe("countText", () => {
  it("says how many, and of how many when narrowed", () => {
    expect(countText(7, 7, false)).toBe("7 effects");
    expect(countText(3, 7, true)).toBe("3 of 7 effects");
    expect(countText(0, 7, true)).toBe("0 of 7 effects");
    expect(countText(1, 1, false)).toBe("1 effect");
  });
});

describe("filters in the address", () => {
  it("reads the search and the chosen options from a query", () => {
    const state = parseFilters("?q=hex%20cen&loader=wave,shimmer&text=scramble", entries);
    expect(state.query).toBe("hex cen");
    // In the row's order, not the link's.
    expect(state.chosen.effect).toEqual(["shimmer", "wave"]);
    expect(state.chosen.textFx).toEqual(["scramble"]);
    expect(state.chosen.imageFx).toEqual([]);
  });

  it("ignores options that are not offered, and repeats", () => {
    const state = parseFilters("loader=wave,wave,bogus&image=nope", entries);
    expect(state.chosen.effect).toEqual(["wave"]);
    expect(state.chosen.imageFx).toEqual([]);
  });

  it("an empty or unrelated query is no filters", () => {
    expect(parseFilters("", entries)).toEqual(NO_FILTERS);
    expect(parseFilters("?utm=1", entries)).toEqual(NO_FILTERS);
  });

  it("writes a state back, and nothing for no filters", () => {
    expect(filtersToSearch(NO_FILTERS)).toBe("");
    expect(filtersToSearch({ ...NO_FILTERS, query: "   " })).toBe("");
    const state = toggleOption({ ...NO_FILTERS, query: "a b" }, "effect", "wave");
    expect(filtersToSearch(state)).toBe("?q=a+b&loader=wave");
    expect(parseFilters(filtersToSearch(state), entries)).toEqual(state);
  });
});
