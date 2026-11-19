// how-visuals.tsx: the live visuals of "How it works": the music player card for the Design and
// Preview steps (the same card, so the section shows one thing at a time), and the code for the
// Export step.

import type { Reveal, RevealState } from "@veilo-ui/core";
import { Button, CodeBlock, Scrubber } from "@veilo-ui/ui";
import { useEffect, useRef, useState } from "react";
import { DemoReadout } from "./demo-readout.tsx";
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
   * What the card is showing. `design`: the effect plays by itself and rests on the finished card,
   * with a readout and Replay under it. `preview`: the card plays its skeleton and then the reveal
   * by itself, and a scrubber under it follows the progress; the visitor can drag it to go frame by
   * frame, or replay.
   */
  mode: "design" | "preview";
  /**
   * In `preview`, what the page drives (for example from scrolling): `"loading"` shows the
   * skeleton, as while data is still on its way, and a number from 0 to 1 shows that exact frame of
   * the reveal. When given, the scrubber only displays it and Replay is left out. When omitted, the
   * visitor scrubs the card and can replay it.
   */
  scrub?: number | "loading";
}

/**
 * The music player card with the row under it that the step needs. One component serves both
 * steps, so when the pinned story moves from Design to Preview the card stays where it is and only
 * the row under it changes (the same instance is kept, because the element type and position are
 * the same): the card plays its reveal in `design`, and a scrubber takes over in `preview`.
 *
 * Side effects: follows the reveal's progress and state events while mounted; seeks it when `scrub`
 * changes; plays the sequence again when the mode changes between `design` and `preview`.
 *
 * @param props - The mode and the optional page-driven progress.
 * @returns The visual.
 */
export function MusicVisual(props: MusicVisualProps) {
  const { mode, scrub } = props;
  const [reveal, setReveal] = useState<Reveal | null>(null);
  const [progress, setProgress] = useState(0);
  const [state, setState] = useState<RevealState>("loading");
  const coverReady = useAlbumCover();
  const driven = mode === "preview" && scrub !== undefined;
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
    if (!reveal || mode !== "preview" || scrub === undefined) return;
    if (scrub === "loading") {
      reveal.showLoading();
      setProgress(0);
    } else {
      reveal.seek(scrub);
      setProgress(scrub);
    }
  }, [reveal, mode, scrub]);

  // A change between Design and Preview: the card plays its skeleton and reveal again, at its own
  // pace, unless the page drives it. Not on the first render, where the card has already started
  // its own sequence.
  const previous = useRef(mode);
  useEffect(() => {
    if (previous.current !== mode && !driven) reveal?.playSequence();
    previous.current = mode;
  }, [reveal, mode, driven]);

  return (
    <div className={styles.panel}>
      {/* The slot keeps the card's height while the cover loads, so nothing shifts. */}
      <div className={styles.slot}>
        {coverReady ? <MusicCard settings={HERO_SETTINGS} onReveal={setReveal} /> : null}
      </div>
      {mode === "design" ? (
        <div className={`${styles.status} ${styles.row}`}>
          <DemoReadout reveal={reveal} />
          <Button size="sm" disabled={!reveal} onClick={() => reveal?.playSequence()}>
            Replay
          </Button>
        </div>
      ) : (
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
      )}
    </div>
  );
}

/**
 * Step 1: the music player playing its reveal, with Replay under it.
 *
 * @returns The visual.
 */
export function DesignVisual() {
  return <MusicVisual mode="design" />;
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
  return <MusicVisual mode="preview" scrub={props.scrub} />;
}

/** The install command shown in the Export step. */
export const EXPORT_INSTALL = "npm install @veilo-ui/react";

/** A short React example for the Export step: slots on the parts, one wrapper, one preset. */
export const EXPORT_SNIPPET = `import { Reveal } from "@veilo-ui/react";

<Reveal preset="dot-upscale" ready={!loading}>
  <img data-veilo-slot="photo" src={image} alt={name} />
  <h2 data-veilo-slot="title">{name}</h2>
  <p data-veilo-slot="price">{price}</p>
</Reveal>`;

/**
 * Step 3: the install command and a React example. The packages are not published yet, so a
 * line says so.
 *
 * @returns The visual.
 */
export function ExportVisual() {
  return (
    <div className={styles.panel}>
      <CodeBlock
        className={styles.code}
        code={EXPORT_INSTALL}
        prompt
        aria-label="Install command"
      />
      <CodeBlock className={styles.code} code={EXPORT_SNIPPET} aria-label="React example" />
      <p className={styles.note}>
        The packages arrive with the first public release. The playground exports the same settings
        today.
      </p>
    </div>
  );
}
