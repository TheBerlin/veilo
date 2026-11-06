// stage.tsx: the area that shows the test card on the dotted background, with the image
// controls under it.

import type { RevealOptions } from "@veilo/core";
import { useRef, useState } from "react";
import type { SettingsStore } from "../state/settings-store.ts";
import { ImagePicker } from "./image-picker.tsx";
import {
  loadImageFile,
  loadImageUrl,
  NOT_AN_IMAGE,
  SAMPLE_IMAGES,
  type CardImage,
} from "./image-source.ts";
import styles from "./stage.module.css";
import { TestCard } from "./test-card.tsx";

/** Props of {@link Stage}. */
export interface StageProps {
  /** The settings store; the card starts from its current settings. */
  store: SettingsStore;
  /** Reveal options, such as a test scheduler. */
  revealOptions?: RevealOptions;
}

/** The card's photo: the placeholder (`image` null), a sample or a file. */
interface PhotoState {
  /** The card's key; a new one rebuilds the card and replays the full sequence. */
  key: number;
  image: CardImage | null;
  sample: string | null;
}

/**
 * The stage: the test card centered on the dot grid, and the image picker. Side effects:
 * decodes chosen images.
 *
 * @param props - The store and reveal options.
 * @returns The stage section.
 */
export function Stage(props: StageProps) {
  const [photo, setPhoto] = useState<PhotoState>({ key: 0, image: null, sample: null });
  const [error, setError] = useState<string | null>(null);
  // Only the latest request may win when loads overlap.
  const request = useRef(0);

  const show = (load: Promise<CardImage | null>, sample: string | null) => {
    const id = ++request.current;
    load.then(
      (image) => {
        if (id !== request.current) return;
        setError(null);
        setPhoto((current) => ({ key: current.key + 1, image, sample }));
      },
      () => {
        if (id === request.current) setError(NOT_AN_IMAGE);
      },
    );
  };

  const onSample = (id: string) => {
    const sample = SAMPLE_IMAGES.find((item) => item.id === id);
    if (sample) show(loadImageUrl(sample.url), id);
  };
  const onFile = (file: File) => show(loadImageFile(file), null);
  const onReset = () => show(Promise.resolve(null), null);

  return (
    <section className={styles.stage} aria-label="Preview">
      <TestCard
        key={photo.key}
        settings={props.store.getState().settings}
        revealOptions={props.revealOptions}
        image={photo.image}
        onImageDrop={onFile}
      />
      <ImagePicker
        selectedSample={photo.sample}
        error={error}
        onSample={onSample}
        onFile={onFile}
        onReset={onReset}
      />
    </section>
  );
}
