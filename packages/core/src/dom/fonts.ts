/**
 * fonts.ts: waits for web fonts, so glyph measurements can be redone with the real font.
 * Layer 1 (browser). Touches browser globals only when called, never at import time.
 */

/**
 * Asks the browser to load a web font and waits until it is ready.
 *
 * @param font - A CSS font shorthand with size and family, such as `40px "IBM Plex Mono"`.
 * @returns `true` when a web font face matching `font` is loaded and usable. `false` when no
 *   such face exists (the browser falls back to another font), it failed to load, or there is
 *   no `document` (server or worker).
 */
export async function loadFont(font: string): Promise<boolean> {
  if (typeof document === "undefined") return false;
  // Also catches a browser without the font loading API, where `document.fonts` is missing.
  try {
    // Resolves with the matching faces once loaded. `document.fonts.check` would not do here:
    // it also returns true when no face matches at all, because there is nothing to load.
    const faces = await document.fonts.load(font);
    return faces.length > 0;
  } catch {
    return false;
  }
}
