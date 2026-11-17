// stage.tsx: the area that shows the test card on the dotted background, with the transport
// bar (playback and image tools) under it.

import type { Reveal, RevealOptions, Settings } from "@veilo/core";
import { useEffect, useRef, useState } from "react";
import { LOADER_KEYS } from "../panel/controls.ts";
import { createContentStore, useContent, type ContentStore } from "../state/content-store.ts";
import { useSetting, type SettingsStore } from "../state/settings-store.ts";
import { watchTheme } from "../theme/theme.ts";
import { ratioValue } from "./aspect-ratio.ts";
import { CARD_LAYOUTS } from "./card-layouts.ts";
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
  /** When set, the first card holds this progress, paused (a fixed-frame request). */
  frame?: number;
  /** The preview content, such as the image ratio. Defaults to a fresh store. */
  content?: ContentStore;
}

/** How long (ms) after the last keystroke the card is rebuilt with the new text. */
export const TEXT_REPLAY_DELAY = 500;

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
 * The stage: the test card centered on a calm surface, and the transport bar with the image
 * picker. Side effects: decodes chosen images, and rebuilds the reveal when settings change (at
 * most once per animation frame, so a slider drag does not rebuild on every pointer move) or the
 * image ratio changes.
 *
 * @param props - The store, reveal options, optional fixed frame and content store.
 * @returns The stage section and the transport bar.
 */
export function Stage(props: StageProps) {
  const { store } = props;
  const [photo, setPhoto] = useState<PhotoState>({
    key: 0,
    image: null,
    sample: null,
    // A fixed-frame request holds the first card only; any later change plays as usual.
    start: props.frame === undefined ? "sequence" : "frame",
  });
  const [error, setError] = useState<string | null>(null);
  const [reveal, setReveal] = useState<Reveal | null>(null);
  const [content] = useState(() => props.content ?? createContentStore());
  const ratioId = useContent(content, "ratio");
  const layoutId = useContent(content, "layout");
  const texts = useContent(content, "texts");
  const widths = useContent(content, "widths");
  const [loop, setLoop] = useState(false);
  // The reduced-motion preview: off when the page opens and never saved, so the preview shows
  // the full effect by default (the spec's rule), whatever the viewer's own setting.
  const [reducedMotion, setReducedMotion] = useState(false);
  const duration = useSetting(store, "rDur");
  // Only the latest request may win when loads overlap.
  const request = useRef(0);

  // Collect the keys changed within one frame, then rebuild the card once.
  useEffect(() => {
    let changed = new Set<string>();
    let loaded = false;
    let frame = 0;
    const unsubscribe = store.subscribe((next, previous) => {
      const keys = new Set([...Object.keys(next.settings), ...Object.keys(previous.settings)]);
      for (const key of keys) {
        if (next.settings[key as keyof Settings] !== previous.settings[key as keyof Settings]) {
          changed.add(key);
        }
      }
      // A load plays the full sequence (spec 1.6), whatever it changed.
      if (next.loads !== previous.loads) loaded = true;
      if (frame || (changed.size === 0 && !loaded)) return;
      frame = requestAnimationFrame(() => {
        const start = loaded ? "sequence" : startAfterChange(changed);
        changed = new Set();
        loaded = false;
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

  // A new ratio or layout needs a new card (both are read at mount), which plays the full
  // sequence.
  useEffect(
    () =>
      content.subscribe((next, previous) => {
        if (
          next.content.ratio === previous.content.ratio &&
          next.content.layout === previous.content.layout
        ) {
          return;
        }
        setPhoto((current) => ({ ...current, key: current.key + 1, start: "sequence" }));
      }),
    [content],
  );

  // Edited text and width also need a new card, but typing or dragging must not replay the
  // animation on every change: wait until the user pauses.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = content.subscribe((next, previous) => {
      if (
        next.content.texts === previous.content.texts &&
        next.content.widths === previous.content.widths
      ) {
        return;
      }
      clearTimeout(timer);
      timer = setTimeout(() => {
        setPhoto((current) => ({ ...current, key: current.key + 1, start: "sequence" }));
      }, TEXT_REPLAY_DELAY);
    });
    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, [content]);

  // A theme change recolors the grid canvas in place (spec 1.4); CSS handles the rest.
  useEffect(() => (reveal ? watchTheme(() => reveal.redraw()) : undefined), [reveal]);

  const onSample = (id: string) => {
    const sample = SAMPLE_IMAGES.find((item) => item.id === id);
    if (sample) show(loadImageUrl(sample.url), id);
  };
  const onFile = (file: File) => show(loadImageFile(file), null);
  const onReset = () => show(Promise.resolve(null), null);
  // The option is read when a reveal is created, so a new card plays the full sequence with it.
  const onReducedMotion = (next: boolean) => {
    setReducedMotion(next);
    setPhoto((current) => ({ ...current, key: current.key + 1, start: "sequence" }));
  };

  return (
    <div className={styles.column}>
      <section className={styles.stage} aria-label="Preview">
        <TestCard
          key={photo.key}
          settings={store.getState().settings}
          // Always set: the preview never follows the viewer's own preference (core's default).
          revealOptions={{ ...props.revealOptions, reducedMotion }}
          layout={layoutId}
          texts={texts[layoutId]}
          width={widths[layoutId]}
          image={photo.image}
          ratio={ratioValue(ratioId, photo.image)}
          onImageDrop={onFile}
          start={photo.start}
          frame={props.frame}
          loop={loop}
          onReveal={setReveal}
        />
      </section>
      <TransportBar
        reveal={reveal}
        duration={duration}
        loop={loop}
        onLoopChange={setLoop}
        reducedMotion={reducedMotion}
        onReducedMotionChange={onReducedMotion}
      >
        <ImagePicker
          selectedSample={photo.sample}
          error={error}
          onSample={onSample}
          onFile={onFile}
          onReset={onReset}
          // Only layouts with a large image have a ratio to choose.
          ratio={CARD_LAYOUTS[layoutId].hasRatio ? ratioId : undefined}
          onRatioChange={(ratio) => content.getState().setRatio(ratio)}
        />
      </TransportBar>
    </div>
  );
}
