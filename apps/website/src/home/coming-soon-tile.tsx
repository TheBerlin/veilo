// coming-soon-tile.tsx: a placeholder tile of the home page's gallery preview. It has the shape of
// a gallery tile (a frame, a name, a line of text) but shows no effect yet: still skeleton bars in
// the frame and a "Coming soon" badge.

import { Badge, Card } from "@veilo-ui/ui";
import styles from "./coming-soon-tile.module.css";

/**
 * One "Coming soon" card. It is an article like a real tile, so the row keeps its rhythm, and it
 * has no button or link: there is nothing to open yet.
 *
 * @returns The card.
 */
export function ComingSoonTile() {
  return (
    <Card as="article" className={styles.tile} aria-label="Coming soon">
      <div className={styles.frame} aria-hidden="true">
        <span className={styles.photo} />
        <span className={`${styles.bar} ${styles.long}`} />
        <span className={`${styles.bar} ${styles.short}`} />
      </div>
      <h3 className={styles.name}>Coming soon</h3>
      <p className={styles.text}>New effects are on the way.</p>
      <Badge className={styles.badge}>Soon</Badge>
    </Card>
  );
}
