// test-card.tsx: the card the playground animates: the product card of spec 1.2 or one of the
// other layouts of card-layouts.ts, with its slot markup and layout hints.

import type { Reveal, RevealOptions, Settings } from "@veilo/core";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent,
} from "react";
import { CARD_LAYOUTS, DEFAULT_LAYOUT, defaultText, type CardLayoutId } from "./card-layouts.ts";
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
  /** The card layout. Defaults to the product card. Read at mount: change the card's key. */
  layout?: CardLayoutId;
  /**
   * The user's text for this layout, by slot; parts without an entry show the layout's default.
   * Read at mount: change the card's key.
   */
  texts?: Record<string, string>;
  /**
   * The card width in CSS px; the layout's own width when absent. Read at mount: change the
   * card's key.
   */
  width?: number;
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
  // A layout without a large image always draws a square, whatever ratio was chosen.
  const ratio = useRef(
    CARD_LAYOUTS[props.layout ?? DEFAULT_LAYOUT].hasRatio ? (props.ratio ?? 1) : 1,
  );
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

  // The layout is read at mount, like the ratio: another layout comes with a new key.
  const [layout] = useState(() => CARD_LAYOUTS[props.layout ?? DEFAULT_LAYOUT]);
  // The user's text for this layout, read at mount too; parts without an edit show the default.
  const [edits] = useState(() => props.texts);
  // The width too: the layout's own unless the user chose one.
  const [width] = useState(() => props.width ?? layout.width);
  const text = (slot: string) => edits?.[slot] ?? defaultText(layout, slot);
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

  // The image area: the layout's class sets its size and shape; only layouts with a large image
  // take the chosen ratio, the others are a fixed square (thumbnail, avatar).
  const photoCanvas = (
    <canvas
      ref={photo}
      className={`${styles.image} ${styles[`image-${layout.id}`]}`}
      // The chosen shape; the drawing above matches it in canvas pixels.
      style={layout.hasRatio ? { aspectRatio: ratio.current } : undefined}
      data-veilo-slot="photo"
      aria-hidden="true"
      onDragOver={onDragOver}
      onDrop={onDrop}
    />
  );
  const heading = (
    <h2 className={styles.heading} data-veilo-slot="heading">
      {text("heading")}
    </h2>
  );
  const line = (slot: string) => (
    <p className={styles.line} data-veilo-slot={slot}>
      {text(slot)}
    </p>
  );
  const price = (
    <span className={styles.price} data-veilo-slot="price">
      {text("price")}
    </span>
  );
  const button = (
    <span className={styles.button} data-veilo-slot="buy">
      <span className={styles.label} data-veilo-slot="label">
        {text("label")}
      </span>
    </span>
  );

  return (
    <article
      ref={card}
      className={`${styles.card} ${styles[`card-${layout.id}`]}`}
      style={{ width }}
      role="button"
      tabIndex={0}
      aria-label={`Test card, ${layout.name.toLowerCase()}. Press to replay the animation.`}
      data-frame-ready={frameReady ? "" : undefined}
      onClick={replay}
      onKeyDown={onKeyDown}
    >
      {layout.id === "product" && (
        <>
          {photoCanvas}
          {heading}
          {line("line1")}
          {line("line2")}
          <span className={styles.prices}>
            {price}
            <span className={styles.oldPrice} data-veilo-slot="oldPrice">
              {text("oldPrice")}
            </span>
          </span>
          {button}
        </>
      )}
      {layout.id === "list" && (
        <>
          {photoCanvas}
          <span className={styles.stack}>
            {heading}
            {line("line1")}
          </span>
          {price}
        </>
      )}
      {layout.id === "profile" && (
        <>
          <span className={styles.person}>
            {photoCanvas}
            <span className={styles.stack}>
              {heading}
              {line("line1")}
            </span>
          </span>
          {line("line2")}
          {button}
        </>
      )}
      {layout.id === "article" && (
        <>
          {photoCanvas}
          {line("tag")}
          {heading}
          {line("line1")}
          {line("line2")}
          {line("meta")}
        </>
      )}
      {layout.id === "table" && (
        <>
          {photoCanvas}
          <span className={styles.stack}>
            {heading}
            {line("line1")}
          </span>
          {line("category")}
          {line("stock")}
          {price}
        </>
      )}
    </article>
  );
}
