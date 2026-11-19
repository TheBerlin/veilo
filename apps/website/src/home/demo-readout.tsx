// demo-readout.tsx: the state and progress shown under a live card, as data.

import type { Reveal, RevealState } from "@veilo-ui/core";
import { useEffect, useRef } from "react";
import styles from "./demo-readout.module.css";

/**
 * The words for a reveal's state and progress.
 *
 * @param state - The reveal's state.
 * @param progress - Progress from 0 to 1.
 * @returns For example "Loading", "Revealing  42%" or "Revealed".
 */
export function readoutLabel(state: RevealState, progress: number): string {
  if (state === "revealing")
    return `Revealing ${String(Math.round(progress * 100)).padStart(2, " ")}%`;
  return state === "revealed" ? "Revealed" : "Loading";
}

/** Props of {@link DemoReadout}. */
export interface DemoReadoutProps {
  /** The reveal to follow, or `null` while there is none. */
  reveal: Reveal | null;
}

/**
 * A small readout of a reveal: a state label and a progress bar. It writes to the DOM directly,
 * so a frame-by-frame progress change does not re-render React. It is decoration for sighted
 * visitors, so it is hidden from screen readers; the reveal's state is also kept in
 * `data-demo-state`, which the tests read.
 *
 * @param props - The reveal to follow.
 * @returns The readout element.
 */
export function DemoReadout(props: DemoReadoutProps) {
  const { reveal } = props;
  const root = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const fill = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!reveal) return;
    const show = () => {
      const { state, progress } = reveal;
      if (root.current) root.current.dataset.demoState = state;
      if (label.current) label.current.textContent = readoutLabel(state, progress);
      // The bar is empty while loading, and follows progress after that.
      if (fill.current)
        fill.current.style.transform = `scaleX(${state === "loading" ? 0 : progress})`;
    };
    show();
    const stopState = reveal.on("state", show);
    const stopProgress = reveal.on("progress", show);
    return () => {
      stopState();
      stopProgress();
    };
  }, [reveal]);

  return (
    <div ref={root} className={styles.readout} data-demo-state="idle" aria-hidden="true">
      <span ref={label} className={styles.label}>
        Loading
      </span>
      <span className={styles.bar}>
        <i ref={fill} className={styles.fill} />
      </span>
    </div>
  );
}
