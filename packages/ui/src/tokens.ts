// tokens.ts: the Veilo design system tokens, the single source for tokens.css and for any code
// that needs a token's value. Every CSS name is the key with the `--veilo-` prefix.

/** A color with one value per theme. Dark is the default theme. */
export interface ThemedColor {
  /** Value in the dark theme. */
  readonly dark: string;
  /** Value in the light theme. */
  readonly light: string;
}

/**
 * Colors. Neutrals are one gray hue; the accent is the monochrome inverse of `bg`. `base` and `hi`
 * are the skeleton colors and use the exact names `@veilo/css` reads (`--veilo-base`,
 * `--veilo-hi`), so the site and the package share one palette.
 */
export const COLORS = {
  bg: { dark: "#030303", light: "#f1f1f1" },
  card: { dark: "#0d0d0d", light: "#e7e7e7" },
  secondary: { dark: "#171717", light: "#dcdcdc" },
  border: { dark: "#2a2a2a", light: "#c9c9c9" },
  "border-strong": { dark: "#6b6b6b", light: "#767676" },
  text: { dark: "#eeeeee", light: "#141414" },
  "text-muted": { dark: "#a0a0a0", light: "#595959" },
  accent: { dark: "#f1f1f1", light: "#030303" },
  "on-accent": { dark: "#030303", light: "#f1f1f1" },
  base: { dark: "#171717", light: "#dcdcdc" },
  hi: { dark: "#262626", light: "#f7f7f7" },
  "grid-dot": { dark: "#3a3a3a", light: "#b8b8b8" },
  danger: { dark: "#e5857f", light: "#b3261e" },
  success: { dark: "#7fc8a0", light: "#1f6b45" },
  info: { dark: "#93a3f5", light: "#3b4bbf" },
  warning: { dark: "#e6b450", light: "#8a5a00" },
  "info-soft": { dark: "#93a3f524", light: "#3b4bbf1a" },
  "success-soft": { dark: "#7fc8a024", light: "#1f6b451a" },
  "warning-soft": { dark: "#e6b45024", light: "#8a5a001a" },
  "danger-soft": { dark: "#e5857f24", light: "#b3261e1a" },
} as const satisfies Record<string, ThemedColor>;

/** Font families. Geist is loaded by the app; IBM Plex Mono matches the glyph ramps. */
export const FONTS = {
  sans: '"Geist", system-ui, -apple-system, "Segoe UI", sans-serif',
  mono: '"IBM Plex Mono", ui-monospace, "SFMono-Regular", Menlo, monospace',
} as const;

/** One type style: written as a `font` shorthand token plus a letter-spacing token. */
export interface TypeStyle {
  /** Font family key. */
  readonly family: keyof typeof FONTS;
  /** Font size in px. */
  readonly size: number;
  /** Line height in px. */
  readonly lineHeight: number;
  /** Font weight. */
  readonly weight: number;
  /** Letter spacing in em; 0 means normal. */
  readonly tracking: number;
}

/** Type scale. On the 375 px layout, apps use 40 px for `h1` and 32 px for `h2`. */
export const TYPE = {
  h1: { family: "sans", size: 56, lineHeight: 60, weight: 700, tracking: -0.02 },
  h2: { family: "sans", size: 40, lineHeight: 46, weight: 700, tracking: -0.015 },
  h3: { family: "sans", size: 28, lineHeight: 34, weight: 700, tracking: -0.01 },
  "body-lg": { family: "sans", size: 20, lineHeight: 30, weight: 400, tracking: 0 },
  body: { family: "sans", size: 16, lineHeight: 24, weight: 400, tracking: 0 },
  label: { family: "sans", size: 16, lineHeight: 24, weight: 500, tracking: 0 },
  caption: { family: "sans", size: 14, lineHeight: 20, weight: 400, tracking: 0 },
  code: { family: "mono", size: 14, lineHeight: 22, weight: 400, tracking: 0 },
} as const satisfies Record<string, TypeStyle>;

/** Spacing in px, an 8-point scale. The half steps are for inside controls only. */
export const SPACE = {
  "space-0-5": 4,
  "space-1": 8,
  "space-1-5": 12,
  "space-2": 16,
  "space-2-5": 20,
  "space-3": 24,
  "space-4": 32,
  "space-8": 64,
  "space-16": 128,
} as const;

/** The one base radius in px: every element that holds no other element. */
export const RADIUS_BASE = 8;

/**
 * Radii in px. One rule: a surface's radius is the radius inside it plus its padding, so each
 * step is the base plus a spacing step. `pill` is for dots and avatars only.
 */
export const RADIUS = {
  "radius-base": RADIUS_BASE,
  // Bars and code blocks: 8 px padding.
  "radius-md": RADIUS_BASE + SPACE["space-1"],
  // Cards: 16 px padding.
  "radius-lg": RADIUS_BASE + SPACE["space-2"],
  // Panels: 32 px padding.
  "radius-xl": RADIUS_BASE + SPACE["space-4"],
  "radius-pill": 999,
} as const;

/** The one shadow: x 0, y 4, blur 64, 10% black. */
export const SHADOW_SOFT = "0 4px 64px 0 rgba(0, 0, 0, 0.1)";

/** Interface durations in ms. Reduced motion sets all of them to 0. */
export const DURATIONS = {
  "duration-fast": 150,
  "duration-base": 250,
  "duration-slow": 400,
} as const;

/** Interface easing curves as cubic-bezier control points. Product motion uses core's presets. */
export const EASINGS = {
  "ease-out": [0, 0, 0.2, 1],
  "ease-in": [0.4, 0, 1, 1],
  "ease-in-out": [0.4, 0, 0.2, 1],
} as const satisfies Record<string, readonly [number, number, number, number]>;

/** The two fixed layouts: frame width, columns, gutter and side margin. */
export const GRID = {
  desktop: { width: 1440, columns: 12, gutter: 20, margin: 120 },
  mobile: { width: 375, columns: 4, gutter: 8, margin: 20 },
} as const;
