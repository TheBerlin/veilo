// gallery-tiles.ts: which effects the home page's gallery preview shows, how each rests before it
// is touched, and the short names of its badges. Pure data and one helper; no DOM.

import { presetSettings, type PresetId } from "@veilo-ui/presets";

/** How a tile rests before the visitor touches it. */
export type RestState =
  /** The skeleton, standing still: for an effect that is mostly about its loader. */
  | "loading"
  /** One frame of the reveal, held at this progress from 0 to 1: the effect's signature moment. */
  | number;

/** One tile of the preview. */
export interface GalleryTileSpec {
  /** The preset the tile shows. */
  id: PresetId;
  /** How the tile rests. */
  rest: RestState;
}

/**
 * The image effects drawn on a grid of cells (dots, hex characters, binary characters, mosaic
 * squares). Their pattern is plain in the middle of the reveal, so a tile of one rests on a frame
 * from there. Every other effect is mostly its loader, so its tile rests on the still skeleton.
 */
const GRID_IMAGE_EFFECTS: ReadonlySet<string> = new Set(["dots", "hex", "binary", "mosaic"]);

/** The progress a grid effect's tile rests on: near the middle of the reveal. */
const REST_PROGRESS = 0.45;

/**
 * The spec of a tile for a preset: how it rests follows from the preset's own image effect.
 *
 * @param id - The preset.
 * @returns The tile's spec.
 */
export function tileSpec(id: PresetId): GalleryTileSpec {
  const settings = presetSettings(id)!;
  return { id, rest: GRID_IMAGE_EFFECTS.has(settings.imageFx) ? REST_PROGRESS : "loading" };
}

/**
 * The three effects of the home page's preview: a grid reveal of characters, a loader with a
 * sweep, and a grid of squares, so the range shows.
 */
export const GALLERY_PREVIEW: readonly GalleryTileSpec[] = (
  ["hex-from-center", "cascade-wave", "mosaic-from-edge"] as const
).map(tileSpec);

/** The settings a badge can name, in the order the badges are shown. */
export type BadgeKey = "effect" | "imageFx" | "textFx";

/**
 * The short name of each option, for a badge: "Hex", not the playground's "Hex characters". A test
 * checks every option of the settings schema has one, so a new effect cannot go unnamed.
 */
export const BADGE_NAMES: Readonly<Record<BadgeKey, Readonly<Record<string, string>>>> = {
  effect: { shimmer: "Shimmer", wave: "Wave", pulse: "Pulse" },
  imageFx: {
    dots: "Dots",
    hex: "Hex",
    binary: "Binary",
    mosaic: "Mosaic",
    blur: "Blur-up",
    crossfade: "Crossfade",
    wipe: "Wipe",
    zoom: "Zoom",
  },
  textFx: { scramble: "Scramble", typewriter: "Typewriter", rise: "Rise", fade: "Fade" },
};

/**
 * The badges of a preset: its loader, its image effect and its text effect, read from the
 * preset's own settings, so they cannot drift from what the tile plays.
 *
 * @param id - The preset.
 * @returns The three short names, in that order.
 */
export function presetBadges(id: PresetId): string[] {
  // The ids are the preset type's, so the preset exists.
  const settings = presetSettings(id)!;
  return (["effect", "imageFx", "textFx"] as const).map(
    (key) => BADGE_NAMES[key][settings[key]] ?? settings[key],
  );
}
