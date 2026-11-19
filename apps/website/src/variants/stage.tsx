// stage.tsx: variant C of "How it works": one stage and three tabs. Only one step is on screen
// at a time, so the section is short and the visitor decides the pace; a Next button leads from a
// step to the following one. Reference: transitions.dev's "Tabs sliding" and "Panel reveal"
// patterns (a segmented control and a panel that arrives with a short rise out of a blur), with
// the Radix tabs of the design system underneath for keyboard and screen readers.

import { Button, Grid, GridCell, Tabs, TabsContent, TabsList, TabsTrigger } from "@veilo-ui/ui";
import { useState } from "react";
import { SectionHead, StepLink } from "../home/how-parts.tsx";
import styles from "./stage.module.css";
import { STEPS } from "../home/how-steps.tsx";

/**
 * Variant C. A segmented control picks the step; the panel shows its text and link on the left
 * and its live example on the right. Radix mounts only the open panel, so each example starts
 * its reveal when its tab opens. The panel area keeps one height, so the page below does not move
 * when the step changes.
 *
 * @returns The section.
 */
export function StageVariant() {
  const [value, setValue] = useState<string>(STEPS[0]!.id);
  return (
    <section className={styles.section} aria-labelledby="stage-title">
      <Grid rowGap="space-8">
        <GridCell>
          <SectionHead id="stage-title" />
        </GridCell>
        <GridCell>
          <Tabs className={styles.tabs} value={value} onValueChange={setValue}>
            <div className={styles.bar}>
              <TabsList className={styles.list} aria-label="How it works">
                {STEPS.map((step, index) => (
                  <TabsTrigger key={step.id} value={step.id}>
                    {index + 1}. {step.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            {STEPS.map((step, index) => {
              const next = STEPS[index + 1];
              return (
                <TabsContent key={step.id} value={step.id} className={styles.panel}>
                  <div className={styles.copy}>
                    <h3 className={styles.stepTitle}>{step.title}</h3>
                    <p className={styles.body}>{step.text}</p>
                    <p className={styles.more}>
                      <StepLink step={step} />
                    </p>
                    {next ? (
                      <Button size="sm" onClick={() => setValue(next.id)}>
                        Next: {next.label}
                      </Button>
                    ) : null}
                  </div>
                  <div className={styles.visual}>
                    <step.Visual />
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        </GridCell>
      </Grid>
    </section>
  );
}
