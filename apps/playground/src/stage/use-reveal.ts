// use-reveal.ts: runs core's reveal controller on an element for as long as a component is
// mounted.

import { createReveal, type Layout, type Reveal, type RevealOptions } from "@veilo/core";
import { useEffect, useRef, type RefObject } from "react";

/**
 * How a new reveal starts: the full sequence, the Loading view only (after a Loader change), or
 * the reveal from `p = 0` without loading (after a Reveal change), as in spec 1.4.
 */
export type RevealStart = "sequence" | "loading" | "reveal";

/** How {@link useReveal} starts the reveal, and who gets it. */
export interface RevealSequence {
  /** How the reveal starts. Defaults to the full sequence. */
  start?: RevealStart;
  /** Whether the first sequence loops. */
  loop?: boolean;
  /** Receives the reveal after it is created and `null` after it is destroyed. */
  onReveal?: (reveal: Reveal | null) => void;
}

/**
 * Creates a reveal on the element when the component mounts, starts the full sequence, and
 * destroys it on unmount, which restores the element exactly. React's development mode mounts
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
    if (start?.start === "loading") instance.showLoading();
    else if (start?.start === "reveal") void instance.play();
    else instance.playSequence({ loop: start?.loop ?? false });
    return () => {
      instance.destroy();
      if (reveal.current === instance) reveal.current = null;
      start?.onReveal?.(null);
    };
  }, [element]);

  return reveal;
}
