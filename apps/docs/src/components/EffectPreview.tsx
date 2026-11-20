// EffectPreview.tsx: a live preview of one preset for the docs' Effects pages. It runs the real
// engine on a small product card: the skeleton, then the reveal, once when the card scrolls into
// view (the page loads it with `client:visible`), and again whenever Replay is pressed.

import { useReveal } from "@veilo-ui/react";
import type { PresetId } from "@veilo-ui/presets";
import { useEffect } from "react";
import styles from "./effect-preview.module.css";

/** Props of {@link EffectPreview}. */
export interface EffectPreviewProps {
  /** The preset to show, such as `"hex-from-center"`. */
  preset: PresetId;
}

/**
 * The preview: a product card with a photo, three lines of text and a button, and a Replay button
 * under it. The sequence plays by itself once and then rests on the finished card, so nothing
 * loops without the reader asking.
 *
 * Side effects: creates the engine's reveal on the card while mounted and destroys it on unmount.
 *
 * @param props - The preset to show.
 * @returns The card and its Replay button.
 */
export default function EffectPreview(props: EffectPreviewProps) {
  const { ref, reveal } = useReveal<HTMLDivElement>({ preset: props.preset });

  // The reveal exists once the card has mounted: play the whole sequence once.
  useEffect(() => {
    reveal?.playSequence();
  }, [reveal]);

  return (
    <figure className={styles.preview}>
      <div ref={ref} className={styles.card}>
        <img
          className={styles.photo}
          data-veilo-slot="photo"
          src="/effects/figure.webp"
          alt="A sample picture"
        />
        <h3 className={styles.title} data-veilo-slot="title">
          MCHOSE L7 Pro
        </h3>
        <p className={styles.text} data-veilo-slot="description">
          Lightweight 8K polling mouse with tri-mode wireless
        </p>
        <p className={styles.price} data-veilo-slot="price">
          $59.99
        </p>
        <button className={styles.buy} type="button" data-veilo-slot="buy">
          <span data-veilo-slot="label">Buy now</span>
        </button>
      </div>
      <button className={styles.replay} type="button" onClick={() => reveal?.playSequence()}>
        Replay
      </button>
    </figure>
  );
}
