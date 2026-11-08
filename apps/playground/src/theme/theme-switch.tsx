// theme-switch.tsx: the header's System / Light / Dark chips.

import { ChipGroup, ChipGroupItem } from "@veilo/ui";
import { useState } from "react";
import {
  applyThemeChoice,
  readThemeChoice,
  THEME_CHOICES,
  toThemeChoice,
  type ThemeChoice,
} from "./theme.ts";

const LABELS: Record<ThemeChoice, string> = { system: "System", light: "Light", dark: "Dark" };

/**
 * The theme switch. Starts from the saved choice, which index.html already applied before the
 * first paint.
 *
 * @returns The chip group.
 */
export function ThemeSwitch() {
  const [choice, setChoice] = useState(readThemeChoice);
  return (
    <ChipGroup
      value={choice}
      onValueChange={(value) => {
        const next = toThemeChoice(value);
        applyThemeChoice(next);
        setChoice(next);
      }}
      aria-label="Theme"
      variant="segmented"
    >
      {THEME_CHOICES.map((item) => (
        <ChipGroupItem key={item} value={item}>
          {LABELS[item]}
        </ChipGroupItem>
      ))}
    </ChipGroup>
  );
}
