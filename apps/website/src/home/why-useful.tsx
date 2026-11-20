// why-useful.tsx: the benefits section of the home page: a heading and four tiles, each a small live
// demo with a title and a caption. A tile's demo starts once the tile is scrolled into view.

import { Grid, GridCell } from "@veilo-ui/ui";
import rise from "./rise.module.css";
import { useSeen } from "./use-seen.ts";
import { WHY_TILES, type WhyTile } from "./why-tiles.tsx";
import styles from "./why-useful.module.css";

/** Props of {@link Tile}. */
interface TileProps {
  /** The tile to show. */
  tile: WhyTile;
}

/**
 * One tile. The demo gets `active` when the tile has come into view, and the tile's text rises in
 * with the page's shared entrance.
 *
 * @param props - The tile.
 * @returns The tile's content: the demo frame, the title and the caption.
 */
function Tile(props: TileProps) {
  const { tile } = props;
  const { ref, seen } = useSeen<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`${styles.tile} ${rise.onView}`}
      data-seen={seen || undefined}
      data-wide={tile.wide || undefined}
    >
      <div className={styles.frame} aria-hidden={tile.interactive ? undefined : true}>
        {tile.demo({ active: seen })}
      </div>
      <h3 className={styles.tileTitle}>{tile.title}</h3>
      <p className={styles.caption}>{tile.caption}</p>
    </div>
  );
}

/**
 * The section: the h2, then four tiles in two rows of 8 and 4 columns: the two demos that need room
 * (layout stays put and your framework) are the wide ones, and the first leads. On a phone every tile
 * has its own row.
 *
 * @returns The section.
 */
export function WhyUseful() {
  const { ref, seen } = useSeen<HTMLDivElement>();
  return (
    <section className={styles.section} aria-labelledby="why-title">
      <Grid rowGap="space-4">
        <GridCell>
          <div className={`${styles.head} ${rise.onView}`} ref={ref} data-seen={seen || undefined}>
            <h2 className={styles.title} id="why-title">
              Loading states that stay out of your way.
            </h2>
          </div>
        </GridCell>
        {WHY_TILES.map((tile) => (
          <GridCell key={tile.id} span={tile.wide ? 8 : 4} spanMobile={4} as="article">
            <Tile tile={tile} />
          </GridCell>
        ))}
      </Grid>
    </section>
  );
}
