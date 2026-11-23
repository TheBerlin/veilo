// Tests for src/gallery/effects.ts: the effect table and the rules for labels, seasons and order.

import { describe, expect, it } from "vitest";
import {
  EFFECTS,
  FIRST_PUBLIC_RELEASE,
  SEASONS,
  effectiveDate,
  isInSeason,
  isNew,
  labelPreview,
  labelsFor,
  metaLine,
  sortEffects,
  splitBySeason,
  type GalleryEffect,
} from "../../src/gallery/effects.ts";
import { EFFECT_IDS, usesFlakeShape } from "@veilo-ui/seasonal";

/**
 * A local date in 2026.
 *
 * @param month - Month 1 to 12.
 * @param day - Day of the month.
 * @returns The date at noon.
 */
const on = (month: number, day: number) => new Date(2026, month - 1, day, 12);

/** An effect with the given release, for the "New" rule. */
const added = (since: string): GalleryEffect => ({ ...EFFECTS[0]!, since });

describe("EFFECTS", () => {
  it("has one entry per drawing routine, each once", () => {
    expect(EFFECTS.map((effect) => effect.id).sort()).toEqual([...EFFECT_IDS].sort());
  });

  it("has a unique Featured rank 1 to N and a unique arrival number", () => {
    const n = EFFECTS.length;
    expect(EFFECTS.map((effect) => effect.rank).sort((a, b) => a - b)).toEqual(
      Array.from({ length: n }, (_, i) => i + 1),
    );
    expect(new Set(EFFECTS.map((effect) => effect.added)).size).toBe(n);
  });

  it("puts Snow on the bars first, as the best idea", () => {
    expect(sortEffects(EFFECTS, "featured")[0]!.name).toBe("Snow on the bars");
  });

  it("has a release number of the form x.y.z and a plain sentence for every effect", () => {
    for (const effect of EFFECTS) {
      expect(effect.since, effect.name).toMatch(/^\d+\.\d+\.\d+$/);
      expect(effect.does.endsWith("."), effect.name).toBe(true);
      expect(effect.does.length, effect.name).toBeGreaterThan(20);
    }
  });

  it("makes only Snow on the bars and Blizzard dissolve independent of the flake form", () => {
    const fixed = EFFECTS.filter((effect) => !usesFlakeShape(effect.id)).map(
      (effect) => effect.name,
    );
    expect(fixed).toEqual(["Snow on the bars", "Blizzard dissolve"]);
  });
});

describe("isInSeason", () => {
  it("covers December 1 to January 10, inclusive, over New Year", () => {
    expect(isInSeason("christmas", on(11, 30))).toBe(false);
    expect(isInSeason("christmas", on(12, 1))).toBe(true);
    expect(isInSeason("christmas", on(12, 31))).toBe(true);
    expect(isInSeason("christmas", on(1, 1))).toBe(true);
    expect(isInSeason("christmas", on(1, 10))).toBe(true);
    expect(isInSeason("christmas", on(1, 11))).toBe(false);
    expect(isInSeason("christmas", on(7, 1))).toBe(false);
  });

  it("also works for a window inside one year", () => {
    const original = SEASONS.christmas.window;
    SEASONS.christmas.window = { startMonth: 3, startDay: 1, endMonth: 4, endDay: 30 };
    try {
      expect(isInSeason("christmas", on(2, 28))).toBe(false);
      expect(isInSeason("christmas", on(3, 1))).toBe(true);
      expect(isInSeason("christmas", on(4, 30))).toBe(true);
      expect(isInSeason("christmas", on(5, 1))).toBe(false);
    } finally {
      SEASONS.christmas.window = original;
    }
  });
});

describe("isNew", () => {
  it("is true while the effect's release is the latest", () => {
    expect(isNew(added("0.9.0"), "0.9.0")).toBe(true);
    expect(isNew(added("0.8.0"), "0.9.0")).toBe(false);
  });

  it("never labels anything on the first public release, when everything is new", () => {
    expect(isNew(added(FIRST_PUBLIC_RELEASE), FIRST_PUBLIC_RELEASE)).toBe(false);
  });

  it("stops by itself at the next release", () => {
    const effect = added("0.9.0");
    expect(isNew(effect, "0.9.0")).toBe(true);
    expect(isNew(effect, "0.9.1")).toBe(false);
  });
});

