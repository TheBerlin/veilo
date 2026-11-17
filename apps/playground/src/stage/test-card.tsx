// test-card.tsx: the fixed product card the playground animates (spec 1.2), with its slot
// markup and layout hints.

import type { Reveal, RevealOptions, Settings } from "@veilo/core";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent,
} from "react";
import { defaultText, PRODUCT_LAYOUT } from "./card-layouts.ts";
import { drawImageCover, type CardImage } from "./image-source.ts";
import { drawPlaceholderImage } from "./placeholder-image.ts";
import styles from "./test-card.module.css";
import { useReveal, type RevealStart } from "./use-reveal.ts";

/** Props of {@link TestCard}. */
export interface TestCardProps {
  /** The settings at mount. */
  settings: Settings;
  /** Reveal options, such as a test scheduler. */
  revealOptions?: RevealOptions;
  /** The photo; the drawn placeholder when absent. Read at mount: change the card's key. */
  image?: CardImage | null;
  /**
   * The image area's width divided by its height. Defaults to 1 (square). Read at mount: change
   * the card's key.
   */
  ratio?: number;
  /** Called with a file dropped on the image area. */
  onImageDrop?: (file: File) => void;
  /** How the reveal starts at mount. Defaults to the full sequence. */
  start?: RevealStart;
  /** The progress to hold when `start` is `frame`. Read at mount. */
  frame?: number;
  /** Whether sequences loop: the first one (read at mount) and replays by click or key. */
  loop?: boolean;
  /** Receives the live reveal after mount and `null` after unmount. */
  onReveal?: (reveal: Reveal | null) => void;
}

/** Width changes smaller than this (CSS px) do not redraw the photo. */
const REDRAW_THRESHOLD = 2;

/**
 * The test card: image, heading, two description lines, price, old price and button, in that
 * order. Click, Enter or Space replays the full sequence; a file dropped on the image area goes
 * to `onImageDrop`. With a `frame` start, the card gets `data-frame-ready` once the held frame
 * is drawn, which the visual tests wait for. Side effects: draws the photo (again when its width changes by 2 px or more)
 * and runs a reveal on the card while mounted.
 *
 * @param props - The settings, reveal options, photo and its ratio, drop handler, start, frame,
 *   loop flag and reveal callback.
 * @returns The card.
 */
export function TestCard(props: TestCardProps) {
  const card = useRef<HTMLElement>(null);
  const photo = useRef<HTMLCanvasElement>(null);

  // Read at mount, like the reveal: a new image comes with a new key, so a fresh card.
  const image = useRef(props.image ?? null);
  const ratio = useRef(props.ratio ?? 1);
  const draw = (canvas: HTMLCanvasElement) => {
    if (image.current) {
      drawImageCover(canvas, image.current, ratio.current, window.devicePixelRatio);
    } else {
      drawPlaceholderImage(canvas, ratio.current, window.devicePixelRatio);
    }
  };

  // A layout effect runs before the reveal's effect, so the image is drawn before it is sampled.
  useLayoutEffect(() => {
    if (photo.current) draw(photo.current);
  }, []);

  // Redraw at the new size when the card's width changes noticeably.
  useEffect(() => {
    const canvas = photo.current;
    if (!canvas) return;
    let drawnWidth = canvas.clientWidth;
    const observer = new ResizeObserver(() => {
      if (Math.abs(canvas.clientWidth - drawnWidth) < REDRAW_THRESHOLD) return;
      drawnWidth = canvas.clientWidth;
      draw(canvas);
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  // Only the product layout exists so far; the text comes from its table.
  const layout = PRODUCT_LAYOUT;
  const text = (slot: string) => defaultText(layout, slot);
  const [frameReady, setFrameReady] = useState(false);
  const reveal = useReveal(
    card,
    { version: 1, settings: props.settings, slots: layout.slots },
    props.revealOptions,
    {
      start: props.start,
      frame: props.frame,
      loop: props.loop,
      onReveal: props.onReveal,
      onFrameReady: () => setFrameReady(true),
    },
  );

  const replay = () => reveal.current?.playSequence({ loop: props.loop ?? false });
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    // Space would scroll the page otherwise.
    event.preventDefault();
    replay();
  };
  // The browser opens a dropped file unless dragover and drop are cancelled.
  const onDragOver = (event: DragEvent) => event.preventDefault();
  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) props.onImageDrop?.(file);
  };

  return (
    <article
      ref={card}
      className={styles.card}
      role="button"
      tabIndex={0}
      aria-label="Test card: MCHOSE L7 Pro. Press to replay the animation."
      data-frame-ready={frameReady ? "" : undefined}
      onClick={replay}
      onKeyDown={onKeyDown}
    >
      <canvas
        ref={photo}
        className={styles.image}
        // The chosen shape; the drawing above matches it in canvas pixels.
        style={{ aspectRatio: ratio.current }}
        data-veilo-slot="photo"
        aria-hidden="true"
        onDragOver={onDragOver}
        onDrop={onDrop}
      />
      <h2 className={styles.heading} data-veilo-slot="heading">
        {text("heading")}
      </h2>
      <p className={styles.line} data-veilo-slot="line1">
        {text("line1")}
      </p>
      <p className={styles.line} data-veilo-slot="line2">
        {text("line2")}
      </p>
      <span className={styles.prices}>
        <span className={styles.price} data-veilo-slot="price">
          {text("price")}
        </span>
        <span className={styles.oldPrice} data-veilo-slot="oldPrice">
          {text("oldPrice")}
        </span>
      </span>
      <span className={styles.button} data-veilo-slot="buy">
        <span className={styles.label} data-veilo-slot="label">
          {text("label")}
        </span>
      </span>
    </article>
  );
}
