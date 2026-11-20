// how-parts.tsx: the small parts of "How it works" that more than one layout uses: the heading
// h2 and a step's link.

import styles from "./how-steps.module.css";
import { SECTION_TITLE, type StepContent } from "./how-steps.tsx";
import rise from "./rise.module.css";
import { useSeen } from "./use-seen.ts";

/** Props of {@link SectionHead}. */
export interface SectionHeadProps {
  /** The id of the h2, for the section's `aria-labelledby`. */
  id: string;
}

/**
 * The h2 of the section, rising in once when scrolled into view like the other text
 * blocks of the page.
 *
 * @param props - The h2's id.
 * @returns The heading block.
 */
export function SectionHead(props: SectionHeadProps) {
  const { ref, seen } = useSeen<HTMLDivElement>();
  return (
    <div className={`${styles.head} ${rise.onView}`} ref={ref} data-seen={seen || undefined}>
      <h2 className={styles.title} id={props.id}>
        {SECTION_TITLE}
      </h2>
    </div>
  );
}

/** Props of {@link StepLink}. */
export interface StepLinkProps {
  /** The step the link belongs to. */
  step: StepContent;
  /** Removes the link from the tab order, for a step that is collapsed. */
  tabIndex?: number;
}

/**
 * A step's underlined link on to the playground.
 *
 * @param props - The step, and an optional tab index.
 * @returns The link.
 */
export function StepLink(props: StepLinkProps) {
  const { step, tabIndex } = props;
  return (
    <a className={styles.link} href={step.link.href} tabIndex={tabIndex}>
      {step.link.label}
    </a>
  );
}
