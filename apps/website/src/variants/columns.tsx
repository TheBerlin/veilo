// columns.tsx: variant A of "How it works": the three steps side by side as columns hung from one
// rail, each with its live example at the foot. Reference: design-taste-frontend's `steps` recipe
// (a row of three steps, each showing its result), without cards.

import { Grid, GridCell } from "@veilo-ui/ui";
import rise from "../home/rise.module.css";
import { useSeen } from "../home/use-seen.ts";
import styles from "./columns.module.css";
import { SectionHead, StepLink } from "../home/how-parts.tsx";
import { STEPS, type StepContent } from "../home/how-steps.tsx";

/** Props of {@link Column}. */
interface ColumnProps {
  /** The step to show. */
  step: StepContent;
}

/**
 * One column: a node on the rail, the step's text, its link and its live example. The text rises
 * in once when scrolled into view. The column is two rows of its parent's grid (the text, then
 * the example), so the examples of the three columns start on one line.
 *
 * @param props - The step.
 * @returns The list item.
 */
function Column(props: ColumnProps) {
  const { step } = props;
  const { ref, seen } = useSeen<HTMLDivElement>();
  return (
    <li className={styles.column}>
      <div className={`${styles.copy} ${rise.onView}`} ref={ref} data-seen={seen || undefined}>
        <h3 className={styles.stepTitle}>{step.title}</h3>
        <p className={styles.body}>{step.text}</p>
        <p className={styles.more}>
          <StepLink step={step} />
        </p>
      </div>
      <div className={styles.visual}>
        <step.Visual />
      </div>
    </li>
  );
}

/**
 * Variant A. A rail runs across the top and draws itself in once when the section is scrolled
 * into view; each column hangs from a node on it. On a narrow screen the columns stack and the
 * rail runs down the left side.
 *
 * @returns The section.
 */
export function ColumnsVariant() {
  const { ref, seen } = useSeen<HTMLOListElement>();
  return (
    <section className={styles.section} aria-labelledby="columns-title">
      <Grid rowGap="space-8">
        <GridCell>
          <SectionHead id="columns-title" />
        </GridCell>
        <GridCell>
          <ol className={styles.steps} ref={ref} data-seen={seen || undefined}>
            {STEPS.map((step) => (
              <Column key={step.id} step={step} />
            ))}
          </ol>
        </GridCell>
      </Grid>
    </section>
  );
}
