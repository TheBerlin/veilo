// gallery-toolbar.tsx: the gallery page's search box, its three rows of filter chips, and the line
// that says how many effects are listed with the button that clears the filters.

import { Button, Chip, TextField } from "@veilo-ui/ui";
import { useId } from "react";
import {
  countText,
  GROUPS,
  isFiltered,
  NO_FILTERS,
  optionsFor,
  toggleOption,
  type FilterState,
  type GalleryEntry,
} from "./gallery-filter.ts";
import styles from "./gallery-toolbar.module.css";

/** Props of {@link GalleryToolbar}. */
export interface GalleryToolbarProps {
  /** Every effect of the gallery, which decides the chips on offer. */
  entries: readonly GalleryEntry[];
  /** The search and the chosen options. */
  state: FilterState;
  /** Called with the new state on every edit and every chip. */
  onChange: (state: FilterState) => void;
  /** How many effects match the state now. */
  shown: number;
}

/**
 * The toolbar: a search box; a labelled row of chips for each of the loader, the image effect and
 * the text effect, where any number can be chosen; and under them the count and "Clear filters".
 * The count is a polite status, so a screen reader hears the list change as the visitor types.
 *
 * @param props - The effects, the state, its change handler and how many match.
 * @returns The toolbar, a search landmark.
 */
export function GalleryToolbar(props: GalleryToolbarProps) {
  const { entries, state, onChange, shown } = props;
  const id = useId();
  const filtered = isFiltered(state);
  return (
    <div className={styles.toolbar} role="search">
      <TextField
        className={styles.search}
        label="Search effects"
        placeholder="Try hex, wave or scramble"
        value={state.query}
        onValueChange={(query) => onChange({ ...state, query })}
      />
      <div className={styles.rows}>
        {GROUPS.map((group) => {
          const labelId = `${id}-${group.key}`;
          return (
            <div key={group.key} className={styles.row} role="group" aria-labelledby={labelId}>
              <span className={styles.label} id={labelId}>
                {group.label}
              </span>
              <div className={styles.chips}>
                {optionsFor(entries, group.key).map((option) => (
                  <Chip
                    key={option.value}
                    pressed={state.chosen[group.key].includes(option.value)}
                    onPressedChange={() => onChange(toggleOption(state, group.key, option.value))}
                  >
                    {option.label}
                  </Chip>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className={styles.summary}>
        <p className={styles.count} role="status">
          {countText(shown, entries.length, filtered)}
        </p>
        <Button variant="ghost" size="sm" disabled={!filtered} onClick={() => onChange(NO_FILTERS)}>
          Clear filters
        </Button>
      </div>
    </div>
  );
}
