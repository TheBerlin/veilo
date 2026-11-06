// test-card.tsx: the fixed product card the playground animates (spec 1.2), with its slot
// markup and layout hints.

import type { Layout, RevealOptions, Settings } from "@veilo/core";
import { useLayoutEffect, useRef, type KeyboardEvent } from "react";
import { drawPlaceholderImage } from "./placeholder-image.ts";
import styles from "./test-card.module.css";
import { useReveal } from "./use-reveal.ts";

/**
 * The card's slots and skeleton bar widths (spec 1.2). The image and the button are full width.
 * "Buy now" is a span named as the button role, because the whole card is already a button and
 * a button inside a button is invalid.
 */
export const CARD_SLOTS: Layout["slots"] = {
  photo: { role: "image" },
  heading: { role: "text", width: 58 },
  line1: { role: "text", width: 96 },
  line2: { role: "text", width: 70 },
  // The prices are sized to 28% and 20% of their row in CSS, so their bars are full width.
  price: { role: "text" },
  oldPrice: { role: "text" },
  buy: { role: "button" },
  label: { role: "text" },
};

/** Props of {@link TestCard}. */
export interface TestCardProps {
  /** The settings at mount. */
  settings: Settings;
  /** Reveal options, such as a test scheduler. */
  revealOptions?: RevealOptions;
}

/**
 * The test card: image, heading, two description lines, price, old price and button, in that
 * order. Click, Enter or Space replays the full sequence. Side effects: draws the placeholder
 * image and runs a reveal on the card while mounted.
 *
 * @param props - The settings and reveal options.
 * @returns The card.
 */
export function TestCard(props: TestCardProps) {
  const card = useRef<HTMLElement>(null);
  const photo = useRef<HTMLCanvasElement>(null);

  // A layout effect runs before the reveal's effect, so the image is drawn before it is sampled.
  useLayoutEffect(() => {
    if (photo.current) drawPlaceholderImage(photo.current, window.devicePixelRatio);
  }, []);

  const reveal = useReveal(
    card,
    { version: 1, settings: props.settings, slots: CARD_SLOTS },
    props.revealOptions,
  );

  const replay = () => reveal.current?.playSequence();
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    // Space would scroll the page otherwise.
    event.preventDefault();
    replay();
  };

  return (
    <article
      ref={card}
      className={styles.card}
      role="button"
      tabIndex={0}
      aria-label="Test card: MCHOSE L7 Pro. Press to replay the animation."
      onClick={replay}
      onKeyDown={onKeyDown}
    >
      <canvas ref={photo} className={styles.image} data-veilo-slot="photo" aria-hidden="true" />
      <h2 className={styles.heading} data-veilo-slot="heading">
        MCHOSE L7 Pro
      </h2>
      <p className={styles.line} data-veilo-slot="line1">
        Lightweight 8K polling mouse with
      </p>
      <p className={styles.line} data-veilo-slot="line2">
        tri-mode wireless and a 60 g shell.
      </p>
      <span className={styles.prices}>
        <span className={styles.price} data-veilo-slot="price">
          $59.99
        </span>
        <span className={styles.oldPrice} data-veilo-slot="oldPrice">
          $79.99
        </span>
      </span>
      <span className={styles.button} data-veilo-slot="buy">
        <span className={styles.label} data-veilo-slot="label">
          Buy now
        </span>
      </span>
    </article>
  );
}
