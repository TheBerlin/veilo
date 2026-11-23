// how-step.tsx: one row of "How it works": the step's text on 4 columns and its live visual on 7,
// on the left or the right. On the narrow layout the text comes first and the visual below.

import { GridCell } from "@veilo-ui/ui";
import type { ReactNode } from "react";
import styles from "./how-step.module.css";
import rise from "./rise.module.css";
import { useSeen } from "./use-seen.ts";

/** Props of {@link HowStep}. */
export interface HowStepProps {
  /** The step's title, such as "Tune.". */
  title: string;
  /** The step's text. */
  children: ReactNode;
  /** The live visual. */
  visual: ReactNode;
  /** A link that leads on from the step: where to try what it describes. */
  link: { href: string; label: string };
  /** Puts the visual on the left and the text on the right on the wide layout. */
  reverse?: boolean;
}

/**
 * A step of the section. The text stays first in the document, so screen readers and the narrow
 * layout read it before the visual; only the wide layout places the visual to the left when
 * `reverse` is set. One empty column separates the two.
 *
 * @param props - The title, the text, the visual, the link and the side.
 * @returns A full-width grid cell holding the row.
 */
export function HowStep(props: HowStepProps) {
  const { title, children, visual, link, reverse = false } = props;
  const { ref, seen } = useSeen<HTMLDivElement>();
  return (
    <GridCell>
      <div className={styles.step} data-reverse={reverse || undefined}>
        <div className={`${styles.text} ${rise.onView}`} ref={ref} data-seen={seen || undefined}>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.body}>{children}</p>
          <p className={styles.more}>
            <a className={styles.link} href={link.href}>
              {link.label}
            </a>
          </p>
        </div>
        <div className={styles.visual}>{visual}</div>
      </div>
    </GridCell>
  );
}
