// use-reveal.ts: runs core's reveal controller on an element for as long as a component is
// mounted.

import { createReveal, type Layout, type Reveal, type RevealOptions } from "@veilo-ui/core";
import { useEffect, useRef, type RefObject } from "react";

/**
 * How a new reveal starts: the full sequence, the Loading view only (after a Loader change), the
 * reveal from `p = 0` without loading (after a Reveal change), as in spec 1.4, or paused at one
 * progress (`frame`, for visual tests; see `RevealSequence.frame`).
 */
export type RevealStart = "sequence" | "loading" | "reveal" | "frame";

/** How {@link useReveal} starts the reveal, and who gets it. */
export interface RevealSequence {
  /** How the reveal starts. Defaults to the full sequence. */
  start?: RevealStart;
  /** Whether the first sequence loops. */
  loop?: boolean;
  /** The progress to hold when `start` is `frame`, from 0 to 1. Defaults to 0. */
  frame?: number;
  /** Called once the held frame is drawn with the final fonts (`frame` start only). */
  onFrameReady?: () => void;
  /** Receives the reveal after it is created and `null` after it is destroyed. */
  onReveal?: (reveal: Reveal | null) => void;
}

/**
 * Waits until the browser has painted twice, so work queued by the last change (such as core's
 * redraw after a font loads) has reached the screen.
 *
 * @returns A promise that resolves after two animation frames.
 */
function nextPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

/**
 * Creates a reveal on the element when the component mounts, starts it as `sequence.start` asks
 * (the full sequence by default), and destroys it on unmount, which restores the element exactly. React's development mode mounts
 * twice; the first reveal is destroyed before the second is made, so this is safe to repeat.
 * The layout, options and loop flag are read once, at mount.
 *
 * @param element - Ref to the container with the slot markup.
 * @param layout - Settings and slot hints.
 * @param options - Reveal options, such as a test scheduler.
 * @param sequence - How the first sequence runs, and who gets the reveal.
 * @returns A ref holding the live reveal, or `null` before mount and after unmount.
 */
export function useReveal(
  element: RefObject<HTMLElement | null>,
  layout: Layout,
  options?: RevealOptions,
  sequence?: RevealSequence,
): RefObject<Reveal | null> {
  const reveal = useRef<Reveal | null>(null);
  // Read once: later changes are applied by the transport and tabs, not by re-creating.
  const initial = useRef({ layout, options, sequence });

  useEffect(() => {
    const target = element.current;
    if (!target) return;
    const { layout: startLayout, options: startOptions, sequence: start } = initial.current;
    // The playground previews effects even when the viewer prefers reduced motion (spec).
    const instance = createReveal(target, startLayout, { reducedMotion: false, ...startOptions });
    reveal.current = instance;
    start?.onReveal?.(instance);
    let cancelled = false;
    if (start?.start === "loading") instance.showLoading();
    else if (start?.start === "reveal") void instance.play();
    else if (start?.start === "frame") {
      instance.seek(start.frame ?? 0);
      // Order matters: seek draws once the reveal is ready, and core draws the glyphs again when
      // their font loads, so wait for every font and then for paint before calling it final.
      void instance.ready
        .then(() => document.fonts.ready)
        .then(nextPaint)
        .then(() => {
          if (!cancelled) start.onFrameReady?.();
        });
    } else instance.playSequence({ loop: start?.loop ?? false });
    return () => {
      cancelled = true;
      instance.destroy();
      if (reveal.current === instance) reveal.current = null;
      start?.onReveal?.(null);
    };
  }, [element]);

  return reveal;
}
