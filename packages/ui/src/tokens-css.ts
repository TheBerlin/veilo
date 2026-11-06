// tokens-css.ts: turns the token table in tokens.ts into tokens.css. Pure; the generate script
// writes its output, and a test fails when the committed file differs.

import {
  COLORS,
  DURATIONS,
  EASINGS,
  FONTS,
  GRID,
  RADIUS,
  SHADOW_SOFT,
  SIZES,
  SPACE,
  TYPE,
  type ThemedColor,
} from "./tokens.ts";

/** The prefix of every token's CSS name. */
export const TOKEN_PREFIX = "--veilo-";

/**
 * Lines of `--veilo-<name>: <value>;` for one theme.
 *
 * @param theme - Which value of each color to write.
 * @param indent - Leading spaces.
 * @returns One declaration per color.
 */
function colorLines(theme: keyof ThemedColor, indent: string): string[] {
  return Object.entries(COLORS).map(
    ([name, color]) => `${indent}${TOKEN_PREFIX}${name}: ${color[theme]};`,
  );
}

/**
 * Lines for the tokens that do not change with the theme.
 *
 * @returns One declaration per token.
 */
function staticLines(): string[] {
  const lines: [string, string][] = [
    ...Object.entries(FONTS).map(([name, value]): [string, string] => [`font-${name}`, value]),
    ...Object.entries(TYPE).flatMap(([name, s]): [string, string][] => [
      [
        `type-${name}`,
        `${s.weight} ${s.size}px/${s.lineHeight}px var(${TOKEN_PREFIX}font-${s.family})`,
      ],
      [`type-${name}-tracking`, s.tracking === 0 ? "normal" : `${s.tracking}em`],
    ]),
    ...Object.entries(SPACE).map(([name, px]): [string, string] => [name, `${px}px`]),
    ...Object.entries(SIZES).map(([name, px]): [string, string] => [name, `${px}px`]),
    ...Object.entries(RADIUS).map(([name, px]): [string, string] => [name, `${px}px`]),
    // Skeletons from @veilo/css follow the control radius on the site.
    ["radius", `var(${TOKEN_PREFIX}radius-base)`],
    ["shadow-soft", SHADOW_SOFT],
    ...Object.entries(DURATIONS).map(([name, ms]): [string, string] => [name, `${ms}ms`]),
    ...Object.entries(EASINGS).map(([name, p]): [string, string] => [
      name,
      `cubic-bezier(${p.join(", ")})`,
    ]),
    ...Object.entries(GRID).flatMap(([layout, g]): [string, string][] => [
      [`grid-${layout}-width`, `${g.width}px`],
      [`grid-${layout}-columns`, `${g.columns}`],
      [`grid-${layout}-gutter`, `${g.gutter}px`],
      [`grid-${layout}-margin`, `${g.margin}px`],
    ]),
  ];
  return lines.map(([name, value]) => `  ${TOKEN_PREFIX}${name}: ${value};`);
}

/**
 * Builds the text of tokens.css.
 *
 * Dark is the default theme. `data-theme="light"` on the root picks light; without a
 * `data-theme`, the system's light preference does too. Reduced motion makes every interface
 * duration 0.
 *
 * @returns The stylesheet.
 */
export function buildTokensCss(): string {
  const durationsOff = Object.keys(DURATIONS).map((name) => `    ${TOKEN_PREFIX}${name}: 0ms;`);
  return [
    "/* Veilo design tokens. Generated from packages/ui/src/tokens.ts; do not edit.",
    "   Run `pnpm --filter @veilo/ui generate:tokens` after changing the table. */",
    "",
    ":root {",
    ...colorLines("dark", "  "),
    "  color-scheme: dark;",
    "",
    ...staticLines(),
    "}",
    "",
    ':root[data-theme="light"] {',
    ...colorLines("light", "  "),
    "  color-scheme: light;",
    "}",
    "",
    "@media (prefers-color-scheme: light) {",
    // An explicit dark choice wins over the system preference.
    '  :root:not([data-theme="dark"]) {',
    ...colorLines("light", "    "),
    "    color-scheme: light;",
    "  }",
    "}",
    "",
    "@media (prefers-reduced-motion: reduce) {",
    "  :root {",
    ...durationsOff,
    "  }",
    "}",
    "",
  ].join("\n");
}
