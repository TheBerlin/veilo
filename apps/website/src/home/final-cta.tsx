// final-cta.tsx: the last call to action of the home page: one question, one line that lowers the
// cost of saying yes, and the page's primary action, the same one as the hero's.

import { Button, Card, Grid, GridCell } from "@veilo-ui/ui";
import { PLAYGROUND_URL } from "../site/links.ts";
import styles from "./final-cta.module.css";
import rise from "./rise.module.css";
import { useSeen } from "./use-seen.ts";

/**
 * The closing section: a panel with a centered h2, a line under it and the primary button that opens
 * the playground. The panel takes 8 of the 12 columns on a wide screen and the whole width on a
 * phone, where the button also spans it. The text rises in once when scrolled into view, like the
 * other sections' text.
 *
 * @returns The section.
 */
export function FinalCta() {
  const { ref, seen } = useSeen<HTMLDivElement>();
  return (
    <section className={styles.section} aria-labelledby="cta-title">
      <Grid>
        <GridCell start={3} span={8} spanMobile={4}>
          <Card size="panel" className={styles.panel}>
            <div
              className={`${styles.copy} ${rise.onView}`}
              ref={ref}
              data-seen={seen || undefined}
            >
              <h2 className={styles.title} id="cta-title">
                Ready to design your loading state?
              </h2>
              <p className={styles.line}>
                It runs in your browser. No account, nothing to install.
              </p>
              <Button asChild variant="primary" size="lg" className={styles.button}>
                <a href={PLAYGROUND_URL}>Open the playground</a>
              </Button>
            </div>
          </Card>
        </GridCell>
      </Grid>
    </section>
  );
}
