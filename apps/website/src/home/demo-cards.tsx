// demo-cards.tsx: the video tile the hero plays the reveal on, and the props every demo card
// shares. The wide music player and the inbox are in their own files. Names are invented.

import type { Reveal, Settings } from "@veilo-ui/core";
import { Card } from "@veilo-ui/ui";
import { useCallback, useEffect, useState } from "react";
import type { HTMLAttributes, ReactNode, Ref } from "react";
import { DemoPhoto } from "./demo-photo.tsx";
import styles from "./demo-cards.module.css";
import { HOME_VIDEO_LAYOUT, VIDEO_TEXTS } from "./demo-data.ts";
import { useLiveReveal } from "./use-live-reveal.ts";

/** Props shared by the demo cards. */
export interface DemoCardProps {
  /** The effect to play: the skeleton loader and the reveal, as settings. */
  settings: Partial<Settings>;
  /** Called with the live reveal, and with `null` when there is none. */
  onReveal: (reveal: Reveal | null) => void;
  /** Whether the card plays now (default) or waits as a skeleton until this turns true. */
  play?: boolean;
}

/**
 * What the markup views of the demo cards add to a plain element: the card's own parts can be
 * given other text (by slot name, as the playground's Content tab does), the picture can be
 * another canvas, and the root takes a ref and any element attribute.
 */
export interface DemoViewProps extends HTMLAttributes<HTMLElement> {
  /** Text to show instead of a part's own, by slot name. */
  texts?: Record<string, string>;
  /** Draws the card's picture, given the class that sizes it; the demo's own scene when absent. */
  renderPhoto?: (className: string) => ReactNode;
  /** The ref of the card's root element, which the reveal is created on. */
  innerRef?: Ref<HTMLElement>;
  /** Whether the duration badge is a slot of the reveal (default). The home page turns it off. */
  durationSlot?: boolean;
}

/**
 * The video tile's markup: a wide thumbnail with its duration, a round channel avatar, a two-line
 * title, the channel, one line with the views and the age, and a "more" button. It plays no
 * reveal itself; {@link VideoCard} does, and the playground puts its own on it.
 *
 * @param props - The text, the picture, the root's ref and element attributes.
 * @returns The card.
 */
export function VideoView(props: DemoViewProps) {
  const { texts, renderPhoto, innerRef, className, durationSlot = true, ...rest } = props;
  const text = (slot: keyof typeof VIDEO_TEXTS) => texts?.[slot] ?? VIDEO_TEXTS[slot];
  return (
    <Card
      as="article"
      raised
      ref={innerRef}
      className={className ? `${styles.card} ${className}` : styles.card}
      aria-label="Demo: a video tile"
      {...rest}
    >
      <div className={styles.thumb}>
        {renderPhoto ? (
          renderPhoto(styles.photo!)
        ) : (
          <DemoPhoto scene="video" ratio={16 / 9} slot="thumb" className={styles.photo} />
        )}
        <span
          className={styles.duration}
          data-veilo-slot={durationSlot ? "duration" : undefined}
          aria-hidden="true"
        >
          {text("duration")}
        </span>
      </div>
      <div className={styles.videoRow}>
        <span className={styles.avatar} data-veilo-slot="avatar" aria-hidden="true">
          SC
        </span>
        <div className={styles.stack}>
          <p className={styles.title} data-veilo-slot="title">
            {text("title")}
          </p>
          <p className={styles.meta} data-veilo-slot="channel">
            {text("channel")}
          </p>
          <p className={styles.meta} data-veilo-slot="stats">
            {text("stats")}
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

/**
 * A video tile that plays the reveal.
 *
 * @param props - The effect and the reveal callback.
 * @returns The card.
 */
export function VideoCard(props: DemoCardProps) {
  const [live, setLive] = useState<Reveal | null>(null);
  const [revealed, setRevealed] = useState(false);
  const { onReveal } = props;
  const track = useCallback(
    (reveal: Reveal | null) => {
      setLive(reveal);
      onReveal(reveal);
    },
    [onReveal],
  );
  const ref = useLiveReveal(props.settings, HOME_VIDEO_LAYOUT, track, props.play);
  // The duration badge is not a slot, so it waits for the end of the reveal instead.
  useEffect(() => {
    setRevealed(live?.state === "revealed");
    return live?.on("state", (state) => setRevealed(state === "revealed"));
  }, [live]);
  return <VideoView innerRef={ref} durationSlot={false} data-revealed={revealed} />;
}
