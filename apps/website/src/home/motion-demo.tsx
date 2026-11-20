// motion-demo.tsx: the "Reduced motion" demo: a small card on the real engine, a switch and a Play
// button. The card rests on its finished state and nothing moves until the visitor asks: flip the
// switch or press Play and the card loads once. With the switch off the skeleton shimmers and the
// content is revealed; with it on the card behaves as it does for a visitor who asks for less
// motion: the skeleton stands still and the content appears at once. The switch starts where the
// visitor's own setting is.

import { useReveal } from "@veilo-ui/react";
import { Button, Toggle } from "@veilo-ui/ui";
import { useEffect, useState } from "react";
import { DemoPhoto } from "./demo-photo.tsx";
import { HERO_SETTINGS } from "./hero-effect.ts";
import styles from "./motion-demo.module.css";
import { useAlbumCover } from "./use-album-cover.ts";
import { useReducedMotion } from "./use-reduced-motion.ts";

/** Slot hints of the card: the photo and two lines of text. */
const CARD_LAYOUT = {
  version: 1,
  slots: {
    photo: { role: "image" },
    title: { role: "text", width: 90 },
    meta: { role: "text", width: 65 },
  },
} as const;

/**
 * What the line under the controls says: at first how to start, and once the visitor has run the
 * card, what the switch does.
 */
const EXPLAIN = {
  rest: "Press Play, or flip the switch, to load the card.",
  off: "Off: the skeleton shimmers, then the reveal plays.",
  on: "On: the skeleton stands still and the content appears at once.",
} as const;

/** Props of {@link MotionCard}. */
interface MotionCardProps {
  /** Whether the card behaves as for a visitor who asks for less motion. */
  reduced: boolean;
  /** Whether the visitor has asked for a run. Until then the card rests, finished. */
  play: boolean;
}

/**
 * The card: a real reveal on a photo and two lines. The reveal reads the motion option when it is
 * created, so the demo gives this component a new key whenever the switch flips or Play is pressed.
 * It plays its sequence once, and only when asked: a skeleton, then the content.
 *
 * Side effects: creates a reveal through `useReveal` and destroys it on unmount; starts one
 * sequence when `play` is true.
 *
 * @param props - The motion state and whether to play.
 * @returns The card, hidden from assistive technology (the controls and the line carry the meaning).
 */
function MotionCard(props: MotionCardProps) {
  const { reduced, play } = props;
  const { ref, reveal } = useReveal<HTMLDivElement>(
    { settings: HERO_SETTINGS, layout: CARD_LAYOUT },
    { reducedMotion: reduced },
  );
  useEffect(() => {
    if (play && reveal) reveal.playSequence();
  }, [play, reveal]);
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
 * The demo: the card at rest, the switch, a Play button and a line that says what the switch does.
 * The switch starts at the visitor's own setting and, once they flip it, stays where they put it.
 * Flipping the switch or pressing Play makes the card load once; nothing moves before that, so the
 * section's one looping demo is the layout one.
 *
 * Side effects: loads the shared cover photograph; follows the motion preference until the visitor
 * flips the switch.
 *
 * @returns The card, the controls and the line.
 */
export function MotionDemo() {
  const ready = useAlbumCover();
  const system = useReducedMotion();
  // Null until the visitor flips the switch: then the system setting no longer decides.
  const [chosen, setChosen] = useState<boolean | null>(null);
  // How many runs the visitor has asked for; the card is made again for each one.
  const [runs, setRuns] = useState(0);
  const reduced = chosen ?? system;
  return (
    <div className={styles.demo}>
      {/* The value the card is following, as CSS writes it: the switch previews this setting. */}
      <code className={styles.label}>
        {`prefers-reduced-motion: ${reduced ? "reduce" : "no-preference"}`}
      </code>
      {ready ? <MotionCard key={`${reduced}-${runs}`} reduced={reduced} play={runs > 0} /> : null}
      <div className={styles.controls}>
        <Toggle
          label="Reduced motion"
          checked={reduced}
          onCheckedChange={(next) => {
            setChosen(next);
            setRuns((count) => count + 1);
          }}
        />
        <Button variant="secondary" size="sm" onClick={() => setRuns((count) => count + 1)}>
          {runs === 0 ? "Play" : "Play again"}
        </Button>
      </div>
      <p className={styles.explain} aria-live="polite">
        {runs === 0 ? EXPLAIN.rest : reduced ? EXPLAIN.on : EXPLAIN.off}
      </p>
    </div>
  );
}
