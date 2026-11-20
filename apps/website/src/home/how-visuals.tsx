// how-visuals.tsx: the visuals of "How it works": a clip of the playground for Tune, the live music
// player card with a scrubber for Preview, and a clip with the install command for Export.

import type { Reveal, RevealState } from "@veilo-ui/core";
import { Button, CodeBlock, Scrubber } from "@veilo-ui/ui";
import { useEffect, useState } from "react";
import { ClipVisual } from "./clip-visual.tsx";
import { HERO_SETTINGS } from "./hero-effect.ts";
import styles from "./how-visuals.module.css";
import { MusicCard } from "./music-card.tsx";
import { useAlbumCover } from "./use-album-cover.ts";

/** The words for a reveal's state, shown beside the scrubber. */
const STATE_WORDS: Record<RevealState, string> = {
  // Before the card has started anything, the data is simply not there yet.
  idle: "Loading",
  loading: "Loading",
  revealing: "Revealing",
  revealed: "Revealed",
};

/** Props of {@link MusicVisual}. */
export interface MusicVisualProps {
  /**
   * What the page drives (for example from scrolling): `"loading"` shows the skeleton, as while
   * data is still on its way, and a number from 0 to 1 shows that exact frame of the reveal. When
   * given, the scrubber only displays it and Replay is left out. When omitted, the card plays its
   * skeleton and then the reveal by itself, and the visitor scrubs it and can replay it.
   */
  scrub?: number | "loading";
}

/**
 * The music player card with a scrubber under it, for the Preview step. The reveal plays once by
 * itself; the scrubber follows it, and dragging it stops playback and shows the exact frame,
 * because every frame is a function of progress. Replay plays it again. With `scrub` the page sets
 * the progress instead.
 *
 * Side effects: follows the reveal's progress and state events while mounted; seeks it when `scrub`
 * changes.
 *
 * @param props - The optional page-driven state.
 * @returns The visual.
 */
export function MusicVisual(props: MusicVisualProps) {
  const { scrub } = props;
  const [reveal, setReveal] = useState<Reveal | null>(null);
  const [progress, setProgress] = useState(0);
  const [state, setState] = useState<RevealState>("loading");
  const coverReady = useAlbumCover();
  const driven = scrub !== undefined;
  // The word under the card in Preview: the state of the reveal, without numbers. When the page
  // drives the card, the state comes from what it asked for.
  const shown: RevealState = driven
    ? scrub === "loading"
      ? "loading"
      : scrub >= 1
        ? "revealed"
        : "revealing"
    : state;

  useEffect(() => {
    if (!reveal) return;
    setProgress(reveal.progress);
    setState(reveal.state);
    const stopProgress = reveal.on("progress", setProgress);
    const stopState = reveal.on("state", setState);
    return () => {
      stopProgress();
      stopState();
    };
  }, [reveal]);

  // When the page drives the card (the pinned story: first the skeleton, then scrolling scrubs the
  // reveal), show exactly that. Showing the skeleton or seeking also stops the sequence the card
  // started on its own.
  useEffect(() => {
    if (!reveal || scrub === undefined) return;
    if (scrub === "loading") {
      reveal.showLoading();
      setProgress(0);
    } else {
      reveal.seek(scrub);
      setProgress(scrub);
    }
  }, [reveal, scrub]);

  return (
    <div className={styles.panel}>
      {/* The slot keeps the card's height while the cover loads, so nothing shifts. */}
      <div className={styles.slot}>
        {coverReady ? <MusicCard settings={HERO_SETTINGS} onReveal={setReveal} /> : null}
      </div>
      <div className={`${styles.scrub} ${styles.row}`}>
        <Scrubber
          aria-label="Reveal progress"
          value={progress}
          disabled={!reveal || driven}
          onValueChange={(next) => {
            setProgress(next);
            reveal?.seek(next);
          }}
        />
        <span className={styles.readout} aria-hidden="true">
          {STATE_WORDS[shown]}
        </span>
        {driven ? null : (
          <Button size="sm" disabled={!reveal} onClick={() => reveal?.playSequence()}>
            Replay
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Step 1: a clip of the playground choosing a card, a preset and moving a slider.
 *
 * @returns The visual.
 */
export function TuneVisual() {
  return (
    <div className={styles.panel}>
      <ClipVisual
        name="tune"
        description="The Veilo playground: choosing a card layout, a preset and moving a slider, with the card replaying after each change."
      />
    </div>
  );
}

/** Props of {@link PreviewVisual}. */
export interface PreviewVisualProps {
  /**
   * What the page drives: `"loading"` for the skeleton, or a progress from 0 to 1 for that exact
   * frame of the reveal. When given, the scrubber only displays it and Replay is left out. When
   * omitted, the reveal plays by itself and the visitor scrubs it.
   */
  scrub?: number | "loading";
}

/**
 * Step 2: the music player with a scrubber under it. The reveal plays once by itself; the scrubber
 * follows it, and dragging it stops playback and shows the exact frame, because every frame is a
 * function of progress. Replay plays it again. With `scrub` the page sets the progress instead.
 *
 * @param props - The optional page-driven state.
 * @returns The visual.
 */
export function PreviewVisual(props: PreviewVisualProps = {}) {
  return <MusicVisual scrub={props.scrub} />;
}

/** The install command shown in the Export step. */
export const EXPORT_INSTALL = "npm install @veilo-ui/react";

/**
 * Step 3: a clip of the playground's Export drawer choosing React and copying the code, with the
 * install command under it. The packages are not published yet, so a line says so.
 *
 * @returns The visual.
 */
export function ExportVisual() {
  return (
    <div className={styles.panel}>
      <ClipVisual
        name="export"
        description="The Veilo playground's Export drawer: choosing React from the format list and copying the code."
      />
      <CodeBlock
        className={styles.code}
        code={EXPORT_INSTALL}
        prompt
        aria-label="Install command"
      />
      <p className={styles.note}>
        The packages arrive with the first public release. The playground exports the same settings
        today.
      </p>
    </div>
  );
}
