// gallery-page.tsx: the gallery page: every ready-made effect as a live tile, with a search box and
// filters. The tiles are the home page's, so an effect looks and plays the same in both places.

import { Button, Grid, GridCell } from "@veilo-ui/ui";
import { useEffect, useMemo, useState } from "react";
import { GalleryTile } from "../home/gallery-tile.tsx";
import { tileSpec } from "../home/gallery-tiles.ts";
import {
  filterEntries,
  filtersToSearch,
  galleryEntries,
  NO_FILTERS,
  parseFilters,
  type FilterState,
} from "./gallery-filter.ts";
import styles from "./gallery-page.module.css";
import { GalleryToolbar } from "./gallery-toolbar.tsx";

/**
 * The gallery page. The one `h1` and its caption; the toolbar; then the matching effects as tiles,
 * three to a row on a wide screen and one on a phone. When nothing matches, a line says so and a
 * button clears the filters. The search and the chosen options are in the address (`?q=hex&loader=wave`),
 * read when the page opens and rewritten as they change, so a view can be shared and survives a
 * reload.
 * Side effects: replaces the current history entry's address as the filters change.
 *
 * @returns The page's content, for the `main` landmark.
 */
export function GalleryPage() {
  const entries = useMemo(() => galleryEntries(), []);
  // The search and the chips start from the address, so a filtered view opens from a link.
  const [state, setState] = useState<FilterState>(() =>
    parseFilters(window.location.search, galleryEntries()),
  );
  // And they are written back to it as they change, replacing the entry: typing adds no history.
  useEffect(() => {
    const search = filtersToSearch(state);
    if (search === window.location.search) return;
    const { pathname, hash } = window.location;
    window.history.replaceState(window.history.state, "", pathname + search + hash);
  }, [state]);
  const shown = useMemo(() => filterEntries(entries, state), [entries, state]);
  return (
    <div className={styles.page}>
      <Grid rowGap="space-4">
        <GridCell>
          <header className={styles.head}>
            <h1 className={styles.title}>Gallery.</h1>
            <p className={styles.caption}>
              Every ready-made effect. Open one in the Playground to change it.
            </p>
          </header>
        </GridCell>
        <GridCell>
          <GalleryToolbar
            entries={entries}
            state={state}
            onChange={setState}
            shown={shown.length}
          />
        </GridCell>
      </Grid>
      {shown.length === 0 ? (
        <Grid>
          <GridCell>
            <div className={styles.empty}>
              <p className={styles.emptyText}>No effects match these filters.</p>
              <Button variant="secondary" onClick={() => setState(NO_FILTERS)}>
                Clear filters
              </Button>
            </div>
          </GridCell>
        </Grid>
      ) : (
        <Grid as="ul" rowGap="space-4">
          {shown.map((entry) => (
            <GridCell key={entry.id} as="li" span={4} spanMobile={4}>
              <GalleryTile spec={tileSpec(entry.id)} />
            </GridCell>
          ))}
        </Grid>
      )}
    </div>
  );
}
