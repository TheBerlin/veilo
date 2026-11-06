// transport-bar.tsx: the playback controls under the stage (spec 1.4): Play sequence, Loading
// state, Replay reveal, Loop, the scrubber, the time readout and the state label.

import type { Reveal, RevealState } from "@veilo/core";
import { Button, Scrubber, Toggle } from "@veilo/ui";
import { useEffect, useState, type ReactNode } from "react";
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
  /** Extra tools shown at the end of the bar, such as the image picker. */
  children?: ReactNode;
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
 * @param props - The reveal, duration, loop flag and extra tools.
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
      <div className={styles.row}>
        <Button
          variant="primary"
          size="sm"
          disabled={!reveal}
          onClick={() => reveal?.playSequence({ loop })}
        >
          Play sequence
        </Button>
        <Button size="sm" disabled={!reveal} onClick={() => reveal?.showLoading()}>
          Loading state
        </Button>
        <Button size="sm" disabled={!reveal} onClick={() => void reveal?.play()}>
          Replay reveal
        </Button>
        <Toggle label="Loop" checked={loop} onCheckedChange={onLoop} disabled={!reveal} />
      </div>
      <Scrubber
        className={styles.scrubber}
        aria-label="Reveal progress"
        value={progress}
        disabled={!reveal}
        onValueChange={(p) => reveal?.seek(p)}
      />
      <div className={styles.row}>
        <span className={styles.readout}>{timeReadout(progress, duration)}</span>
        <span className={styles.state} role="status">
          {stateLabel(state, progress)}
        </span>
        {props.children}
      </div>
    </div>
  );
}
