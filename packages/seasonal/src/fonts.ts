// fonts.ts: loads the fonts the effects draw characters in, so a first frame is not set in a
// fallback. The package does not ship the fonts: load IBM Plex Mono (and Geist, for the Blizzard
// dissolve's text) on the page, for example with Fontsource. Without them the effects draw in the
// system monospace and sans-serif.

/** The fonts the effects draw with, as `document.fonts.load` descriptors. */
const FONTS = ['11px "IBM Plex Mono"', "400 13px Geist", "700 26px Geist"];

/**
 * Waits until the effects' fonts have loaded, if the page declares them. It never rejects and
 * resolves at once when the fonts are not declared or the browser has no font loading API.
 *
 * Side effects: starts loading any declared font face of those families.
 *
 * @returns A promise that resolves when loading has settled.
 */
export async function loadEffectFonts(): Promise<void> {
  if (typeof document === "undefined" || !document.fonts?.load) return;
  await Promise.all(FONTS.map((font) => document.fonts.load(font))).catch(() => undefined);
}
