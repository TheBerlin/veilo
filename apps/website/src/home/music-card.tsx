// music-card.tsx: a wide music player the hero plays the reveal on: cover art flush on the left,
// then the track, the artist, a progress bar and the playback controls. Names are invented.

import { Card } from "@veilo-ui/ui";
import type { ReactNode } from "react";
import type { DemoCardProps, DemoViewProps } from "./demo-cards.tsx";
import { DemoPhoto } from "./demo-photo.tsx";
import styles from "./music-card.module.css";
import { MUSIC_LAYOUT, MUSIC_TEXTS } from "./demo-data.ts";
import { useLiveReveal } from "./use-live-reveal.ts";

/** Props of {@link Control}. */
interface ControlProps {
  /** The slot name the reveal finds the icon by. */
  slot: string;
  /** The SVG shapes. */
  children: ReactNode;
}

/**
 * One control glyph: a 24-unit outlined icon drawn in the text color, so every control shares
 * one style. The shapes are from the Feather icon set (MIT).
 *
 * @param props - The slot name and the shape.
 * @returns A decorative icon slot.
 */
function Control(props: ControlProps) {
  return (
    <span className={styles.control} data-veilo-slot={props.slot} aria-hidden="true">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {props.children}
      </svg>
    </span>
  );
}

/**
 * The music player's markup: square cover on the left (flush with the card's edge), then the
 * track, the artist and a small service glyph, a progress bar with the time, and the controls:
 * repeat, back, play, forward and like. It plays no reveal itself; {@link MusicCard} does, and
 * the playground puts its own on it.
 *
 * @param props - The text, the picture, the root's ref and element attributes.
 * @returns The card.
 */
export function MusicView(props: DemoViewProps) {
  const { texts, renderPhoto, innerRef, className, ...rest } = props;
  const text = (slot: keyof typeof MUSIC_TEXTS) => texts?.[slot] ?? MUSIC_TEXTS[slot];
  return (
    <Card
      as="article"
      raised
      ref={innerRef}
      className={className ? `${styles.card} ${className}` : styles.card}
      aria-label="Demo: a music player"
      {...rest}
    >
      {renderPhoto ? (
        renderPhoto(styles.cover!)
      ) : (
        <DemoPhoto scene="album" ratio={1} slot="cover" className={styles.cover} />
      )}
      <div className={styles.body}>
        <div className={styles.head}>
          <div className={styles.titles}>
            <p className={styles.track} data-veilo-slot="track">
              {text("track")}
            </p>
            <p className={styles.artist} data-veilo-slot="artist">
              {text("artist")}
            </p>
          </div>
          <Control slot="more">
            <circle cx="5" cy="12" r="1" />
            <circle cx="12" cy="12" r="1" />
            <circle cx="19" cy="12" r="1" />
          </Control>
        </div>
        <div className={styles.timeline}>
          <span className={styles.progress} data-veilo-slot="progress" aria-hidden="true" />
          <span className={styles.time} data-veilo-slot="time">
            {text("time")}
          </span>
        </div>
        <div className={styles.controls}>
          <Control slot="repeat">
            <path d="M17 1l4 4-4 4" />
            <path d="M3 11V9a4 4 0 014-4h14" />
            <path d="M7 23l-4-4 4-4" />
            <path d="M21 13v2a4 4 0 01-4 4H3" />
          </Control>
          <Control slot="back">
            <path d="M19 20L9 12l10-8v16z" />
            <path d="M5 19V5" />
          </Control>
          <span className={styles.play} data-veilo-slot="play" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5l11 7-11 7V5z" />
            </svg>
          </span>
          <Control slot="forward">
            <path d="M5 4l10 8-10 8V4z" />
            <path d="M19 5v14" />
          </Control>
          <Control slot="like">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </Control>
        </div>
      </div>
    </Card>
  );
}

/**
 * A music player that plays the reveal.
 *
 * @param props - The effect and the reveal callback.
 * @returns The card.
 */
export function MusicCard(props: DemoCardProps) {
  const ref = useLiveReveal(props.settings, MUSIC_LAYOUT, props.onReveal, props.play);
  return <MusicView innerRef={ref} />;
}
