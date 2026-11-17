// content-tab.tsx: the Content tab: what the preview card shows. For now the layout picker; text
// fields and the width slider join in the next steps of the Custom content task.

import { Select } from "@veilo/ui";
import type { ContentStore } from "../state/content-store.ts";
import { useContent } from "../state/content-store.ts";
import { CARD_LAYOUTS, LAYOUT_IDS, toLayoutId } from "../stage/card-layouts.ts";
import styles from "./panel.module.css";

/** Props of {@link ContentTab}. */
export interface ContentTabProps {
  /** The content store the controls read and write. */
  content: ContentStore;
}

/** The layout select's options, in the table's order. */
const LAYOUT_OPTIONS = LAYOUT_IDS.map((id) => ({ value: id, label: CARD_LAYOUTS[id].name }));

/**
 * The Content tab. Side effects: writes the chosen layout to the content store, which rebuilds
 * the card and plays the full sequence.
 *
 * @param props - The content store.
 * @returns The tab's controls.
 */
export function ContentTab(props: ContentTabProps) {
  const layout = useContent(props.content, "layout");
  return (
    <fieldset className={styles.group}>
      <legend className={styles.legend}>Card</legend>
      <Select
        label="Layout"
        value={layout}
        options={LAYOUT_OPTIONS}
        onValueChange={(value) => {
          const next = toLayoutId(value);
          if (next) props.content.getState().setLayout(next);
        }}
      />
    </fieldset>
  );
}
