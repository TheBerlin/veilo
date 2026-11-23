// effects.ts: the gallery's effects as data, and the rules that decide how each is labeled and
// ordered: "New" comes from the release an effect was added in, "Christmas time" from a date
// window. Pure functions with the date and the latest release passed in, so tests need no clock.

import type { EffectId } from "@veilo-ui/seasonal";

/** What an effect is for. */
export type EffectRole = "Loader" | "Reveal";

/** How an effect is drawn. */
export type EffectLook = "Characters" | "Cells" | "Dots";

/** The effect's color scheme. */
export type EffectPalette = "Mono" | "Frost" | "Aurora";

/** The seasons an effect can belong to. */
export type SeasonId = "christmas";

/** One effect in the gallery. */
export interface GalleryEffect {
  /** The drawing routine's id. */
  id: EffectId;
  /** The name shown. */
  name: string;
  /** What it is for: the first thing a developer asks. */
  role: EffectRole;
  /** How it is drawn. */
  look: EffectLook;
  /** Its colors. */
  palette: EffectPalette;
  /** One plain sentence of what it does, from what it draws. */
  does: string;
  /** Position in the Featured order. */
  rank: number;
  /** Order of arrival: a higher number was added later. Drives the Newest sort. */
  added: number;
  /** The release the effect was added in, for example `"0.8.0"`. */
  since: string;
  /** The season it belongs to, if any. */
  season?: SeasonId;
}

/** The effects, in the Featured order. */
export const EFFECTS: readonly GalleryEffect[] = [
  {
    id: "bars",
    name: "Snow on the bars",
    role: "Loader",
    look: "Characters",
    palette: "Frost",
    rank: 1,
    added: 6,
    since: "0.8.0",
    season: "christmas",
    does: "Snow falls and settles on the skeleton bars, then melts away.",
  },
  {
    id: "frost",
    name: "Frost grow",
    role: "Loader",
    look: "Characters",
    palette: "Mono",
    rank: 2,
    added: 1,
    since: "0.8.0",
    season: "christmas",
    does: "A snowflake grows arm by arm in one ink, then fades.",
  },
  {
    id: "ice",
    name: "Ice cells",
    role: "Loader",
    look: "Cells",
    palette: "Frost",
    rank: 3,
    added: 2,
    since: "0.8.0",
    season: "christmas",
    does: "The same flake, with an ice-blue cell behind every character.",
  },
  {
    id: "aurora",
    name: "Aurora flake",
    role: "Loader",
    look: "Characters",
    palette: "Aurora",
    rank: 4,
    added: 3,
    since: "0.8.0",
    season: "christmas",
    does: "Characters shift from green to violet as the flake grows.",
  },
  {
    id: "curtains",
    name: "Aurora curtains",
    role: "Loader",
    look: "Characters",
    palette: "Aurora",
    rank: 5,
    added: 4,
    since: "0.8.0",
    season: "christmas",
    does: "Bands of color flow across the flake like northern lights.",
  },
  {
    id: "glow",
    name: "Aurora glow",
    role: "Loader",
    look: "Cells",
    palette: "Aurora",
    rank: 6,
    added: 5,
    since: "0.8.0",
    season: "christmas",
    does: "A soft colored glow shows through white characters.",
  },
  {
    id: "blizzard",
    name: "Blizzard dissolve",
    role: "Reveal",
    look: "Characters",
    palette: "Frost",
    rank: 7,
    added: 7,
    since: "0.8.0",
    season: "christmas",
    does: "A whiteout of characters thins out until your content shows.",
  },
  {
    id: "cell-dots",
    name: "Dot matrix",
    role: "Loader",
    look: "Dots",
    palette: "Mono",
    rank: 8,
    added: 8,
    since: "0.8.0",
    season: "christmas",
    does: "Scrambled characters lock into dots, then erode away.",
  },
  {
    id: "cell-cells",
    name: "Cell grid",
    role: "Loader",
    look: "Cells",
    palette: "Mono",
    rank: 9,
    added: 9,
    since: "0.8.0",
    season: "christmas",
    does: "Scrambled characters lock into shaded cells on a grid.",
  },
  {
    id: "cell-frost",
    name: "Frost cells",
    role: "Loader",
    look: "Cells",
    palette: "Frost",
    rank: 10,
    added: 10,
    since: "0.8.0",
    season: "christmas",
    does: "Frost-tinted cells with a few blinking sparkles.",
  },
];

/**
 * The first public release. Every effect that ships with it would be "new", which tells the
 * visitor nothing, so no effect is labeled "New" while this is the latest release.
 */
export const FIRST_PUBLIC_RELEASE = "0.8.0";

/** A yearly window, from a month and day to a month and day, that may wrap over New Year. */
export interface SeasonWindow {
  /** Month 1 to 12 the window opens. */
  startMonth: number;
  /** Day of that month. */
  startDay: number;
  /** Month the window closes (inclusive). */
  endMonth: number;
  /** Day of that month (inclusive). */
  endDay: number;
}

/** What a season is called and when it runs. */
export const SEASONS: Record<SeasonId, { label: string; title: string; window: SeasonWindow }> = {
  christmas: {
    label: "Christmas time",
    title: "Winter effects",
    window: { startMonth: 12, startDay: 1, endMonth: 1, endDay: 10 },
  },
};

/**
 * Whether a date falls in a season's window. A window that ends in an earlier month than it
 * starts runs over New Year.
 *
 * @param season - The season.
 * @param date - The date to test (its local month and day count).
 * @returns True from the first day to the last day, inclusive.
 */
