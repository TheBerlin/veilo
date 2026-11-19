// my-presets-menu.tsx: the top bar's "My presets" button, which opens the saved presets in a
// popover: save the current settings, apply, rename, update or delete a saved one, and export or
// import them as a file.

import { Button, Popover, PopoverContent, PopoverTrigger } from "@veilo-ui/ui";
import { PresetsTab } from "../presets/presets-tab.tsx";
import type { UserPresetsStore } from "../presets/user-presets-store.ts";
import type { SettingsStore } from "../state/settings-store.ts";
import styles from "./header-panels.module.css";

/** Props of {@link MyPresetsMenu}. */
export interface MyPresetsMenuProps {
  /** The settings store: saved from, and applied to. */
  store: SettingsStore;
  /** The saved presets. */
  presets: UserPresetsStore;
  /** The button's size. Defaults to `sm`; a phone's bottom row uses `md` for a bigger target. */
  size?: "sm" | "md";
  /** Shows the short label "Saved" (the full name stays as the accessible name), for a phone. */
  compact?: boolean;
}

/**
 * The saved-presets button and its popover. The popover closes on Escape or a press outside, and
 * focus returns to the button. Side effects: those of {@link PresetsTab}.
 *
 * @param props - The settings store and the presets store.
 * @returns The button and, while open, the popover.
 */
export function MyPresetsMenu(props: MyPresetsMenuProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size={props.size ?? "sm"} aria-label={props.compact ? "My presets" : undefined}>
          {props.compact ? "Saved" : "My presets"}
        </Button>
      </PopoverTrigger>
      <PopoverContent aria-label="My presets">
        <div className={styles.stack}>
          <PresetsTab store={props.store} presets={props.presets} />
        </div>
      </PopoverContent>
    </Popover>
  );
}
