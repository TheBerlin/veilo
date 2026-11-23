// effects.ts: the gallery's effects as data, and the rules that decide how each is labeled and
// ordered: "New" lasts 28 days from the day an effect was released, "Christmas time" comes from a
// date window. Pure functions with the date passed in, so tests need no clock.

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
  /** The release the effect was added in, for example `"0.9.0"`. */
  since: string;
  /** The day that release came out, as `YYYY-MM-DD`. The "New" label counts 28 days from it. */
  released: string;
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
    since: "0.9.0",
    released: "2026-11-23",
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
    since: "0.9.0",
    released: "2026-11-23",
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
    since: "0.9.0",
    released: "2026-11-23",
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
    since: "0.9.0",
    released: "2026-11-23",
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
    since: "0.9.0",
    released: "2026-11-23",
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
    since: "0.9.0",
    released: "2026-11-23",
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
    since: "0.9.0",
    released: "2026-11-23",
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
    since: "0.9.0",
    released: "2026-11-23",
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
    since: "0.9.0",
    released: "2026-11-23",
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
    since: "0.9.0",
    released: "2026-11-23",
    season: "christmas",
    does: "Frost-tinted cells with a few blinking sparkles.",
  },
];

/**
 * The first public release. Every effect that ships with it would be "new", which tells the
 * visitor nothing, so no effect is labeled "New" while this is the latest release.
 */
export const FIRST_PUBLIC_RELEASE = "0.9.0";

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

/** How many days the "New" label stays on an effect after its release day. */
export const NEW_DAYS = 28;

/**
 * Whether an effect is "new": its release came out less than 28 days ago (the release day is day
 * 0; the label is gone on day 28). Effects from the first public release are never new.
 *
 * @param effect - The effect.
 * @param now - The current date (its local calendar day counts, not the time).
 * @returns True when the "New" label applies. False for a release date in the future.
 */
export function isNew(effect: GalleryEffect, now: Date): boolean {
  if (effect.since === FIRST_PUBLIC_RELEASE) return false;
  const [year, month, day] = effect.released.split("-").map(Number) as [number, number, number];
  // Whole local calendar days, so daylight saving shifts cannot move the cut-off by a day.
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const age = Math.round((today - Date.UTC(year, month - 1, day)) / 86_400_000);
  return age >= 0 && age < NEW_DAYS;
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
 * @param context - The date and whether to show the season.
 * @returns Zero, one or two labels.
 */
export function labelsFor(effect: GalleryEffect, context: LabelContext): EffectLabel[] {
  const labels: EffectLabel[] = [];
  if (isNew(effect, context.now)) labels.push({ text: "New", tone: "new" });
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

/** The release name a label preview uses for a release that does not exist. */
export const PREVIEW_RELEASE = "preview";

/** What the page shows after the label preview has had its say. */
export interface LabelPreview {
  /** The effects, with the three newest marked as released today. */
  effects: readonly GalleryEffect[];
  /** Whether tiles repeat the season label. */
  showSeason: boolean;
}

/**
 * Lets a link show the status labels before an effect is young enough to earn them. With
 * `?labels=demo` the three newest effects count as released today, so they get "New", and every
 * tile repeats the season label. Without it nothing changes.
 *
 * @param search - The address's query string.
 * @param effects - The effects.
 * @param now - The current date, used as the release day of the three newest.
 * @returns The effects and the season flag to use.
 */
export function labelPreview(
  search: string,
  effects: readonly GalleryEffect[],
  now: Date,
): LabelPreview {
  if (new URLSearchParams(search).get("labels") !== "demo") {
    return { effects, showSeason: false };
  }
  const newest = new Set(
    [...effects]
      .sort((a, b) => b.added - a.added)
      .slice(0, 3)
      .map((effect) => effect.id),
  );
  const pad = (n: number) => String(n).padStart(2, "0");
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  return {
    effects: effects.map((effect) =>
      newest.has(effect.id) ? { ...effect, since: PREVIEW_RELEASE, released: today } : effect,
    ),
    showSeason: true,
  };
}
