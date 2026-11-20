// framework-demo.tsx: the "Your framework" demo: a switcher over the same card written for each way
// into Veilo, with the install command under the code. Nothing moves by itself: the visitor picks.

import { ChipGroup, ChipGroupItem, CodeBlock } from "@veilo-ui/ui";
import { useState } from "react";
import { FRAMEWORK_SNIPPETS } from "./framework-snippets.ts";
import styles from "./framework-demo.module.css";

/**
 * The demo: six choices, the code for the chosen one and, where there is one, its install command.
 * Every example is laid out in the same cell of a grid and only the chosen one is visible, so the
 * demo is as tall as the longest and nothing around it moves when the choice changes. The ones not
 * shown are hidden with `visibility`, which also takes them out of the tab order and away from
 * screen readers.
 *
 * Side effects: none beyond the Copy button's clipboard write.
 *
 * @returns The switcher, the code and the note.
 */
export function FrameworkDemo() {
  const [chosen, setChosen] = useState<string>(FRAMEWORK_SNIPPETS[0]!.id);
  return (
    <div className={styles.demo}>
      <ChipGroup
        aria-label="Framework"
        value={chosen}
        // Pressing the chosen item keeps it: one is always chosen.
        onValueChange={(value) => value && setChosen(value)}
        variant="segmented"
      >
        {FRAMEWORK_SNIPPETS.map((item) => (
          <ChipGroupItem key={item.id} value={item.id}>
            {item.label}
          </ChipGroupItem>
        ))}
      </ChipGroup>
      <div className={styles.stack}>
        {FRAMEWORK_SNIPPETS.map((item) => (
          <div key={item.id} className={styles.panel} data-chosen={item.id === chosen || undefined}>
            <CodeBlock code={item.code} narrow="wrap" aria-label={`${item.label} example`} />
            {item.install ? (
              <CodeBlock
                code={item.install}
                prompt
                narrow="wrap"
                aria-label={`${item.label} install command`}
              />
            ) : (
              <p className={styles.none}>{item.note}</p>
            )}
          </div>
        ))}
      </div>
      <p className={styles.note}>
        The packages arrive with the first public release. The playground exports the same settings
        today.
      </p>
    </div>
  );
}
