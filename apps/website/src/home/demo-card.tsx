// demo-card.tsx: the live product card. The site's own demo runs on @veilo/react.

import type { PresetId } from "@veilo/presets";
import { useReveal } from "@veilo/react";
import { Card, watchTheme } from "@veilo/ui";
import { useEffect, useLayoutEffect, useRef } from "react";
import { DemoReadout } from "./demo-readout.tsx";
import styles from "./demo-card.module.css";
import { drawProductPhoto } from "./demo-photo.ts";

/** Slot hints for the card's parts, as the playground's test card uses them. */
const LAYOUT = {
  version: 1,
  slots: {
    photo: { role: "image" },
    heading: { role: "text", width: 58 },
    line1: { role: "text", width: 96 },
    line2: { role: "text", width: 70 },
    price: { role: "text" },
    oldPrice: { role: "text" },
    buy: { role: "button" },
    label: { role: "text" },
  },
} as const;

/** Props of {@link DemoCard}. */
export interface DemoCardProps {
  /** The preset id to play, for example `dot-upscale`. */
  preset: PresetId;
  /** Shows the state and progress readout under the card. Defaults to true. */
  readout?: boolean;
}

/**
 * A product card that plays the whole sequence on a loop: the skeleton, the reveal and the
 * finished card. The photo is drawn before the reveal exists, because the reveal samples its
 * pixels. The reveal reads its ink from the page, so it is redrawn when the theme changes.
 *
 * Side effects: creates a reveal through `useReveal` and destroys it on unmount; listens for
 * theme changes while mounted.
 *
 * @param props - The preset and whether to show the readout.
 * @returns The card, and the readout under it.
 */
export function DemoCard(props: DemoCardProps) {
  const { preset, readout = true } = props;
  const photo = useRef<HTMLCanvasElement>(null);
  const { ref, reveal } = useReveal<HTMLElement>({ preset, layout: LAYOUT });

  // Draw before paint, so the reveal, which is created after this commit, samples the finished
  // picture.
  useLayoutEffect(() => {
    if (photo.current) drawProductPhoto(photo.current);
  }, []);

  useEffect(() => {
    if (!reveal) return;
    reveal.playSequence({ loop: true });
  }, [reveal]);

  useEffect(() => {
    if (!reveal) return;
    return watchTheme(() => reveal.redraw());
  }, [reveal]);

  return (
    <div className={styles.demo}>
      <Card
        as="article"
        raised
        ref={ref}
        className={styles.card}
        aria-label="Demo product card: MCHOSE L7 Pro"
      >
        <canvas ref={photo} className={styles.photo} data-veilo-slot="photo" aria-hidden="true" />
        <p className={styles.heading} data-veilo-slot="heading">
          MCHOSE L7 Pro
        </p>
        <p className={styles.line} data-veilo-slot="line1">
          Lightweight 8K polling mouse with
        </p>
        <p className={styles.line} data-veilo-slot="line2">
          tri-mode wireless and a 60 g shell.
        </p>
        <div className={styles.prices}>
          <span className={styles.price} data-veilo-slot="price">
            $59.99
          </span>
          <span className={styles.oldPrice} data-veilo-slot="oldPrice">
            $79.99
          </span>
        </div>
        <span className={styles.buy} data-veilo-slot="buy">
          <span data-veilo-slot="label">Buy now</span>
        </span>
      </Card>
      {readout && <DemoReadout reveal={reveal} />}
    </div>
  );
}
