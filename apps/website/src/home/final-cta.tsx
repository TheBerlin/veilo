// final-cta.tsx: the last call to action of the home page: one question, one line that lowers the
// cost of saying yes, and the page's primary action, the same one as the hero's.

import { useReveal } from "@veilo-ui/react";
import { Button, Card, Grid, GridCell, watchTheme } from "@veilo-ui/ui";
import { useCallback, useEffect, useState } from "react";
import { PLAYGROUND_URL } from "../site/links.ts";
import styles from "./final-cta.module.css";
import { WAVE_SETTINGS } from "./hero-effect.ts";
import { useSeen } from "./use-seen.ts";

/** Slot hints of the section's three parts. */
const CTA_LAYOUT = {
  version: 1,
  slots: {
    title: { role: "text", lines: 2, width: 90 },
    line: { role: "text", width: 80 },
    action: { role: "block" },
  },
} as const;

/**
 * The closing section: a panel with a centered h2, a line under it and the primary button that opens
 * the playground. The panel takes 8 of the 12 columns on a wide screen and the whole width on a
 * phone, where the button also spans it. The three parts wait as Veilo's own skeleton and are
 * revealed once, with its own effect, when the panel is scrolled into view: the page ends by
 * showing the product at work. Under reduced motion the content is simply there.
 *
 * @returns The section.
 */
export function FinalCta() {
  const { ref: seenRef, seen: scrolledTo } = useSeen<HTMLDivElement>();
  // The skeleton hides the parts from assistive technology, so a keyboard user who tabs to the
  // button also starts the reveal, whatever the scroll position says.
  const [focused, setFocused] = useState(false);
  const seen = scrolledTo || focused;
  const { ref: revealRef, reveal } = useReveal<HTMLDivElement>({
    settings: WAVE_SETTINGS,
    layout: CTA_LAYOUT,
  });
  // The panel is observed and revealed through one element, so both refs are set on it.
  const ref = useCallback(
    (element: HTMLDivElement | null) => {
      seenRef(element);
      revealRef(element);
    },
    [seenRef, revealRef],
  );
  useEffect(() => {
    if (!reveal) return;
    // Wait as a skeleton until the panel is seen, then play the sequence once.
    if (!seen) {
      reveal.showLoading();
      return;
    }
    reveal.playSequence();
    // The reveal reads its ink from the page, so it is redrawn when the theme changes.
    return watchTheme(() => reveal.redraw());
  }, [reveal, seen]);
  return (
    <section className={styles.section} aria-labelledby="cta-title">
      <Grid>
        <GridCell start={3} span={8} spanMobile={4}>
          <Card size="panel" className={styles.panel}>
            <div className={styles.copy} ref={ref} onFocus={() => setFocused(true)}>
              <h2 className={styles.title} id="cta-title" data-veilo-slot="title">
                Ready to design your loading state?
              </h2>
              <p className={styles.line} data-veilo-slot="line">
                It runs in your browser. No account, nothing to install.
              </p>
              <Button asChild variant="primary" size="lg" className={styles.button}>
                <a href={PLAYGROUND_URL} data-veilo-slot="action">
                  Open the playground
                </a>
              </Button>
            </div>
          </Card>
        </GridCell>
      </Grid>
    </section>
  );
}
