// gallery-preview.tsx: the gallery preview of the home page: a heading with a button to the gallery,
// then three tiles that show effects live. On a phone it shows one tile and the button under it.

import { Button, Grid, GridCell } from "@veilo-ui/ui";
import { GALLERY_URL } from "../site/links.ts";
import { GalleryTile } from "./gallery-tile.tsx";
import { GALLERY_PREVIEW } from "./gallery-tiles.ts";
import styles from "./gallery-preview.module.css";
import rise from "./rise.module.css";
import { useSeen } from "./use-seen.ts";

/**
 * The button to the gallery, as a link styled as a secondary button.
 *
 * @returns The button.
 */
function BrowseButton() {
  return (
    <Button variant="secondary" asChild>
      <a href={GALLERY_URL}>Browse gallery</a>
    </Button>
  );
}

/**
 * The section: an h2 and a "Browse gallery" button on one row, left and right; below, three
 * tiles of four columns each. On a phone the row is the heading alone, the tiles show only the
 * first, and the button comes last at full width; the button is in the page twice, and only the
 * one for the current layout is shown (the other is not rendered at all, so a screen reader meets
 * it once).
 *
 * @returns The section.
 */
export function GalleryPreview() {
  const { ref, seen } = useSeen<HTMLDivElement>();
  return (
    <section className={styles.section} aria-labelledby="gallery-title">
      <Grid rowGap="space-4">
        <GridCell span={8} spanMobile={4} className={styles.head}>
          <div className={rise.onView} ref={ref} data-seen={seen || undefined}>
            <h2 className={styles.title} id="gallery-title">
              Browse the gallery.
            </h2>
          </div>
        </GridCell>
        <GridCell span={4} spanMobile={4} className={`${styles.action} ${styles.desktopOnly}`}>
          <BrowseButton />
        </GridCell>
        {GALLERY_PREVIEW.map((spec, index) => (
          <GridCell
            key={spec.id}
            span={4}
            spanMobile={4}
            className={index === 0 ? undefined : styles.extra}
          >
            <GalleryTile spec={spec} />
          </GridCell>
        ))}
        <GridCell spanMobile={4} className={`${styles.action} ${styles.mobileOnly}`}>
          <BrowseButton />
        </GridCell>
      </Grid>
    </section>
  );
}
