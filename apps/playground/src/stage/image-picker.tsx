// image-picker.tsx: the controls under the test card that choose its photo: sample thumbnails,
// the viewer's own file, and Reset.

import { Button } from "@veilo/ui";
import { useRef, type ChangeEvent } from "react";
import { SAMPLE_IMAGES } from "./image-source.ts";
import styles from "./image-picker.module.css";

/** Props of {@link ImagePicker}. */
export interface ImagePickerProps {
  /** Id of the sample in use, or `null`. */
  selectedSample: string | null;
  /** The message to show, such as "That file is not an image.", or `null`. */
  error: string | null;
  /** Called with the id of a clicked sample. */
  onSample: (id: string) => void;
  /** Called with a chosen file. */
  onFile: (file: File) => void;
  /** Called by Reset. */
  onReset: () => void;
}

/**
 * The image controls. Side effects: opens the system file picker on "Use my own image".
 *
 * @param props - Selection, error and handlers.
 * @returns The controls.
 */
export function ImagePicker(props: ImagePickerProps) {
  const input = useRef<HTMLInputElement>(null);

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Clear, so choosing the same file again still fires change.
    event.target.value = "";
    if (file) props.onFile(file);
  };

  return (
    <div className={styles.picker}>
      <div className={styles.row} role="group" aria-label="Image">
        {SAMPLE_IMAGES.map((sample) => (
          <button
            key={sample.id}
            type="button"
            className={styles.thumb}
            aria-label={sample.label}
            aria-pressed={props.selectedSample === sample.id}
            onClick={() => props.onSample(sample.id)}
          >
            <img src={sample.url} alt="" className={styles.thumbImage} />
          </button>
        ))}
        <Button size="sm" onClick={() => input.current?.click()}>
          Use my own image
        </Button>
        <Button size="sm" variant="ghost" onClick={props.onReset}>
          Reset
        </Button>
        <input
          ref={input}
          type="file"
          accept="image/*"
          className={styles.file}
          tabIndex={-1}
          aria-hidden="true"
          onChange={onChange}
        />
      </div>
      <p className={styles.error} role="alert">
        {props.error}
      </p>
    </div>
  );
}
