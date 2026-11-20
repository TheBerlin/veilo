// framework-demo.tsx: the "Your framework" demo: a switcher over the same card written for each way
// into Veilo, with the install command under the code. Nothing moves by itself: the visitor picks.

import { ChipGroup, ChipGroupItem, CodeBlock } from "@veilo-ui/ui";
import { useEffect, useRef, useState, type RefObject } from "react";
import { FRAMEWORK_SNIPPETS } from "./framework-snippets.ts";
import styles from "./framework-demo.module.css";

/**
 * Tells whether the choices run past the group's edge, so the fade and the room for the last choice
 * are only there when something scrolls. It measures the choices without the end padding that
 * the scrolling layout adds, so it does not wait on its own answer.
 *
 * Side effects: observes the group's size while mounted.
 *
 * @param bar - The element that holds the group.
 * @returns True while the choices overflow the group.
 */
function useScrolls(bar: RefObject<HTMLElement | null>): boolean {
  const [scrolls, setScrolls] = useState(false);
  useEffect(() => {
    const group = bar.current?.querySelector<HTMLElement>("[role=radiogroup]");
    if (!group) return;
    const measure = () => {
      const padding = parseFloat(getComputedStyle(group).paddingInlineEnd) || 0;
      setScrolls(group.scrollWidth - padding > group.clientWidth + 1);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(group);
    return () => observer.disconnect();
  }, [bar]);
  return scrolls;
}

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
  const bar = useRef<HTMLDivElement>(null);
  const scrolls = useScrolls(bar);
  return (
    <div className={styles.demo}>
      <div ref={bar} className={styles.bar} data-scrolls={scrolls || undefined}>
        <ChipGroup
          aria-label="Framework"
          value={chosen}
          // Pressing the chosen item keeps it: one is always chosen.
          onValueChange={(value) => value && setChosen(value)}
          variant="segmented"
          className={styles.switcher}
        >
          {FRAMEWORK_SNIPPETS.map((item) => (
            <ChipGroupItem key={item.id} value={item.id}>
              {item.label}
            </ChipGroupItem>
          ))}
        </ChipGroup>
      </div>
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
