// stage.tsx: the area that shows the test card on the dotted background.

import type { RevealOptions } from "@veilo/core";
import type { SettingsStore } from "../state/settings-store.ts";
import styles from "./stage.module.css";
import { TestCard } from "./test-card.tsx";

/** Props of {@link Stage}. */
export interface StageProps {
  /** The settings store; the card starts from its current settings. */
  store: SettingsStore;
  /** Reveal options, such as a test scheduler. */
  revealOptions?: RevealOptions;
}

/**
 * The stage: the test card centered on the dot grid.
 *
 * @param props - The store and reveal options.
 * @returns The stage section.
 */
export function Stage(props: StageProps) {
  return (
    <section className={styles.stage} aria-label="Preview">
      <TestCard settings={props.store.getState().settings} revealOptions={props.revealOptions} />
    </section>
  );
}