export function isInSeason(season: SeasonId, date: Date): boolean {
  const { startMonth, startDay, endMonth, endDay } = SEASONS[season].window;
  const today = (date.getMonth() + 1) * 100 + date.getDate();
  const start = startMonth * 100 + startDay;
  const end = endMonth * 100 + endDay;
  return start <= end ? today >= start && today <= end : today >= start || today <= end;
}

/**
 * Whether an effect is "new": it was added in the latest release, and that release is not the
 * first public one.
 *
 * @param effect - The effect.
 * @param latest - The latest released version, for example `"0.9.0"`.
 * @returns True when the "New" label applies.
 */
export function isNew(effect: GalleryEffect, latest: string): boolean {
  return effect.since === latest && latest !== FIRST_PUBLIC_RELEASE;
}

/** A status label on a tile. */
export interface EffectLabel {
  /** The words. */
  text: string;
  /** `new` is the one accent-filled badge; `season` is the quiet one. */
  tone: "new" | "season";
}

/** What decides the labels. */
export interface LabelContext {
  /** The latest released version. */
  latest: string;
  /** The current date. */
  now: Date;
  /**
   * Whether the tile repeats the season. False inside a section that already carries the season's
   * name; true in a mixed grid, where the tile has to say it itself.
   */
  showSeason: boolean;
}

/**
 * The status labels of one tile: "New" first, then the season while it is in season. At most two.
 *
 * @param effect - The effect.
 * @param context - The latest release, the date and whether to show the season.
 * @returns Zero, one or two labels.
 */
export function labelsFor(effect: GalleryEffect, context: LabelContext): EffectLabel[] {
  const labels: EffectLabel[] = [];
  if (isNew(effect, context.latest)) labels.push({ text: "New", tone: "new" });
  if (context.showSeason && effect.season && isInSeason(effect.season, context.now)) {
    labels.push({ text: SEASONS[effect.season].label, tone: "season" });
  }
  return labels;
}

/**
 * The line under a tile's sentence: role, how it is drawn, colors.
 *
 * @param effect - The effect.
 * @returns For example "Loader · Characters · Frost".
 */
export function metaLine(effect: GalleryEffect): string {
  return `${effect.role} · ${effect.look} · ${effect.palette}`;
}

/** The ways to order the gallery. */
export type SortKey = "featured" | "newest" | "name";

/**
 * Orders effects without changing the list.
 *
 * @param effects - The effects.
 * @param key - Featured (the editorial order), Newest (latest added first) or Name (A to Z).
 * @returns A new, sorted list.
 */
export function sortEffects(effects: readonly GalleryEffect[], key: SortKey): GalleryEffect[] {
  const list = [...effects];
  if (key === "name") return list.sort((a, b) => a.name.localeCompare(b.name));
  if (key === "newest") return list.sort((a, b) => b.added - a.added);
  return list.sort((a, b) => a.rank - b.rank);
}

/**
 * The effects that belong to a season that is running, and the rest.
 *
 * @param effects - The effects.
 * @param now - The current date.
 * @returns The seasonal ones (in season now) and the others, each in the order given.
 */
export function splitBySeason(
  effects: readonly GalleryEffect[],
  now: Date,
): { seasonal: GalleryEffect[]; others: GalleryEffect[] } {
  const seasonal: GalleryEffect[] = [];
  const others: GalleryEffect[] = [];
  for (const effect of effects) {
    (effect.season && isInSeason(effect.season, now) ? seasonal : others).push(effect);
  }
  return { seasonal, others };
}

/**
 * The date the gallery uses to decide what is in season. An address with `?season=on` or
 * `?season=off` overrides the real date, so a link can show the gallery in or out of season
 * (for a screenshot, or to check it before the season starts).
 *
 * @param search - The address's query string, for example `"?season=on"`.
 * @param today - The real date.
 * @returns A date in the season (the 15th of December of the real year) for `on`, a date outside
 *   every season (the 1st of July) for `off`, otherwise `today`.
 */
export function effectiveDate(search: string, today: Date): Date {
  const value = new URLSearchParams(search).get("season");
  if (value === "on") return new Date(today.getFullYear(), 11, 15);
  if (value === "off") return new Date(today.getFullYear(), 6, 1);
  return today;
}

/** The release name a label preview uses for "the latest release". It is never a real version. */
export const PREVIEW_RELEASE = "preview";

/** What the page shows after the label preview has had its say. */
export interface LabelPreview {
  /** The effects, with the three newest marked as added in the latest release. */
  effects: readonly GalleryEffect[];
  /** The latest release. */
  latest: string;
  /** Whether tiles repeat the season label. */
  showSeason: boolean;
}

/**
 * Lets a link show the status labels before there is a release that earns them. With
 * `?labels=demo` the three newest effects count as added in the latest release, so they get
 * "New", and every tile repeats the season label. Without it nothing changes.
 *
 * @param search - The address's query string.
 * @param effects - The effects.
 * @param latest - The real latest release.
 * @returns The effects, the release and the season flag to use.
 */
export function labelPreview(
  search: string,
  effects: readonly GalleryEffect[],
  latest: string,
): LabelPreview {
  if (new URLSearchParams(search).get("labels") !== "demo") {
    return { effects, latest, showSeason: false };
  }
  const newest = new Set(
    [...effects]
      .sort((a, b) => b.added - a.added)
      .slice(0, 3)
      .map((effect) => effect.id),
  );
  return {
    effects: effects.map((effect) =>
      newest.has(effect.id) ? { ...effect, since: PREVIEW_RELEASE } : effect,
    ),
    latest: PREVIEW_RELEASE,
    showSeason: true,
  };
}
