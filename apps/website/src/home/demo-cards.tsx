// demo-cards.tsx: the video tile the hero plays the reveal on, and the props every demo card
// shares. The wide music player and the inbox are in their own files. Names are invented.

import type { Reveal, Settings } from "@veilo/core";
import { Card } from "@veilo/ui";
import { DemoPhoto } from "./demo-photo.tsx";
import styles from "./demo-cards.module.css";
import { useLiveReveal } from "./use-live-reveal.ts";

/** Props shared by the demo cards. */
export interface DemoCardProps {
  /** The effect to play: the skeleton loader and the reveal, as settings. */
  settings: Partial<Settings>;
  /** Called with the live reveal, and with `null` when there is none. */
  onReveal: (reveal: Reveal | null) => void;
}

/** Slot hints of the video tile. */
const VIDEO_LAYOUT = {
  version: 1,
  slots: {
    thumb: { role: "image" },
    duration: { role: "block" },
    avatar: { role: "block" },
    title: { role: "text", lines: 2, width: 80 },
    channel: { role: "text", width: 46 },
    stats: { role: "text", width: 72 },
    more: { role: "block" },
  },
} as const;

/**
 * A video tile: a wide thumbnail with its duration, a round channel avatar, a two-line title, the
 * channel, one line with the views and the age, and a "more" button.
 *
 * @param props - The effect and the reveal callback.
 * @returns The card.
 */
export function VideoCard(props: DemoCardProps) {
  const ref = useLiveReveal(props.settings, VIDEO_LAYOUT, props.onReveal);
  return (
    <Card as="article" raised ref={ref} className={styles.card} aria-label="Demo: a video tile">
      <div className={styles.thumb}>
        <DemoPhoto scene="street" ratio={16 / 9} slot="thumb" className={styles.photo} />
        <span className={styles.duration} data-veilo-slot="duration" aria-hidden="true">
          12:48
        </span>
      </div>
      <div className={styles.videoRow}>
        <span className={styles.avatar} data-veilo-slot="avatar" aria-hidden="true">
          SC
        </span>
        <div className={styles.stack}>
          <p className={styles.title} data-veilo-slot="title">
            Night walk through the old town in 4K, no talking
          </p>
          <p className={styles.meta} data-veilo-slot="channel">
            Slow Cities
          </p>
          <p className={styles.meta} data-veilo-slot="stats">
            482K views · 3 days ago
          </p>
        </div>
        <span className={styles.more} data-veilo-slot="more" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5" r="1.8" />
            <circle cx="12" cy="12" r="1.8" />
            <circle cx="12" cy="19" r="1.8" />
          </svg>
        </span>
      </div>
    </Card>
  );
}
