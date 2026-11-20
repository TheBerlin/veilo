// motion-demo.tsx: the "Reduced motion" demo: a small card on the real engine and a switch. Flip the
// switch and the same card behaves the way it does for a visitor who asks for less motion: the
// skeleton stands still, and the content appears at once instead of being revealed. The switch
// starts where the visitor's own setting is.

import { useReveal } from "@veilo-ui/react";
import { Toggle } from "@veilo-ui/ui";
import { useEffect, useState } from "react";
import { DemoPhoto } from "./demo-photo.tsx";
import { HERO_SETTINGS } from "./hero-effect.ts";
import styles from "./motion-demo.module.css";
import { useAlbumCover } from "./use-album-cover.ts";
import { useReducedMotion } from "./use-reduced-motion.ts";
import type { DemoProps } from "./why-tiles.tsx";

/** Slot hints of the card: the photo and two lines of text. */
const CARD_LAYOUT = {
  version: 1,
  slots: {
    photo: { role: "image" },
    title: { role: "text", width: 90 },
    meta: { role: "text", width: 65 },
  },
} as const;

/** What the line under the switch says for each state. */
const EXPLAIN = {
  off: "The skeleton shimmers, then the reveal plays, over and over.",
  on: "The skeleton stands still and the content appears at once, with no repeat.",
} as const;

/** Props of {@link MotionCard}. */
interface MotionCardProps {
  /** Whether the card behaves as for a visitor who asks for less motion. */
  reduced: boolean;
  /** Whether the tile has come into view. */
  active: boolean;
}

/**
 * The card: a real reveal on a photo and two lines. The reveal reads the motion option when it is
 * created, so the demo gives this component a new key when the switch flips. With less motion the
 * sequence runs once, a still skeleton and then the content; otherwise it loops.
 *
 * Side effects: creates a reveal through `useReveal` and destroys it on unmount; starts the
 * sequence when `active` turns true.
 *
 * @param props - The motion state and whether the tile is in view.
 * @returns The card, hidden from assistive technology (the switch and the line carry the meaning).
 */
function MotionCard(props: MotionCardProps) {
  const { reduced, active } = props;
  const { ref, reveal } = useReveal<HTMLDivElement>(
    { settings: HERO_SETTINGS, layout: CARD_LAYOUT },
    { reducedMotion: reduced },
  );
  useEffect(() => {
    if (!active || !reveal) return;
    reveal.playSequence({ loop: !reduced });
  }, [active, reveal, reduced]);
  return (
    <div ref={ref} className={styles.card} aria-hidden="true">
      <DemoPhoto scene="album" ratio={2} slot="photo" className={styles.photo} />
      <p className={styles.title} data-veilo-slot="title">
        Aero desk lamp
      </p>
      <p className={styles.meta} data-veilo-slot="meta">
        $48 · In stock
      </p>
    </div>
  );
}

/**
 * The demo: the card, the switch and a line that says what the switch does. The switch starts at
 * the visitor's own setting and, once they flip it, stays where they put it.
 *
 * Side effects: loads the shared cover photograph; follows the motion preference until the visitor
 * flips the switch.
 *
 * @param props - Whether the tile has come into view.
 * @returns The card, the switch and the line.
 */
export function MotionDemo(props: DemoProps) {
  const ready = useAlbumCover();
  const system = useReducedMotion();
  // Null until the visitor flips the switch: then the system setting no longer decides.
  const [chosen, setChosen] = useState<boolean | null>(null);
  const reduced = chosen ?? system;
  return (
    <div className={styles.demo}>
      {ready ? <MotionCard key={String(reduced)} reduced={reduced} active={props.active} /> : null}
      <Toggle label="Reduced motion" checked={reduced} onCheckedChange={setChosen} />
      <p className={styles.explain} aria-live="polite">
        {reduced ? EXPLAIN.on : EXPLAIN.off}
      </p>
    </div>
  );
}