describe("labelsFor", () => {
  const seasonal = (): GalleryEffect => ({ ...EFFECTS[0]!, since: "0.9.0", season: "christmas" });

  it("gives New first and the season second, at most two", () => {
    const labels = labelsFor(seasonal(), { latest: "0.9.0", now: on(12, 15), showSeason: true });
    expect(labels).toEqual([
      { text: "New", tone: "new" },
      { text: "Christmas time", tone: "season" },
    ]);
  });

  it("leaves the season to the section when the tile is inside one", () => {
    const labels = labelsFor(seasonal(), { latest: "0.9.0", now: on(12, 15), showSeason: false });
    expect(labels.map((label) => label.text)).toEqual(["New"]);
  });

  it("drops the season label out of season, so it retires by itself", () => {
    const labels = labelsFor(seasonal(), { latest: "0.9.0", now: on(7, 1), showSeason: true });
    expect(labels.map((label) => label.text)).toEqual(["New"]);
  });

  it("gives nothing for an old effect with no season", () => {
    const effect: GalleryEffect = { ...EFFECTS[0]!, since: "0.8.0", season: undefined };
    expect(labelsFor(effect, { latest: "0.9.0", now: on(12, 15), showSeason: true })).toEqual([]);
  });

  it("labels nothing while the build has no release number", () => {
    const labels = labelsFor(EFFECTS[0]!, { latest: "0.0.0", now: on(7, 1), showSeason: false });
    expect(labels).toEqual([]);
  });
});

describe("sortEffects", () => {
  it("orders Featured by rank, Newest by arrival and Name A to Z", () => {
    expect(sortEffects(EFFECTS, "featured").map((e) => e.rank)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ]);
    const newest = sortEffects(EFFECTS, "newest");
    expect(newest[0]!.name).toBe("Frost cells");
    expect(newest.map((e) => e.added)).toEqual(
      [...newest.map((e) => e.added)].sort((a, b) => b - a),
    );
    const names = sortEffects(EFFECTS, "name").map((e) => e.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  it("does not change the list it is given", () => {
    const before = EFFECTS.map((effect) => effect.id);
    sortEffects(EFFECTS, "name");
    expect(EFFECTS.map((effect) => effect.id)).toEqual(before);
  });
});

describe("splitBySeason", () => {
  it("puts every seasonal effect in the season's list while it runs", () => {
    const { seasonal, others } = splitBySeason(EFFECTS, on(12, 15));
    expect(seasonal).toHaveLength(EFFECTS.length);
    expect(others).toEqual([]);
  });

  it("puts them all in the plain list out of season", () => {
    const { seasonal, others } = splitBySeason(EFFECTS, on(7, 1));
    expect(seasonal).toEqual([]);
    expect(others).toHaveLength(EFFECTS.length);
  });

  it("keeps effects that belong to no season out of the seasonal list", () => {
    const plain: GalleryEffect = { ...EFFECTS[0]!, id: "frost", season: undefined };
    const { seasonal, others } = splitBySeason([plain, EFFECTS[1]!], on(12, 15));
    expect(seasonal.map((e) => e.id)).toEqual([EFFECTS[1]!.id]);
    expect(others).toEqual([plain]);
  });
});

describe("metaLine and effectiveDate", () => {
  it("writes the role, the look and the palette, in that order", () => {
    expect(metaLine(EFFECTS[0]!)).toBe("Loader · Characters · Frost");
  });

  it("lets the address force the season on or off, and otherwise uses today", () => {
    const today = on(11, 23);
    expect(isInSeason("christmas", effectiveDate("?season=on", today))).toBe(true);
    expect(isInSeason("christmas", effectiveDate("?season=off", today))).toBe(false);
    expect(effectiveDate("", today)).toBe(today);
    expect(effectiveDate("?season=maybe", today)).toBe(today);
  });
});

describe("labelPreview", () => {
  it("changes nothing without ?labels=demo", () => {
    const preview = labelPreview("", EFFECTS, "0.8.0");
    expect(preview).toEqual({ effects: EFFECTS, latest: "0.8.0", showSeason: false });
  });

  it("marks the three newest effects as added in the latest release, and shows the season", () => {
    const preview = labelPreview("?labels=demo", EFFECTS, "0.8.0");
    const fresh = preview.effects.filter((effect) => isNew(effect, preview.latest));
    expect(fresh.map((effect) => effect.name).sort()).toEqual([
      "Cell grid",
      "Dot matrix",
      "Frost cells",
    ]);
    expect(preview.showSeason).toBe(true);
    expect(preview.latest).not.toBe("0.8.0");
  });

  it("does not change the real data", () => {
    labelPreview("?labels=demo", EFFECTS, "0.8.0");
    expect(EFFECTS.every((effect) => effect.since === "0.8.0")).toBe(true);
  });
});
