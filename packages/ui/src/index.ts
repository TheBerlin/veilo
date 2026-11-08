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
export { Chip, ChipGroup, ChipGroupItem } from "./components/chip.tsx";
export type { ChipGroupItemProps, ChipGroupProps, ChipProps } from "./components/chip.tsx";
export { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/tabs.tsx";
export type { TabsContentProps, TabsListProps, TabsTriggerProps } from "./components/tabs.tsx";
export { Toggle } from "./components/toggle.tsx";
export type { ToggleProps } from "./components/toggle.tsx";
export { Tooltip, TooltipProvider } from "./components/tooltip.tsx";
export type { TooltipProps } from "./components/tooltip.tsx";
export { ColorField } from "./components/color-field.tsx";
export type { ColorFieldProps } from "./components/color-field.tsx";
export { Scrubber } from "./components/scrubber.tsx";
export type { ScrubberProps } from "./components/scrubber.tsx";
export { Select } from "./components/select.tsx";
export type { SelectOption, SelectProps } from "./components/select.tsx";
export { Slider } from "./components/slider.tsx";
export type { SliderProps } from "./components/slider.tsx";
export { TextArea } from "./components/text-area.tsx";
export type { TextAreaProps } from "./components/text-area.tsx";
export { CodeBlock, COPIED_MS } from "./components/code-block.tsx";
export type { CodeBlockProps } from "./components/code-block.tsx";
export { DotGridBackground } from "./components/dot-grid-background.tsx";
export type { DotGridBackgroundProps } from "./components/dot-grid-background.tsx";
export { createDotGrid, DOT_GRID_DEFAULTS } from "./dot-grid/dot-grid.ts";
export type { DotGrid, DotGridOptions, DotGridSettings } from "./dot-grid/dot-grid.ts";
