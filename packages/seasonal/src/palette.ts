// palette.ts: the colors an effect draws with: the page's own custom properties (`--veilo-text`,
// `--veilo-card` and so on, each with a fallback), plus the few seasonal values (ice blues, frost
// tints, snow) that exist only here and are defined per theme.

/** The colors of one canvas, read from the page's tokens. */
export interface Palette {
  /** True on the dark theme. */
  dark: boolean;
  /** Body text color. */
  text: string;
  /** Muted text color. */
  muted: string;
  /** Card surface: what the canvas sits on. */
  card: string;
  /** Skeleton bar color. */
  base: string;
  /** The accent. */
  accent: string;
  /** Text on the accent. */
  onAccent: string;
  /** Hairline color. */
  border: string;
  /** Control outline color. */
  borderStrong: string;
  /** Snow: a cool white on dark, a deeper blue on light. */
  snow: string;
  /** Four ice blues, from the cell behind a faint character to the one behind a solid one. */
  ice: readonly string[];
  /** Character color on an ice cell. */
  iceGlyph: string;
  /** Five frost tints, from faint to bright. */
  frost: readonly string[];
}

/**
 * Reads one custom property of an element, with a fallback.
 *
 * @param style - The element's computed style.
 * @param name - The custom property, for example `--veilo-text`.
 * @param fallback - Used when the property is not set.
 * @returns The trimmed value, or the fallback.
 */
function token(style: CSSStyleDeclaration, name: string, fallback: string): string {
  return style.getPropertyValue(name).trim() || fallback;
}

/**
 * Whether a `#rrggbb` color is dark (relative luminance under one half).
 *
 * @param hex - A hex color; anything else counts as dark.
 * @returns True when dark.
 */
function isDark(hex: string): boolean {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(hex);
  if (!match) return true;
  const [r, g, b] = [match[1]!, match[2]!, match[3]!].map((part) => parseInt(part, 16) / 255);
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b! < 0.5;
}

/**
 * Reads the palette an effect draws with, from the tokens in force at an element.
 *
 * Side effects: reads computed style, so call it after the element is attached.
 *
 * @param element - The canvas (or any element inside the themed page).
 * @returns The colors for the current theme.
 */
export function readPalette(element: Element): Palette {
  const style = getComputedStyle(element);
  // Without Veilo's tokens on the page, follow the visitor's color scheme.
  const bg = token(style, "--veilo-bg", "");
  const dark = bg ? isDark(bg) : !matchMedia("(prefers-color-scheme: light)").matches;
  return {
    dark,
    text: token(style, "--veilo-text", dark ? "#e2e2e7" : "#1e1e22"),
    muted: token(style, "--veilo-text-muted", dark ? "#a9a8b6" : "#4a4a53"),
    card: token(style, "--veilo-card", dark ? "#1d1d22" : "#e8e8eb"),
    base: token(style, "--veilo-base", dark ? "#262626" : "#d4d4d4"),
    accent: token(style, "--veilo-accent", dark ? "#e2e2e7" : "#1e1e22"),
    onAccent: token(style, "--veilo-on-accent", dark ? "#16161a" : "#f1f1f3"),
    border: token(style, "--veilo-border", dark ? "#2a2a2f" : "#c9c9ce"),
    borderStrong: token(style, "--veilo-border-strong", dark ? "#72717e" : "#767676"),
    snow: dark ? "#e9f3fa" : "#4f86ab",
    ice: dark
      ? ["#16324a", "#1e4766", "#285f85", "#3379a3"]
      : ["#d4e8f5", "#b3d6ec", "#8ec0e0", "#66a8d2"],
    iceGlyph: dark ? "#eaf7ff" : "#0a2a40",
    frost: dark
      ? ["#17303f", "#25506b", "#4f8fb5", "#a9d6f0", "#f2faff"]
      : ["#d4e8f5", "#b3d6ec", "#6fa9cf", "#2f6c96", "#0b2f48"],
  };
}
