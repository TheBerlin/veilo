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
 * The three effects of the preview: a grid reveal of characters, a loader with a sweep, and a
 * grid of tiles, so the range shows. Hex and mosaic rest on a frame near the middle of the reveal,
 * where their pattern is plain; the wave rests on its still skeleton.
 */
export const GALLERY_PREVIEW: readonly GalleryTileSpec[] = [
  { id: "hex-from-center", rest: 0.45 },
  { id: "cascade-wave", rest: "loading" },
  { id: "mosaic-from-edge", rest: 0.45 },
];

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
