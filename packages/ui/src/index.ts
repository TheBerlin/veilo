// index.ts: the entry of the internal `@veilo/ui` package. Apps import its source directly.

export {
  COLORS,
  DURATIONS,
  EASINGS,
  FONTS,
  GRID,
  RADIUS,
  RADIUS_BASE,
  SHADOW_SOFT,
  SIZES,
  SPACE,
  TYPE,
} from "./tokens.ts";
export type { ThemedColor, TypeStyle } from "./tokens.ts";
export { TOKEN_PREFIX } from "./tokens-css.ts";
export { Button } from "./components/button.tsx";
export type { ButtonProps } from "./components/button.tsx";
