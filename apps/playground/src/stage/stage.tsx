// stage.tsx: the area that shows the test card on the dotted background, with the transport
// bar (playback and image tools) under it.

import type { Reveal, RevealOptions, Settings } from "@veilo/core";
import { useEffect, useRef, useState } from "react";
import { LOADER_KEYS } from "../panel/controls.ts";
import { useSetting, type SettingsStore } from "../state/settings-store.ts";
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
import { TransportBar } from "./transport-bar.tsx";
import type { RevealStart } from "./use-reveal.ts";

/** Props of {@link Stage}. */
export interface StageProps {
  /** The settings store; the card starts from its current settings. */
  store: SettingsStore;
  /** Reveal options, such as a test scheduler. */
  revealOptions?: RevealOptions;
}

/** The card's photo (the placeholder when `image` is null) and how its reveal starts. */
interface PhotoState {
  /** The card's key; a new one rebuilds the card and its reveal. */
  key: number;
  image: CardImage | null;
  sample: string | null;
  start: RevealStart;
}

/**
 * How the reveal restarts after settings change (spec 1.4): Loader keys show Loading, Reveal
 * keys replay the reveal, and both at once play the full sequence.
 *
 * @param keys - The keys that changed.
 * @returns The start mode.
 */
export function startAfterChange(keys: Iterable<string>): RevealStart {
  let loader = false;
  let reveal = false;
  for (const key of keys) {
    if (LOADER_KEYS.has(key)) loader = true;
    else reveal = true;
  }
  if (loader && reveal) return "sequence";
  return loader ? "loading" : "reveal";
}

/**
 * The stage: the test card centered on the dot grid, and the transport bar with the image
 * picker. Side effects: decodes chosen images, and rebuilds the reveal when settings change (at
 * most once per animation frame, so a slider drag does not rebuild on every pointer move).
 *
 * @param props - The store and reveal options.
 * @returns The stage section and the transport bar.
 */
export function Stage(props: StageProps) {
  const { store } = props;
  const [photo, setPhoto] = useState<PhotoState>({
    key: 0,
    image: null,
    sample: null,
    start: "sequence",
  });
  const [error, setError] = useState<string | null>(null);
  const [reveal, setReveal] = useState<Reveal | null>(null);
  const [loop, setLoop] = useState(false);
  const duration = useSetting(store, "rDur");
  // Only the latest request may win when loads overlap.
  const request = useRef(0);

  // Collect the keys changed within one frame, then rebuild the card once.
  useEffect(() => {
    let changed = new Set<string>();
    let frame = 0;
    const unsubscribe = store.subscribe((next, previous) => {
      const keys = new Set([...Object.keys(next.settings), ...Object.keys(previous.settings)]);
      for (const key of keys) {
        if (next.settings[key as keyof Settings] !== previous.settings[key as keyof Settings]) {
          changed.add(key);
        }
      }
      if (frame || changed.size === 0) return;
      frame = requestAnimationFrame(() => {
        const start = startAfterChange(changed);
        changed = new Set();
        frame = 0;
        setPhoto((current) => ({ ...current, key: current.key + 1, start }));
      });
    });
    return () => {
      unsubscribe();
      cancelAnimationFrame(frame);
    };
  }, [store]);

  const show = (load: Promise<CardImage | null>, sample: string | null) => {
    const id = ++request.current;
    load.then(
      (image) => {
        if (id !== request.current) return;
        setError(null);
        setPhoto((current) => ({ key: current.key + 1, image, sample, start: "sequence" }));
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
    <div className={styles.column}>
      <section className={styles.stage} aria-label="Preview">
        <TestCard
          key={photo.key}
          settings={store.getState().settings}
          revealOptions={props.revealOptions}
          image={photo.image}
          onImageDrop={onFile}
          start={photo.start}
          loop={loop}
          onReveal={setReveal}
        />
      </section>
      <TransportBar reveal={reveal} duration={duration} loop={loop} onLoopChange={setLoop}>
        <ImagePicker
          selectedSample={photo.sample}
          error={error}
          onSample={onSample}
          onFile={onFile}
          onReset={onReset}
        />
      </TransportBar>
    </div>
  );
}
