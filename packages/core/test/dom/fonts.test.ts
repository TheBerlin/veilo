// Tests for src/dom/fonts.ts. Runs in Chromium (see BROWSER_TESTS in vitest.config.ts).

/// <reference types="vite/client" />
import plexUrl from "@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2?url";
import { describe, expect, it } from "vitest";
import { loadFont } from "../../src/dom/fonts.ts";

describe("loadFont", () => {
  it("resolves true once a registered web font has loaded", async () => {
    // Registered but not loaded: loadFont has to trigger the download.
    document.fonts.add(new FontFace("Veilo Fonts Test", `url(${plexUrl})`));
    expect(await loadFont('40px "Veilo Fonts Test"')).toBe(true);
    expect(document.fonts.check('40px "Veilo Fonts Test"')).toBe(true);
  });

  it("resolves false when no web font matches", async () => {
    expect(await loadFont('40px "No Such Veilo Font"')).toBe(false);
  });

  it("resolves false when the font file fails to load", async () => {
    document.fonts.add(new FontFace("Veilo Broken Font", "url(/no-such-font.woff2)"));
    expect(await loadFont('40px "Veilo Broken Font"')).toBe(false);
  });

  it("resolves false without the font loading API", async () => {
    // A browser cannot remove `document` itself, so this covers the same early return. The
    // server case, with no `document` at all, is covered by the Node import test.
    Object.defineProperty(document, "fonts", { value: undefined, configurable: true });
    try {
      expect(await loadFont('40px "Veilo Fonts Test"')).toBe(false);
    } finally {
      // Removes the own property, so the prototype's real getter shows through again.
      delete (document as { fonts?: FontFaceSet }).fonts;
    }
    expect(document.fonts).toBeDefined();
  });
});
