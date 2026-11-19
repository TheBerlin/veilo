// transport-bar.tsx: the playback controls under the stage (spec 1.4), in one row: Play sequence,
// Replay reveal, Loading state, the scrubber, the time readout and the state label, then an
// Options button that opens Loop and the reduced-motion preview.

import type { Reveal, RevealState } from "@veilo-ui/core";
import { Button, Popover, PopoverContent, PopoverTrigger, Scrubber, Toggle } from "@veilo-ui/ui";
import { useEffect, useState } from "react";
import styles from "./transport-bar.module.css";

/** Props of {@link TransportBar}. */
export interface TransportBarProps {
  /** The card's live reveal, or `null` while none is mounted (the controls are disabled). */
  reveal: Reveal | null;
  /** Reveal duration in seconds (`rDur`), for the time readout. */
  duration: number;
  /** Whether sequences loop. */
  loop: boolean;
  /** Called with the new loop flag. */
  onLoopChange: (loop: boolean) => void;
  /** Whether the preview shows what viewers with reduced motion see. */
  reducedMotion: boolean;
  /** Called with the new reduced-motion flag; the stage then rebuilds the card. */
  onReducedMotionChange: (reducedMotion: boolean) => void;
}

/**
 * The state label of spec 1.4.
 *
 * @param state - The reveal state.
 * @param progress - The reveal progress, 0 to 1.
 * @returns `Loading`, `Revealing 42%` or `Revealed`.
 */
export function stateLabel(state: RevealState, progress: number): string {
  if (state === "revealed") return "Revealed";
  if (state === "revealing") return `Revealing ${Math.round(progress * 100)}%`;
  // Idle only lasts until the first sequence starts, which begins with loading.
  return "Loading";
}

/**
 * The time readout of spec 1.4: elapsed and total reveal time.
 *
 * @param progress - The reveal progress, 0 to 1.
 * @param duration - Reveal duration in seconds.
 * @returns For example `0.84 / 1.04 s`.
 */
export function timeReadout(progress: number, duration: number): string {
  return `${(progress * duration).toFixed(2)} / ${duration.toFixed(2)} s`;
}

/**
 * The transport bar. Side effects: listens to the reveal's events and drives it.
 *
 * @param props - The reveal, duration, and the loop and reduced-motion flags.
 * @returns The toolbar.
 */
export function TransportBar(props: TransportBarProps) {
  const { reveal, duration, loop } = props;
  const [state, setState] = useState<RevealState>("idle");
  const [progress, setProgress] = useState(0);

  // Follow the reveal; a new card brings a new reveal.
  useEffect(() => {
    if (!reveal) return;
    setState(reveal.state);
    setProgress(reveal.progress);
    const offState = reveal.on("state", (next) => {
      setState(next);
      // Loading always restarts the reveal at 0.
      if (next === "loading") setProgress(0);
    });
    const offProgress = reveal.on("progress", setProgress);
    return () => {
      offState();
      offProgress();
    };
  }, [reveal]);

  const onLoop = (next: boolean) => {
    props.onLoopChange(next);
    // Restart, so a running loop stops or a single run starts looping at once.
    reveal?.playSequence({ loop: next });
  };

  return (
    <div className={styles.bar} role="toolbar" aria-label="Playback">
      <div className={styles.main}>
        <div className={styles.buttons}>
          <Button
            variant="primary"
            size="sm"
            disabled={!reveal}
            onClick={() => reveal?.playSequence({ loop })}
          >
            Play sequence
          </Button>
          <Button size="sm" disabled={!reveal} onClick={() => void reveal?.play()}>
            Replay reveal
          </Button>
          <Button size="sm" disabled={!reveal} onClick={() => reveal?.showLoading()}>
            Loading state
          </Button>
        </div>
        <Scrubber
          className={styles.scrubber}
          aria-label="Reveal progress"
          value={progress}
          disabled={!reveal}
          onValueChange={(p) => reveal?.seek(p)}
        />
        <span className={styles.readout}>{timeReadout(progress, duration)}</span>
        <span className={styles.state} role="status">
          {stateLabel(state, progress)}
        </span>
        <Popover>
          <PopoverTrigger asChild>
            <Button size="sm" variant="ghost">
              Preview options
            </Button>
          </PopoverTrigger>
          <PopoverContent aria-label="Preview options" side="top" className={styles.options}>
            <Toggle
              label="Loop preview"
              checked={loop}
              onCheckedChange={onLoop}
              disabled={!reveal}
            />
            {/* Not disabled without a reveal: it rebuilds the card, which makes a new one. */}
            <Toggle
              label="Reduced motion"
              checked={props.reducedMotion}
              onCheckedChange={props.onReducedMotionChange}
            />
            <p className={styles.hint}>
              Reduced motion shows what visitors who ask for it will see.
            </p>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
