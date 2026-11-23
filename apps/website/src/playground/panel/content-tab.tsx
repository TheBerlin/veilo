// content-tab.tsx: the Content tab: what the preview card shows. The card (layout and width), the
// image (a sample, the user's own file, and its ratio), one text field per part of the layout, and
// a button that resets the text and width.

import { Button, Select, Slider, TextField } from "@veilo-ui/ui";
import { useStore } from "zustand";
import type { ContentStore } from "../state/content-store.ts";
import { useContent } from "../state/content-store.ts";
import { ImagePicker } from "../stage/image-picker.tsx";
import {
  CARD_LAYOUTS,
  LAYOUT_IDS,
  TEXT_LIMIT,
  toLayoutId,
  WIDTH_MAX,
  WIDTH_MIN,
  WIDTH_STEP,
} from "../stage/card-layouts.ts";
import styles from "./panel.module.css";

/** Props of {@link ContentTab}. */
export interface ContentTabProps {
  /** The content store the controls read and write. */
  content: ContentStore;
}

/** The layout select's options, in the table's order. */
const LAYOUT_OPTIONS = LAYOUT_IDS.map((id) => ({ value: id, label: CARD_LAYOUTS[id].name }));

/**
 * The Content tab. Side effects: writes the chosen layout, text and width to the content store,
 * which rebuilds the card and plays the full sequence (at once for a layout, after a pause in
 * typing or dragging for text and width).
 *
 * @param props - The content store.
 * @returns The tab's controls.
 */
export function ContentTab(props: ContentTabProps) {
  const layoutId = useContent(props.content, "layout");
  const edits = useContent(props.content, "texts")[layoutId];
  const width = useContent(props.content, "widths")[layoutId];
  const layout = CARD_LAYOUTS[layoutId];
  const photo = useStore(props.content, (state) => state.photo);
  const ratio = useContent(props.content, "ratio");
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
        <Slider
          label="Card width"
          value={width ?? layout.width}
          min={WIDTH_MIN}
          max={WIDTH_MAX}
          step={WIDTH_STEP}
          formatValue={(value) => `${value} px`}
          onValueChange={(next) => props.content.getState().setWidth(layoutId, next)}
        />
      </fieldset>
      {/* The inbox has no picture, so it has nothing to choose here. */}
      {layout.picture && (
        <fieldset className={styles.group}>
          <legend className={styles.legend}>Image</legend>
          <ImagePicker
            selectedSample={photo.sample}
            error={photo.error}
            onSample={(id) => props.content.getState().pickSample(id)}
            onFile={(file) => props.content.getState().pickFile(file)}
            onReset={() => props.content.getState().clearPhoto()}
            // Only layouts with a large image have a ratio to choose.
            ratio={layout.hasRatio ? ratio : undefined}
            onRatioChange={(next) => props.content.getState().setRatio(next)}
          />
        </fieldset>
      )}
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
      </fieldset>
      <Button
        size="sm"
        variant="ghost"
        disabled={!edits && width === undefined}
        onClick={() => props.content.getState().resetLayout(layoutId)}
      >
        Reset content
      </Button>
    </>
  );
}
