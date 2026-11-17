// content-tab.tsx: the Content tab: what the preview card shows. The layout picker and one text
// field per part of the layout; the width slider joins in the next step of the Custom content
// task.

import { Button, Select, TextField } from "@veilo/ui";
import type { ContentStore } from "../state/content-store.ts";
import { useContent } from "../state/content-store.ts";
import { CARD_LAYOUTS, LAYOUT_IDS, TEXT_LIMIT, toLayoutId } from "../stage/card-layouts.ts";
import styles from "./panel.module.css";

/** Props of {@link ContentTab}. */
export interface ContentTabProps {
  /** The content store the controls read and write. */
  content: ContentStore;
}

/** The layout select's options, in the table's order. */
const LAYOUT_OPTIONS = LAYOUT_IDS.map((id) => ({ value: id, label: CARD_LAYOUTS[id].name }));

/**
 * The Content tab. Side effects: writes the chosen layout and the typed text to the content
 * store, which rebuilds the card and plays the full sequence (at once for a layout, after a
 * pause in typing for text).
 *
 * @param props - The content store.
 * @returns The tab's controls.
 */
export function ContentTab(props: ContentTabProps) {
  const layoutId = useContent(props.content, "layout");
  const edits = useContent(props.content, "texts")[layoutId];
  const layout = CARD_LAYOUTS[layoutId];
  return (
    <>
      <fieldset className={styles.group}>
        <legend className={styles.legend}>Card</legend>
        <Select
          label="Layout"
          value={layoutId}
          options={LAYOUT_OPTIONS}
          onValueChange={(value) => {
            const next = toLayoutId(value);
            if (next) props.content.getState().setLayout(next);
          }}
        />
      </fieldset>
      <fieldset className={styles.group}>
        <legend className={styles.legend}>Text</legend>
        {layout.texts.map((part) => (
          <TextField
            // The layout is in the key, so switching layouts never carries focus or a draft over.
            key={`${layoutId}-${part.slot}`}
            label={part.label}
            value={edits?.[part.slot] ?? part.text}
            maxLength={TEXT_LIMIT}
            onValueChange={(text) => props.content.getState().setText(layoutId, part.slot, text)}
          />
        ))}
        <Button
          size="sm"
          variant="ghost"
          disabled={!edits}
          onClick={() => props.content.getState().resetTexts(layoutId)}
        >
          Reset text
        </Button>
      </fieldset>
    </>
  );
}
