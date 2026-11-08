// preset-chips.tsx: the header's preset chips (spec 1.3 and 1.5). Choosing a preset loads its
// settings over the defaults, which also clears custom colors and plays the full sequence.

import { PRESETS, matchingPreset } from "@veilo/presets";
import { ChipGroup, ChipGroupItem } from "@veilo/ui";
import { useStore } from "zustand";
import type { SettingsStore } from "../state/settings-store.ts";

/** Props of {@link PresetChips}. */
export interface PresetChipsProps {
  /** The settings store the chips write to. */
  store: SettingsStore;
}

/**
 * One chip per built-in preset. The lit chip is the preset the current settings equal, so no chip
 * is lit after any control changes a value.
 *
 * @param props - The store.
 * @returns The chip group.
 */
export function PresetChips(props: PresetChipsProps) {
  const { store } = props;
  // A string selector, so the chips re-render only when the matching preset changes.
  const current = useStore(store, (state) => matchingPreset(state.settings)?.id ?? "");
  return (
    // Choosing happens in each item's click, not in onValueChange: Radix reports no change when
    // the lit chip is pressed again, and that press must still replay the sequence.
    <ChipGroup value={current} onValueChange={() => {}} aria-label="Presets">
      {PRESETS.map((preset) => (
        <ChipGroupItem
          key={preset.id}
          value={preset.id}
          onClick={() => store.getState().load(preset.settings)}
        >
          {preset.name}
        </ChipGroupItem>
      ))}
    </ChipGroup>
  );
}
